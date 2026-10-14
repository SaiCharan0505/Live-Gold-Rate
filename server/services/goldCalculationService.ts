import { TAX_CONFIG } from '../config/cityConfig.js';
import { CityConfig, CityGoldRate, PurityPrice, RawMarketData } from '../types/index.js';

export class GoldCalculationService {
  /**
   * Calculates raw international gold price per gram in INR before duties:
   * (Spot USD / oz) * (USD/INR) / 31.1034768
   */
  public static calculateRawInrPerGram(spotUsd: number, usdInr: number): number {
    return (spotUsd * usdInr) / TAX_CONFIG.troyOunceGrams;
  }

  /**
   * Calculates the Indian Retail Bullion Benchmark for 24K pure gold per gram.
   * In India, imported gold pays:
   * 1. Customs Duty + AIDC (~6%)
   * 2. Refining, transport & IBJA clearing overhead (~0.8%)
   * 3. GST (3.0%)
   */
  public static calculateIndianRetailBenchmarkPerGram24K(rawInrPerGram: number): number {
    const withCustoms = rawInrPerGram * (1 + TAX_CONFIG.importDutyPercent / 100);
    const withRefining = withCustoms * (1 + TAX_CONFIG.refiningAndHallmarkingPercent / 100);
    const withGst = withRefining * (1 + TAX_CONFIG.gstPercent / 100);
    return withGst;
  }

  /**
   * Builds the city-specific rates for 24K, 22K, 18K per gram and per 10 grams.
   */
  public static buildCityRates(
    city: CityConfig,
    marketData: RawMarketData,
    lastCheckedTimestamp: string
  ): CityGoldRate {
    const rawInrPerGram = this.calculateRawInrPerGram(marketData.goldSpotUsdPerOz, marketData.usdInrRate);
    const nationalBenchmark24k = this.calculateIndianRetailBenchmarkPerGram24K(rawInrPerGram);

    // City adjusted 24K baseline per gram
    const cityBase24k = nationalBenchmark24k + city.baseAdjustmentPerGram;

    // Calculate purity specific rates
    const buildPurityPrice = (purity: '24K' | '22K' | '18K'): PurityPrice => {
      const factor = TAX_CONFIG.purityFactors[purity];
      // Round to 2 decimal places
      const pricePerGram = Math.round((cityBase24k * factor) * 100) / 100;
      // Per 10 grams equals 10 * pricePerGram
      const pricePer10Gram = Math.round(pricePerGram * 10 * 100) / 100;

      let direction: 'up' | 'down' | 'neutral' = 'neutral';
      let change24hAmount: number | undefined = undefined;
      let change24hPercent: number | undefined = undefined;

      if (marketData.change24hPercent !== undefined && !isNaN(marketData.change24hPercent)) {
        change24hPercent = Math.round(marketData.change24hPercent * 100) / 100;
        if (change24hPercent > 0.01) {
          direction = 'up';
        } else if (change24hPercent < -0.01) {
          direction = 'down';
        } else {
          direction = 'neutral';
        }
        change24hAmount = Math.round((pricePerGram * (change24hPercent / 100)) * 100) / 100;
      }

      return {
        purity,
        purityFactor: factor,
        pricePerGram,
        pricePer10Gram,
        change24hAmount,
        change24hPercent,
        direction,
      };
    };

    return {
      cityId: city.id,
      cityName: city.name,
      state: city.state,
      region: city.region,
      currency: 'INR',
      rates: {
        '24K': buildPurityPrice('24K'),
        '22K': buildPurityPrice('22K'),
        '18K': buildPurityPrice('18K'),
      },
      classification: 'Retail Estimate (With Duty & GST)',
      isEstimate: city.isRetailEstimate,
      cityAdjustmentPerGram: city.baseAdjustmentPerGram,
      sourceTimestamp: marketData.timestamp,
      lastCheckedTimestamp,
      providerName: marketData.providerName,
    };
  }
}
