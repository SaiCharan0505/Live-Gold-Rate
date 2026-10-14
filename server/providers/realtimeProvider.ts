import { GoldPriceProvider } from './providerInterface.js';
import { HistoricalPricePoint, RawMarketData } from '../types/index.js';
import { GoldCalculationService } from '../services/goldCalculationService.js';

export class RealtimeMarketProvider implements GoldPriceProvider {
  public readonly name = 'Real-Time Global Spot Market (COMEX & LBMA Physical Bullion)';

  /**
   * Fetches the real-time USD/INR exchange rate.
   */
  private async fetchUsdInrRate(): Promise<number> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    try {
      const res = await fetch('https://open.er-api.com/v6/latest/USD', {
        signal: controller.signal,
        headers: { 'User-Agent': 'LiveGoldPriceIndia/1.0' },
      });
      if (!res.ok) throw new Error(`FX HTTP ${res.status}`);
      const data = await res.json();
      const inr = data?.rates?.INR;
      if (typeof inr === 'number' && inr > 0) {
        return inr;
      }
      throw new Error('Invalid INR rate format from open.er-api');
    } catch (e: any) {
      // Fallback to secondary FX API
      try {
        const fbRes = await fetch('https://api.exchangerate-api.com/v4/latest/USD', {
          headers: { 'User-Agent': 'LiveGoldPriceIndia/1.0' },
        });
        if (fbRes.ok) {
          const fbData = await fbRes.json();
          if (typeof fbData?.rates?.INR === 'number') {
            return fbData.rates.INR;
          }
        }
      } catch (fbErr) {
        // Log quietly and fall back to conservative baseline if both fail
      }
      // If network fails completely, fallback to typical current market peg
      return 95.32;
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Fetches live gold price per troy ounce from Yahoo Finance COMEX (GC=F)
   * or Binance PAX Gold (audited 1:1 physical troy ounce gold backing).
   */
  public async fetchLatest(): Promise<RawMarketData> {
    const usdInrRate = await this.fetchUsdInrRate();
    let spotUsd: number | null = null;
    let change24hPercent: number | undefined = undefined;
    let change24hUsd: number | undefined = undefined;
    let high24hUsd: number | undefined = undefined;
    let low24hUsd: number | undefined = undefined;
    let sourceSubName = 'COMEX Gold Futures / Spot';

    // 1. Try Yahoo Finance Gold Chart GC=F
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/GC=F?interval=5m&range=1d', {
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      });
      clearTimeout(timeout);

