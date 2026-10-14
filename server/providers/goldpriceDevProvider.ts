import { GoldPriceProvider } from './providerInterface.js';
import { HistoricalPricePoint, RawMarketData } from '../types/index.js';
import { GoldCalculationService } from '../services/goldCalculationService.js';

export class GoldPriceDevProvider implements GoldPriceProvider {
  public readonly name = 'goldprice.dev (Official Commodity & Karat API)';
  private apiKey: string;
  private baseUrl = 'https://api.goldprice.dev/v1';

  constructor(apiKey = '') {
    this.apiKey = apiKey || process.env.GOLDPRICE_DEV_API_KEY || process.env.GOLD_API_KEY || '';
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'User-Agent': 'LiveGoldPriceIndia/1.0 (https://goldprice.dev integration)',
      'Accept': 'application/json',
    };
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }
    return headers;
  }

  /**
   * Fetches latest spot price and USD/INR FX conversion from goldprice.dev
   */
  public async fetchLatest(): Promise<RawMarketData> {
    const headers = this.getHeaders();
    let spotUsd = 0;
    let computedAt = new Date().toISOString();
    let isStale = false;
    let change24hPercent: number | undefined = undefined;
    let change24hUsd: number | undefined = undefined;

    // 1. Fetch Spot XAU/USD from goldprice.dev
    try {
      const spotUrl = this.apiKey
        ? `${this.baseUrl}/prices?symbol=XAU-USD-SPOT&include=sources,karat,stats`
        : `${this.baseUrl}/spot/XAU-USD-SPOT`;

      const res = await fetch(spotUrl, { headers });
      if (res.ok) {
        const json = await res.json();
        if (json.price) {
          spotUsd = parseFloat(json.price);
          computedAt = json.computed_at || computedAt;
          isStale = Boolean(json.is_stale);
        } else if (Array.isArray(json.symbols) && json.symbols[0]?.price) {
          const s = json.symbols[0];
          spotUsd = parseFloat(s.price);
          computedAt = s.computed_at || computedAt;
          isStale = Boolean(s.is_stale);
          if (s.chp !== undefined && s.chp !== null) {
            change24hPercent = parseFloat(s.chp);
          }
          if (s.ch !== undefined && s.ch !== null) {
            change24hUsd = parseFloat(s.ch);
          }
        }
      }
    } catch (err) {
      // Continue to fallback
    }

    // 2. Fetch USD/INR Rate from goldprice.dev FX conversion
    let usdInrRate = 95.30;
    try {
      const fxUrl = `${this.baseUrl}/convert?from=USD&to=INR&amount=1`;
      const fxRes = await fetch(fxUrl, { headers });
      if (fxRes.ok) {
        const fxJson = await fxRes.json();
        const rate = parseFloat(fxJson.rate || fxJson.result);
        if (!isNaN(rate) && rate > 0) {
          usdInrRate = rate;
        }
      }
    } catch (fxErr) {
      // Fallback
      try {
        const erRes = await fetch('https://open.er-api.com/v6/latest/USD');
        if (erRes.ok) {
          const erJson = await erRes.json();
          if (erJson?.rates?.INR) usdInrRate = erJson.rates.INR;
        }
      } catch (e) {
        // Retain default
      }
    }

    // 3. If change stats not available from /prices, calculate 24h change from recent bars
    if (change24hPercent === undefined && spotUsd > 0) {
      try {
        const to = new Date().toISOString().split('T')[0];
        const fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - 3);
        const from = fromDate.toISOString().split('T')[0];

        const barsUrl = `${this.baseUrl}/bars?symbol=XAU-USD-SPOT&interval=1d&from=${from}&to=${to}`;
        const barsRes = await fetch(barsUrl, { headers });
        if (barsRes.ok) {
          const barsJson = await barsRes.json();
          if (Array.isArray(barsJson.bars) && barsJson.bars.length >= 2) {
            const prevBar = barsJson.bars[0]; // prior day close
            const prevClose = parseFloat(prevBar.close);
            if (prevClose > 0) {
              change24hUsd = spotUsd - prevClose;
              change24hPercent = (change24hUsd / prevClose) * 100;
            }
          }
        }
      } catch (barsErr) {
        // Non-fatal
      }
    }

    if (!spotUsd || isNaN(spotUsd) || spotUsd <= 0) {
      throw new Error('Unable to retrieve gold price quote from goldprice.dev');
    }

    return {
      goldSpotUsdPerOz: Math.round(spotUsd * 100) / 100,
      usdInrRate: Math.round(usdInrRate * 10000) / 10000,
      timestamp: computedAt,
      providerName: this.name,
      change24hUsd: change24hUsd ? Math.round(change24hUsd * 100) / 100 : undefined,
      change24hPercent: change24hPercent ? Math.round(change24hPercent * 100) / 100 : undefined,
      isDemo: false,
    };
  }

  /**
   * Fetches authentic historical OHLC bars from goldprice.dev
   */
  public async fetchHistory(period: string): Promise<HistoricalPricePoint[]> {
    const headers = this.getHeaders();
    const to = new Date().toISOString().split('T')[0];
    const fromDate = new Date();

    let daysBack = 30;
    if (period === '1h' || period === '24h') {
      daysBack = 5;
    } else if (period === '7d') {
      daysBack = 10;
    } else if (period === '30d') {
      daysBack = 30;
    }
    fromDate.setDate(fromDate.getDate() - daysBack);
    const from = fromDate.toISOString().split('T')[0];

    try {
      // First get USD/INR
      let usdInr = 95.30;
      try {
        const fxRes = await fetch(`${this.baseUrl}/convert?from=USD&to=INR&amount=1`, { headers });
        if (fxRes.ok) {
          const fxJson = await fxRes.json();
          const r = parseFloat(fxJson.rate || fxJson.result);
          if (r > 0) usdInr = r;
        }
      } catch (e) {
        // Fallback
      }

      const barsUrl = `${this.baseUrl}/bars?symbol=XAU-USD-SPOT&interval=1d&from=${from}&to=${to}`;
      const res = await fetch(barsUrl, { headers });

      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.bars) && json.bars.length > 0) {
          // Sort oldest to newest
          const sorted = [...json.bars].sort(
            (a, b) => new Date(a.bar_start).getTime() - new Date(b.bar_start).getTime()
          );

          return sorted.map((b: any) => {
            const closeUsd = parseFloat(b.close);
            const rawInr = GoldCalculationService.calculateRawInrPerGram(closeUsd, usdInr);
            const benchmark24k = GoldCalculationService.calculateIndianRetailBenchmarkPerGram24K(rawInr);

            return {
              timestamp: b.bar_start,
              price24kPerGram: Math.round(benchmark24k * 0.999 * 100) / 100,
              price22kPerGram: Math.round(benchmark24k * 0.916 * 100) / 100,
              price18kPerGram: Math.round(benchmark24k * 0.750 * 100) / 100,
            };
          });
        }
      }
    } catch (err) {
      // Return empty points if not reachable
    }

    return [];
  }
}
