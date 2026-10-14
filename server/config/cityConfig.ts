import { CityConfig } from '../types/index.js';

/**
 * Configurable list of Indian cities with indicative market premiums / transport adjustments.
 * In the Indian bullion market, Mumbai is the primary port of entry and national benchmark.
 * Different cities experience slight logistics, local jeweller association premiums, and local demand variances
 * (typically ranging between ₹10 to ₹40 per gram).
 * All rates derived from these are transparently tagged as "Retail Estimate (With Duty & GST)".
 */
export const INDIAN_CITIES: CityConfig[] = [
  {
    id: 'hyderabad',
    name: 'Hyderabad',
    state: 'Telangana',
    region: 'South',
    baseAdjustmentPerGram: 15,
    associationName: 'Twin Cities Jewellers Association (TCJA)',
    isRetailEstimate: true,
  },
  {
    id: 'chennai',
    name: 'Chennai',
    state: 'Tamil Nadu',
    region: 'South',
    baseAdjustmentPerGram: 25,
    associationName: 'Madras Jewellers and Diamond Merchants Association (MJDMA)',
    isRetailEstimate: true,
  },
  {
    id: 'bengaluru',
    name: 'Bengaluru',
    state: 'Karnataka',
    region: 'South',
    baseAdjustmentPerGram: 18,
    associationName: 'Karnataka Jewellers Association',
    isRetailEstimate: true,
  },
  {
    id: 'mumbai',
    name: 'Mumbai',
    state: 'Maharashtra',
    region: 'West',
    baseAdjustmentPerGram: 0, // Reference benchmark city (India Bullion and Jewellers Association - IBJA base)
    associationName: 'India Bullion and Jewellers Association (IBJA Base)',
    isRetailEstimate: true,
  },
  {
    id: 'delhi',
    name: 'Delhi',
    state: 'Delhi (NCR)',
    region: 'North',
    baseAdjustmentPerGram: 10,
    associationName: 'The Bullion and Jewellers Association (TBJA Delhi)',
    isRetailEstimate: true,
  },
  {
    id: 'kolkata',
    name: 'Kolkata',
    state: 'West Bengal',
    region: 'East',
    baseAdjustmentPerGram: 12,
    associationName: 'Calcutta Gem & Jewellers Association',
    isRetailEstimate: true,
  },
  {
    id: 'pune',
    name: 'Pune',
    state: 'Maharashtra',
    region: 'West',
    baseAdjustmentPerGram: 5,
    associationName: 'Pune Saraf Association',
    isRetailEstimate: true,
  },
  {
    id: 'ahmedabad',
    name: 'Ahmedabad',
    state: 'Gujarat',
    region: 'West',
    baseAdjustmentPerGram: 5,
    associationName: 'Ahmedabad Jewellers Association',
    isRetailEstimate: true,
  },
  {
    id: 'kochi',
    name: 'Kochi',
    state: 'Kerala',
    region: 'South',
    baseAdjustmentPerGram: 20,
    associationName: 'All Kerala Gold & Silver Merchants Association (AKGSMA)',
    isRetailEstimate: true,
  },
  {
    id: 'vijayawada',
    name: 'Vijayawada',
    state: 'Andhra Pradesh',
    region: 'South',
    baseAdjustmentPerGram: 16,
    associationName: 'Andhra Pradesh Bullion Merchants Association',
    isRetailEstimate: true,
  },
  {
    id: 'visakhapatnam',
    name: 'Visakhapatnam',
    state: 'Andhra Pradesh',
    region: 'South',
    baseAdjustmentPerGram: 16,
    associationName: 'Vizag Bullion Merchants Guild',
    isRetailEstimate: true,
  },
  {
    id: 'coimbatore',
    name: 'Coimbatore',
    state: 'Tamil Nadu',
    region: 'South',
    baseAdjustmentPerGram: 22,
    associationName: 'Coimbatore Jewellers Association',
    isRetailEstimate: true,
  },
  {
    id: 'jaipur',
    name: 'Jaipur',
    state: 'Rajasthan',
    region: 'North',
    baseAdjustmentPerGram: 12,
    associationName: 'Sarafa Traders Committee Jaipur',
    isRetailEstimate: true,
  },
  {
    id: 'lucknow',
    name: 'Lucknow',
    state: 'Uttar Pradesh',
    region: 'North',
    baseAdjustmentPerGram: 14,
    associationName: 'Lucknow Sarafa Association',
    isRetailEstimate: true,
  },
  {
    id: 'thiruvananthapuram',
    name: 'Thiruvananthapuram',
    state: 'Kerala',
    region: 'South',
    baseAdjustmentPerGram: 20,
    associationName: 'All Kerala Gold & Silver Merchants Association',
    isRetailEstimate: true,
  },
  {
    id: 'nagpur',
    name: 'Nagpur',
    state: 'Maharashtra',
    region: 'West',
    baseAdjustmentPerGram: 10,
    associationName: 'Nagpur Sarafa Association',
    isRetailEstimate: true,
  },
];

/**
 * Standard Indian statutory taxes and import duties:
 * - Basic Customs Duty + AIDC (Agriculture Infrastructure & Development Cess): ~6.0% (post-July 2024 budget rationalization)
 * - GST (Goods and Services Tax on gold): 3.0%
 * - Standard refining / transport / hallmarking overhead factor: ~0.8%
 */
export const TAX_CONFIG = {
  importDutyPercent: 6.0,
  gstPercent: 3.0,
  refiningAndHallmarkingPercent: 0.8,
  troyOunceGrams: 31.1034768,
  purityFactors: {
    '24K': 0.999,
    '22K': 0.916,
    '18K': 0.750,
  },
};