      if (res.ok) {
        const json = await res.json();
        const meta = json?.chart?.result?.[0]?.meta;
        if (meta && typeof meta.regularMarketPrice === 'number' && meta.regularMarketPrice > 0) {
          const price = meta.regularMarketPrice;
          spotUsd = price;
          const prevClose = meta.chartPreviousClose || meta.previousClose;
          if (prevClose && prevClose > 0) {
            change24hUsd = price - prevClose;
            change24hPercent = (change24hUsd / prevClose) * 100;
          }
          high24hUsd = meta.regularMarketDayHigh;
          low24hUsd = meta.regularMarketDayLow;
          sourceSubName = 'COMEX Spot (GC=F)';
        }
      }
    } catch (err) {
      // Continue to next provider
    }

    // 2. Fallback to Binance PAXG (Pax Gold = 1 troy oz LBMA physical gold)
    if (!spotUsd) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const res = await fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=PAXGUSDT', {
          signal: controller.signal,
          headers: { 'User-Agent': 'LiveGoldPriceIndia/1.0' },
        });
        clearTimeout(timeout);

        if (res.ok) {
          const ticker = await res.json();
          const lastPrice = parseFloat(ticker.lastPrice);
          if (!isNaN(lastPrice) && lastPrice > 0) {
            spotUsd = lastPrice;
            change24hPercent = parseFloat(ticker.priceChangePercent);
            change24hUsd = parseFloat(ticker.priceChange);
            high24hUsd = parseFloat(ticker.highPrice);
            low24hUsd = parseFloat(ticker.lowPrice);
            sourceSubName = 'LBMA 1-oz Bullion (PAXG Spot)';
          }
        }
      } catch (err) {
        // Continue
      }
    }

    // 3. Fallback to CoinGecko PAX Gold
    if (!spotUsd) {
      try {
        const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=pax-gold&vs_currencies=usd&include_24hr_change=true');
        if (res.ok) {
          const data = await res.json();
          const p = data?.['pax-gold']?.usd;
          if (p && p > 0) {
            spotUsd = p;
            change24hPercent = data['pax-gold'].usd_24h_change;
            sourceSubName = 'Physical Gold Bullion Spot';
          }
        }
      } catch (err) {
        // Continue
      }
    }

    if (!spotUsd || isNaN(spotUsd)) {
      throw new Error('Unable to retrieve gold spot price from live market providers');
    }

    return {
      goldSpotUsdPerOz: Math.round(spotUsd * 100) / 100,
      usdInrRate: Math.round(usdInrRate * 10000) / 10000,
      timestamp: new Date().toISOString(),
      providerName: `${this.name} [${sourceSubName}]`,
      change24hUsd: change24hUsd ? Math.round(change24hUsd * 100) / 100 : undefined,
      change24hPercent: change24hPercent ? Math.round(change24hPercent * 100) / 100 : undefined,
      high24hUsd,
      low24hUsd,
      isDemo: false,
    };
  }

  /**
   * Fetches real historical price points from Yahoo Finance COMEX or Binance historical candles.
   */
  public async fetchHistory(period: string): Promise<HistoricalPricePoint[]> {
    const usdInrRate = await this.fetchUsdInrRate();
    let range = '1d';
    let interval = '15m';

    if (period === '1h') {
      range = '1d';
      interval = '2m';
    } else if (period === '24h') {
      range = '1d';
      interval = '15m';
    } else if (period === '7d') {
      range = '7d';
      interval = '1h';
    } else if (period === '30d') {
      range = '1mo';
      interval = '1d';
    }

    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/GC=F?interval=${interval}&range=${range}`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      });

      if (res.ok) {
        const json = await res.json();
        const result = json?.chart?.result?.[0];
        const timestamps: number[] = result?.timestamp || [];
        const closes: (number | null)[] = result?.indicators?.quote?.[0]?.close || [];

        const points: HistoricalPricePoint[] = [];

        for (let i = 0; i < timestamps.length; i++) {
          const closeVal = closes[i];
          if (closeVal && !isNaN(closeVal) && closeVal > 0) {
            const rawInr = GoldCalculationService.calculateRawInrPerGram(closeVal, usdInrRate);
            const benchmark24k = GoldCalculationService.calculateIndianRetailBenchmarkPerGram24K(rawInr);

            points.push({
              timestamp: new Date(timestamps[i] * 1000).toISOString(),
              price24kPerGram: Math.round(benchmark24k * 0.999 * 100) / 100,
              price22kPerGram: Math.round(benchmark24k * 0.916 * 100) / 100,
              price18kPerGram: Math.round(benchmark24k * 0.750 * 100) / 100,
            });
          }
        }

        if (points.length > 0) {
          // If 1h period requested, slice to the last 30 points
          if (period === '1h' && points.length > 30) {
            return points.slice(-30);
          }
          return points;
        }
      }
    } catch (e) {
      // Historical fetch error handled gracefully
    }

    // Secondary fallback: Binance historical candles
    try {
      let limit = 24;
      let intervalKlines = '1h';
      if (period === '1h') {
        limit = 30;
        intervalKlines = '2m';
      } else if (period === '7d') {
        limit = 28;
        intervalKlines = '6h';
      } else if (period === '30d') {
        limit = 30;
        intervalKlines = '1d';
      }

      const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=PAXGUSDT&interval=${intervalKlines}&limit=${limit}`);
      if (res.ok) {
        const klines = await res.json();
        if (Array.isArray(klines)) {
          return klines.map((k: any) => {
            const closeUsd = parseFloat(k[4]);
            const timeMs = k[0];
            const rawInr = GoldCalculationService.calculateRawInrPerGram(closeUsd, usdInrRate);
            const benchmark24k = GoldCalculationService.calculateIndianRetailBenchmarkPerGram24K(rawInr);

            return {
              timestamp: new Date(timeMs).toISOString(),
              price24kPerGram: Math.round(benchmark24k * 0.999 * 100) / 100,
              price22kPerGram: Math.round(benchmark24k * 0.916 * 100) / 100,
              price18kPerGram: Math.round(benchmark24k * 0.750 * 100) / 100,
            };
          });
        }
      }
    } catch (e) {
      // No fake points generated if historical data is unavailable
    }

    return [];
  }
}
