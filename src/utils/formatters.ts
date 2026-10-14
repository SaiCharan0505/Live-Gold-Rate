import { CityGoldRate, MarketMeta } from '../types/gold';

/**
 * Formats a number as Indian Rupee currency (e.g. ₹12,345.67)
 */
export function formatINR(val: number | undefined | null, decimals = 2): string {
  if (val === undefined || val === null || isNaN(val)) return '₹—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(val);
}

/**
 * Formats standard number in Indian format without currency symbol
 */
export function formatIndianNumber(val: number | undefined | null, decimals = 2): string {
  if (val === undefined || val === null || isNaN(val)) return '—';
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(val);
}

/**
 * Formats a timestamp into Indian Standard Time readable string
 */
export function formatDateTimeIST(isoString: string | undefined | null): string {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    return d.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  } catch (e) {
    return isoString;
  }
}

/**
 * Formats time difference as relative seconds/minutes
 */
export function formatRelativeTime(isoString: string | undefined | null): string {
  if (!isoString) return 'Never';
  try {
    const diffSeconds = Math.round((Date.now() - new Date(isoString).getTime()) / 1000);
    if (diffSeconds < 5) return 'just now';
    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    return `${diffHours}h ago`;
  } catch (e) {
    return 'Recently';
  }
}

/**
 * Generates formatted text for WhatsApp / Facebook sharing
 */
export function generateShareText(cityRate: CityGoldRate, meta?: MarketMeta): string {
  const time = formatDateTimeIST(cityRate.sourceTimestamp);
  const r24 = cityRate.rates['24K'];
  const r22 = cityRate.rates['22K'];
  const r18 = cityRate.rates['18K'];

  return [
    `✨ *LIVE GOLD RATE UPDATE — ${cityRate.cityName.toUpperCase()}* ✨`,
    `📅 As of: ${time}`,
    ``,
    `🟡 *24K Gold (99.9% Pure)*:`,
    `  • 1 Gram: ${formatINR(r24.pricePerGram)}`,
    `  • 10 Grams: ${formatINR(r24.pricePer10Gram)}`,
    ``,
    `🪙 *22K Gold (91.6% Jewellery Standard)*:`,
    `  • 1 Gram: ${formatINR(r22.pricePerGram)}`,
    `  • 10 Grams: ${formatINR(r22.pricePer10Gram)}`,
    ``,
    `🔸 *18K Gold (75.0% Hallmarked)*:`,
    `  • 1 Gram: ${formatINR(r18.pricePerGram)}`,
    `  • 10 Grams: ${formatINR(r18.pricePer10Gram)}`,
    ``,
    meta ? `🌐 Global Spot: $${meta.goldSpotUsdPerOz.toLocaleString()}/oz | USD/INR: ₹${meta.usdInrRate}` : '',
    `📍 Location: ${cityRate.cityName}, ${cityRate.state}`,
    `ℹ️ ${cityRate.classification}`,
    ``,
    `Shared via Live Gold Price India`,
  ]
    .filter(Boolean)
    .join('\n');
}
