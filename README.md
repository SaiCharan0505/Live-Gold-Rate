# Live Gold Price India — City-Wise Gold Rate Web App

A production-grade, responsive full-stack financial dashboard that tracks real-time gold prices across 16 major Indian cities, automatically refreshes rates every 10 seconds, displays authentic historical price movements, and generates high-resolution rate update images ready for instant sharing on WhatsApp and Facebook.

---

## 🌟 Key Features

1. **City-Wise Real-Time Pricing (24K, 22K, 18K)**:
   - **24K Pure Gold (99.9% fine bullion)**: Primary investment benchmark.
   - **22K Standard Gold (91.6% purity)**: The classic Indian jewellery hallmark benchmark.
   - **18K Hallmarked Gold (75.0% purity)**: Modern & diamond-studded jewellery standard.
   - View rates **per gram (1g)** and **per 10 grams (standard Tola measure)** with exact Indian currency formatting (e.g. `₹12,345.67`).

2. **16 Major Indian Hubs with Configurable Logistics Adjustments**:
   - Hyderabad, Chennai, Bengaluru, Mumbai, Delhi, Kolkata, Pune, Ahmedabad, Kochi, Vijayawada, Visakhapatnam, Coimbatore, Jaipur, Lucknow, Thiruvananthapuram, Nagpur.
   - Easily extensible city configuration in `server/config/cityConfig.ts`.
   - Local storage persistence for favourite cities and instant quick switching.

3. **Authentic Mathematical Pricing Engine**:
   - `Gold Price (INR / g) = (Gold Spot USD / oz × USD/INR Forex) ÷ 31.1034768`
   - Incorporates statutory Indian Customs Duty & AIDC (~6.0%), refining/hallmarking logistics (~0.8%), and mandatory Indian Goods and Services Tax (GST 3.0%).
   - Transparent distinction between international spot raw values, national bullion benchmarks, and city-level retail estimates.

4. **10-Second Auto-Refresh Engine with Shared Backend Cache**:
   - Client automatically checks for updates every 10 seconds when the app is active and visible.
   - Automatically pauses polling when the browser tab is hidden (`document.visibilityState === 'hidden'`) to conserve bandwidth and prevent stale calls.
   - Single shared backend singleton cache deduplicates concurrent visitor calls to avoid rate limits on upstream providers.
   - Clear distinction between "Source Updated" timestamp and "Backend Last Checked" timestamp.
   - Live freshness and graceful fallback handling with stale-data warnings.

5. **High-Resolution Gold Rate Card Image Generator (PNG)**:
   - Generates high-definition PNG cards via HTML5 Canvas in two aspect ratios:
     - **Portrait Post**: 1080 × 1350 px (feed posts, chats, and social media)
     - **WhatsApp Status / Story**: 1080 × 1920 px (full-screen mobile status)
   - Luxury dark obsidian/navy aesthetic with double gold filigree borders, official branding, selected city name, exact price timestamp, and clean purity breakdown.
   - **WhatsApp Sharing**: Uses native Web Share API with PNG file attachment on mobile devices; provides automatic download and prefilled WhatsApp message on desktop browsers.
   - **Facebook Sharing**: Triggers PNG download and opens Facebook share dialog with clear copy instructions.
   - **Dynamic Filename**: `gold-rate-<city>-<date>.png`.
   - **Copy Text Summary**: Instant formatted rate summary for messaging.

6. **Interactive Historical Price Trend Chart**:
   - Clean SVG line chart displaying authentic historical price trends.
   - Filter by purity (24K, 22K, 18K) and time periods (1 hour, 24 hours, 7 days, 30 days).
   - Interactive hover crosshairs and tooltips with exact IST date and formatted ₹ price.
   - Strictly enforces no fabricated data points.

7. **Jewellery & Gold Purchase Calculator**:
   - Calculate exact showroom billing for gold ornaments.
   - Weight inputs in Grams, Tola (11.66g), Sovereign/Pavan (8g), or Kilograms.
   - Custom making charges (percentage or ₹/gram) and statutory 3% GST breakdown.

---

## 🏗️ Technology Stack

- **Frontend**: React 19, TypeScript, Vite 8, Tailwind CSS v4, Lucide React, Motion.
- **Backend**: Node.js, Express, TypeScript, tsx.
- **Architecture**: Modular provider pattern (`GoldPriceProvider`), shared caching singleton, HTML5 Canvas image rendering engine.

---

## 🚀 Quick Start & Running Locally

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Development Server
```bash
npm run dev
```
The Express full-stack server will start on `http://localhost:3000` with Vite middleware mounted automatically.

### 3. Production Build & Start
```bash
npm run build
npm start
```

---

## ⚙️ Environment Configuration

Configuration is managed via server-side environment variables in `.env` (refer to `.env.example`):

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Port for the Express server |
| `GOLD_API_PROVIDER` | `goldprice.dev` | Provider: `goldprice.dev`, `realtime`, `goldapi`, or `mock` |
| `GOLDPRICE_DEV_API_KEY` | `""` | Optional Bearer token for [goldprice.dev](https://goldprice.dev) (`ga_live_*`) |
| `CACHE_TTL_SECONDS` | `10` | Cache retention before refreshing upstream data |

### Market Data Providers:
1. **`goldprice.dev` (Official & Default)**:
   - Primary data provider using the [goldprice.dev](https://goldprice.dev) commodity pricing API supported by Narwhal API.
   - Endpoints integrated:
     - `/v1/spot/XAU-USD-SPOT` & `/v1/prices?symbol=XAU-USD-SPOT&include=karat,sources,stats`: Live spot quotes, karat purities (24K down to 10K), and price divergence metadata.
     - `/v1/convert?from=USD&to=INR&amount=1`: Real-time USD/INR FX conversion backed by exchangerate.dev.
     - `/v1/bars?symbol=XAU-USD-SPOT&interval=1d&from=...&to=...`: Authentic OHLC bars for historical charting.
   - Fully functional out-of-the-box (keyless free tier supports 5,000 calls/mo with server caching).
   - If an account key (`ga_live_*`) is provided via `GOLDPRICE_DEV_API_KEY`, live low-latency quotes and full depth are unlocked.
2. **`realtime` (Backup Stream)**:
   - Resilient secondary fallback aggregator querying COMEX `GC=F` and LBMA Good Delivery physical gold bars (PAXG).
3. **`mock`**:
   - Offline development simulator with explicit `DEMO DATA — NOT LIVE` tagging.

---

## 🛡️ Security & Privacy

- External API credentials and provider tokens remain strictly on the backend.
- No secrets or keys are ever bundled into client-side JavaScript.
- Upstream rate limits are safeguarded by server-side caching and deduplication.
