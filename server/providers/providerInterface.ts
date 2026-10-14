import { HistoricalPricePoint, RawMarketData } from '../types/index.js';

export interface GoldPriceProvider {
  readonly name: string;
  fetchLatest(): Promise<RawMarketData>;
  fetchHistory(period: string): Promise<HistoricalPricePoint[]>;
}
