import { INDIAN_CITIES, TAX_CONFIG } from '../config/cityConfig.js';
import { GoldApiProvider } from '../providers/goldApiProvider.js';
import { GoldPriceDevProvider } from '../providers/goldpriceDevProvider.js';
import { MockProvider } from '../providers/mockProvider.js';
import { GoldPriceProvider } from '../providers/providerInterface.js';
import { RealtimeMarketProvider } from '../providers/realtimeProvider.js';
import { CityConfig, CityGoldRate, GoldApiResponse, HistoricalPricePoint, RawMarketData } from '../types/index.js';
import { GoldCalculationService } from './goldCalculationService.js';

export class GoldCacheService {
  private static instance: GoldCacheService;

  private provider: GoldPriceProvider;
  private fallbackProvider: GoldPriceProvider;
  private cachedMarketData: RawMarketData | null = null;
  private lastSuccessfulFetchTime = 0;
  private lastCheckedTimestamp = new Date().toISOString();
  private inFlightPromise: Promise<RawMarketData> | null = null;
  private cacheTtlMs = 10000; // 10 seconds cache TTL
  private consecutiveErrors = 0;
  private lastError: string | null = null;

  // In-memory rolling history cache
  private historyCache: Map<string, { data: HistoricalPricePoint[]; cachedAt: number }> = new Map();

  private constructor() {
    const providerChoice = (process.env.GOLD_API_PROVIDER || 'goldprice.dev').toLowerCase();
    const goldApiKey = process.env.GOLDPRICE_DEV_API_KEY || process.env.GOLD_API_KEY || '';

    this.fallbackProvider = new RealtimeMarketProvider();

    if (providerChoice === 'mock') {
      this.provider = new MockProvider();
    } else if (providerChoice === 'goldapi' && goldApiKey) {
      this.provider = new GoldApiProvider(goldApiKey);
    } else {
      // Default: goldprice.dev official API
      this.provider = new GoldPriceDevProvider(goldApiKey);
    }

    const envTtl = parseInt(process.env.CACHE_TTL_SECONDS || '10', 10);
    if (!isNaN(envTtl) && envTtl >= 5) {
      this.cacheTtlMs = envTtl * 1000;
    }
  }

  public static getInstance(): GoldCacheService {
    if (!GoldCacheService.instance) {
      GoldCacheService.instance = new GoldCacheService();
    }
    return GoldCacheService.instance;
  }

  public getProviderName(): string {
    return this.provider.name;
  }

  /**
   * Fetches latest market data with single shared deduplication & rate-limiting protection.
   */
  public async getLatestMarketData(forceRefresh = false): Promise<{ data: RawMarketData; lastChecked: string; isStale: boolean }> {
    const now = Date.now();
    this.lastCheckedTimestamp = new Date().toISOString();

    const isCacheValid = this.cachedMarketData && (now - this.lastSuccessfulFetchTime < this.cacheTtlMs) && !forceRefresh;

    if (isCacheValid && this.cachedMarketData) {
      return {
        data: this.cachedMarketData,
        lastChecked: this.lastCheckedTimestamp,
        isStale: (now - this.lastSuccessfulFetchTime) > 60000,
      };
    }

    // Deduplicate concurrent requests
    if (this.inFlightPromise) {
      try {
        const sharedData = await this.inFlightPromise;
        return {
          data: sharedData,
          lastChecked: this.lastCheckedTimestamp,
          isStale: (now - this.lastSuccessfulFetchTime) > 60000,
        };
      } catch (err) {
        // If in-flight failed, fall back to cached if present
        if (this.cachedMarketData) {
          return {
            data: this.cachedMarketData,
            lastChecked: this.lastCheckedTimestamp,
            isStale: true,
          };
        }
      }
    }

    // Launch refresh
    this.inFlightPromise = (async () => {
      try {
        let fresh: RawMarketData;
        try {
          fresh = await this.provider.fetchLatest();
        } catch (primaryErr) {
          console.warn('[Cache] Primary provider error, failing over to secondary backup:', (primaryErr as any)?.message);
          fresh = await this.fallbackProvider.fetchLatest();
        }
        this.cachedMarketData = fresh;
        this.lastSuccessfulFetchTime = Date.now();
        this.consecutiveErrors = 0;
        this.lastError = null;
        return fresh;
      } catch (err: any) {
        this.consecutiveErrors++;
        this.lastError = err?.message || 'Upstream provider connection error';

        if (this.cachedMarketData) {
          // Gracefully retain last valid market quote
          return this.cachedMarketData;
        }
        throw err;
      } finally {
        this.inFlightPromise = null;
      }
    })();

    const result = await this.inFlightPromise;
    const isStale = (Date.now() - this.lastSuccessfulFetchTime) > 60000;

    return {
      data: result,
      lastChecked: this.lastCheckedTimestamp,
      isStale,
    };
  }

