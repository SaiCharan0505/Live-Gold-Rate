export type GoldPurity = '24K' | '22K' | '18K';

export interface PurityPrice {
  purity: GoldPurity;
  purityFactor: number; // 0.999, 0.916, 0.750
  pricePerGram: number;
  pricePer10Gram: number;
  change24hAmount?: number;
  change24hPercent?: number;
  direction?: 'up' | 'down' | 'neutral';
}

export interface CityConfig {
  id: string;
  name: string;
  state: string;
  region: 'South' | 'West' | 'North' | 'East';
  baseAdjustmentPerGram: number; // Indian jeweller association logistics / transport differential vs Mumbai/National benchmark
  associationName?: string;
  isRetailEstimate: boolean;
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
  classification: 'Retail Estimate (With Duty & GST)' | 'Association Sourced Rate' | 'International Spot Basis';
  isEstimate: boolean;
  cityAdjustmentPerGram: number;
  sourceTimestamp: string;
  lastCheckedTimestamp: string;
  providerName: string;
}

export interface RawMarketData {
  goldSpotUsdPerOz: number;
  usdInrRate: number;
  timestamp: string; // ISO string
  providerName: string;
  change24hUsd?: number;
  change24hPercent?: number;
  high24hUsd?: number;
  low24hUsd?: number;
  isDemo: boolean;
}

export interface HistoricalPricePoint {
  timestamp: string;
  price24kPerGram: number;
  price22kPerGram: number;
  price18kPerGram: number;
}

export interface GoldApiResponse {
  success: boolean;
  data: CityGoldRate;
  marketMeta: {
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
  };
  disclaimer: string;
}
