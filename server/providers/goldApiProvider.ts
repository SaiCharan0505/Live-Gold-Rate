import { GoldPriceProvider } from './providerInterface.js';
import { HistoricalPricePoint, RawMarketData } from '../types/index.js';

export class GoldApiProvider implements GoldPriceProvider {
  public readonly name = 'GoldAPI.io (Direct Bullion Feed)';

  constructor(private apiKey: string) {}

  public async fetchLatest(): Promise<RawMarketData> {
    if (!this.apiKey) {
      throw new Error('GOLD_API_KEY is not configured in server environment');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    try {
      const res = await fetch('https://www.goldapi.io/api/XAU/USD', {
        signal: controller.signal,
        headers: {
          'x-access-token': this.apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error(`GoldAPI returned HTTP ${res.status}`);
      }

      const data = await res.json();
      const price = data.price;
      const prevClose = data.prev_close_price;
      const change24hUsd = data.ch;
      const change24hPercent = data.chp;

      // Also get INR rate
      let usdInr = 95.32;
      try {
        const inrRes = await fetch('https://www.goldapi.io/api/XAU/INR', {
          headers: { 'x-access-token': this.apiKey },
        });
        if (inrRes.ok) {
          const inrData = await inrRes.json();
          if (inrData.price && price > 0) {
            usdInr = inrData.price / price;
          }
        }
      } catch (e) {
        // Fall back to standard rate
      }

      return {
        goldSpotUsdPerOz: price,
        usdInrRate: Math.round(usdInr * 10000) / 10000,
        timestamp: new Date(data.timestamp * 1000).toISOString(),
        providerName: this.name,
        change24hUsd,
        change24hPercent,
        high24hUsd: data.high_price,
        low24hUsd: data.low_price,
        isDemo: false,
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  public async fetchHistory(_period: string): Promise<HistoricalPricePoint[]> {
    // GoldAPI free tier does not support time-series endpoint without premium plan
    return [];
  }
}