  /**
   * Gets pricing for a specific city.
   */
  public async getCityGoldRate(cityIdOrName: string): Promise<GoldApiResponse> {
    const { data: marketData, lastChecked, isStale } = await this.getLatestMarketData();

    const normalized = cityIdOrName.trim().toLowerCase();
    const city = INDIAN_CITIES.find(
      (c) => c.id.toLowerCase() === normalized || c.name.toLowerCase() === normalized
    ) || INDIAN_CITIES[0]; // Default to Hyderabad

    const cityRate = GoldCalculationService.buildCityRates(city, marketData, lastChecked);
    const rawInr24k = GoldCalculationService.calculateRawInrPerGram(marketData.goldSpotUsdPerOz, marketData.usdInrRate);
    const retailBenchmark = GoldCalculationService.calculateIndianRetailBenchmarkPerGram24K(rawInr24k);

    return {
      success: true,
      data: cityRate,
      marketMeta: {
        goldSpotUsdPerOz: marketData.goldSpotUsdPerOz,
        usdInrRate: marketData.usdInrRate,
        rawInrPerGram24k: Math.round(rawInr24k * 100) / 100,
        importDutyPercent: TAX_CONFIG.importDutyPercent,
        gstPercent: TAX_CONFIG.gstPercent,
        retailBenchmarkPerGram24k: Math.round(retailBenchmark * 100) / 100,
        providerName: marketData.providerName,
        sourceTimestamp: marketData.timestamp,
        lastCheckedTimestamp: lastChecked,
        isDemo: marketData.isDemo,
        isStale,
      },
      disclaimer: 'Indicative gold rates for informational purposes only. Actual jewellery prices may vary by city, jeweller, taxes, making charges, and applicable fees.',
    };
  }

  /**
   * Gets pricing comparison for all 16 Indian cities.
   */
  public async getAllCities(): Promise<{
    cities: CityGoldRate[];
    lastChecked: string;
    sourceTimestamp: string;
    providerName: string;
    isDemo: boolean;
  }> {
    const { data: marketData, lastChecked } = await this.getLatestMarketData();

    const cities = INDIAN_CITIES.map((city) =>
      GoldCalculationService.buildCityRates(city, marketData, lastChecked)
    );

    return {
      cities,
      lastChecked,
      sourceTimestamp: marketData.timestamp,
      providerName: marketData.providerName,
      isDemo: marketData.isDemo,
    };
  }

  /**
   * Gets historical price points.
   */
  public async getHistory(period = '24h', cityId = 'hyderabad'): Promise<{
    period: string;
    city: string;
    points: HistoricalPricePoint[];
    source: string;
  }> {
    const cacheKey = `${period}_${cityId}`;
    const cached = this.historyCache.get(cacheKey);
    const now = Date.now();

    // Cache history for 60 seconds
    if (cached && (now - cached.cachedAt < 60000)) {
      return {
        period,
        city: cityId,
        points: cached.data,
        source: this.provider.name,
      };
    }

    const city = INDIAN_CITIES.find((c) => c.id.toLowerCase() === cityId.toLowerCase()) || INDIAN_CITIES[0];
    let rawPoints = await this.provider.fetchHistory(period);
    if (!rawPoints || rawPoints.length === 0) {
      rawPoints = await this.fallbackProvider.fetchHistory(period);
    }

    // Apply city differential if any
    const points = rawPoints.map((p) => {
      if (city.baseAdjustmentPerGram === 0) return p;
      return {
        timestamp: p.timestamp,
        price24kPerGram: Math.round((p.price24kPerGram + city.baseAdjustmentPerGram * 0.999) * 100) / 100,
        price22kPerGram: Math.round((p.price22kPerGram + city.baseAdjustmentPerGram * 0.916) * 100) / 100,
        price18kPerGram: Math.round((p.price18kPerGram + city.baseAdjustmentPerGram * 0.750) * 100) / 100,
      };
    });

    this.historyCache.set(cacheKey, { data: points, cachedAt: now });

    return {
      period,
      city: city.name,
      points,
      source: this.provider.name,
    };
  }

  /**
   * Returns health and provider status.
   */
  public getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'stale';
    providerName: string;
    consecutiveErrors: number;
    lastError: string | null;
    lastSuccessfulUpdate: string | null;
    lastChecked: string;
  } {
    const isStale = (Date.now() - this.lastSuccessfulFetchTime) > 60000;
    return {
      status: this.consecutiveErrors === 0 ? 'healthy' : isStale ? 'stale' : 'degraded',
      providerName: this.provider.name,
      consecutiveErrors: this.consecutiveErrors,
      lastError: this.lastError,
      lastSuccessfulUpdate: this.cachedMarketData ? this.cachedMarketData.timestamp : null,
      lastChecked: this.lastCheckedTimestamp,
    };
  }
}
