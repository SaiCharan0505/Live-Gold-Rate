export type GoldPurity = '24K' | '22K' | '18K';

export interface PurityPrice {
  purity: GoldPurity;
  purityFactor: number;
  pricePerGram: number;
  pricePer10Gram: number;
  change24hAmount?: number;
  change24hPercent?: number;
  direction?: 'up' | 'down' | 'neutral';
}

export interface CityGoldRate {
  cityId: string;
  cityName: string;
  state: string;
  region: string;
  currency: string;
  rates: {
    '24K': PurityPrice;
    '22K': PurityPrice;
    '18K': PurityPrice;
  };
  classification: string;
  isEstimate: boolean;
  cityAdjustmentPerGram: number;
  sourceTimestamp: string;
  lastCheckedTimestamp: string;
  providerName: string;
}

export interface MarketMeta {
  goldSpotUsdPerOz: number;
  usdInrRate: number;
  rawInrPerGram24k: number;
  importDutyPercent: number;
  gstPercent: number;
  retailBenchmarkPerGram24k: number;
  providerName: string;
  sourceTimestamp: string;
  lastCheckedTimestamp: string;
  isDemo: boolean;
  isStale: boolean;
}

export interface GoldApiResponse {
  success: boolean;
  data: CityGoldRate;
  marketMeta: MarketMeta;
  disclaimer: string;
}

export interface HistoricalPricePoint {
  timestamp: string;
  price24kPerGram: number;
  price22kPerGram: number;
  price18kPerGram: number;
}

export interface HistoryResponse {
  success: boolean;
  period: string;
  city: string;
  points: HistoricalPricePoint[];
  source: string;
}

export interface CitiesApiResponse {
  success: boolean;
  total: number;
  citiesConfig: Array<{
    id: string;
    name: string;
    state: string;
    region: string;
    associationName?: string;
    classification: string;
  }>;
  rates: CityGoldRate[];
  sourceTimestamp: string;
  lastCheckedTimestamp: string;
  providerName: string;
  isDemo: boolean;
}
