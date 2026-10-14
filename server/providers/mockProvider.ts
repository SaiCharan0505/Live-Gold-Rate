import { GoldPriceProvider } from './providerInterface.js';
import { HistoricalPricePoint, RawMarketData } from '../types/index.js';

export class MockProvider implements GoldPriceProvider {
  public readonly name = 'DEMO DATA — NOT LIVE (Development Simulator)';

  public async fetchLatest(): Promise<RawMarketData> {
    return {
      goldSpotUsdPerOz: 4150.00,
      usdInrRate: 95.30,
      timestamp: new Date().toISOString(),
      providerName: this.name,
      change24hUsd: 12.50,
      change24hPercent: 0.30,
      high24hUsd: 4165.00,
      low24hUsd: 4140.00,
      isDemo: true,
    };
  }

  public async fetchHistory(_period: string): Promise<HistoricalPricePoint[]> {
    // Return empty per instruction: do not generate fake historical points to make the chart look populated
    return [];
  }
}
