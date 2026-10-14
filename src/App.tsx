import React, { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { MainPriceCards } from './components/MainPriceCards';
import { PriceChart } from './components/PriceChart';
import { CityComparisonTable } from './components/CityComparisonTable';
import { TechnicalDetailsDrawer } from './components/TechnicalDetailsDrawer';
import { ShareRateModal } from './components/ShareRateModal';
import { CitySelectorModal } from './components/CitySelectorModal';
import { GoldCalculatorModal } from './components/GoldCalculatorModal';
import { useGoldRates } from './hooks/useGoldRates';
import { useFavourites } from './hooks/useFavourites';
import { ApiClient } from './services/apiClient';
import { CityGoldRate } from './types/gold';
import { AlertCircle, RefreshCw, ShieldAlert, Sparkles, MapPin } from 'lucide-react';
import { formatDateTimeIST } from './utils/formatters';

export default function App() {
  const [selectedCityId, setSelectedCityId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('live_gold_selected_city') || 'hyderabad';
    }
    return 'hyderabad';
  });

  const { favourites, toggleFavourite, isFavourite } = useFavourites();
  const {
    data,
    isLoading,
    isRefreshing,
    error,
    isStale,
    refreshNow,
    priceChangeSignal,
  } = useGoldRates(selectedCityId);

  // All cities list for comparison table
  const [allCitiesRates, setAllCitiesRates] = useState<CityGoldRate[]>([]);
  const [allCitiesConfig, setAllCitiesConfig] = useState<Array<{ id: string; name: string }>>([]);

  // Modals
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isCityModalOpen, setIsCityModalOpen] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);

  // Persist selected city
  const handleSelectCity = (cityId: string) => {
    setSelectedCityId(cityId);
    try {
      localStorage.setItem('live_gold_selected_city', cityId);
    } catch (e) {
      // Ignore
    }
  };

  // Fetch all cities rates for comparison table
  useEffect(() => {
    ApiClient.getAllCities()
      .then((res) => {
        if (res.rates) {
          setAllCitiesRates(res.rates);
        }
        if (res.citiesConfig) {
          setAllCitiesConfig(res.citiesConfig.map((c) => ({ id: c.id, name: c.name })));
        }
      })
      .catch(() => {
        // Handled silently
      });
  }, [priceChangeSignal]);

  const currentCityRate = data?.data;
  const marketMeta = data?.marketMeta;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500/20 selection:text-amber-300">
      {/* Header with Top Bar Contract */}
      <Header
        selectedCityName={currentCityRate?.cityName || selectedCityId.toUpperCase()}
        selectedCityState={currentCityRate?.state || 'India'}
        onOpenCitySelector={() => setIsCityModalOpen(true)}
        onOpenShareModal={() => setIsShareModalOpen(true)}
        onOpenCalculator={() => setIsCalculatorOpen(true)}
        isRefreshing={isRefreshing}
        onRefreshManual={refreshNow}
        lastUpdatedIso={marketMeta?.sourceTimestamp}
        lastCheckedIso={marketMeta?.lastCheckedTimestamp}
        isStale={isStale}
        isDemo={Boolean(marketMeta?.isDemo)}
        favourites={favourites}
        allCitiesConfig={allCitiesConfig}
        onSelectCity={handleSelectCity}
      />

      {/* Main Viewport Container */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 space-y-8">
        {/* Error / Network Alert Banner */}
        {error && !currentCityRate && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
              <span>Failed to fetch gold market rates: {error}</span>
            </div>
            <button
              onClick={refreshNow}
              className="rounded bg-rose-600 px-3 py-1 font-semibold text-white hover:bg-rose-500 transition-colors cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Stale Data Warning Banner */}
        {isStale && currentCityRate && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />
              <span>
                Market quote is temporarily delayed or offline. Retaining last verified quote from{' '}
                {formatDateTimeIST(marketMeta?.sourceTimestamp)}.
              </span>
            </div>
            <button
              onClick={refreshNow}
              className="rounded bg-amber-500 px-2.5 py-1 text-[11px] font-bold text-slate-950 hover:bg-amber-400 cursor-pointer"
            >
              Check Now
            </button>
          </div>
        )}

        {/* Loading Skeleton if no data yet */}
        {isLoading && !currentCityRate ? (
          <div className="space-y-4">
            <div className="h-8 w-64 rounded bg-slate-800/60 animate-pulse"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-60 rounded-xl bg-slate-900/60 border border-slate-800 animate-pulse"></div>
              ))}
            </div>
          </div>
        ) : currentCityRate ? (
          <>
            {/* 1. Main Price Cards (24K, 22K, 18K) */}
            <MainPriceCards
              rateData={currentCityRate}
              priceChangeSignal={priceChangeSignal}
            />

            {/* 2. Interactive Price Chart */}
            <PriceChart
              cityId={selectedCityId}
              cityName={currentCityRate.cityName}
            />

            {/* 3. Major Indian Cities Comparison Table */}
            <CityComparisonTable
              citiesRates={allCitiesRates.length > 0 ? allCitiesRates : [currentCityRate]}
              selectedCityId={selectedCityId}
              onSelectCity={handleSelectCity}
              favourites={favourites}
              onToggleFavourite={toggleFavourite}
            />

            {/* 4. Technical Details & Calculations Drawer */}
            <TechnicalDetailsDrawer
              meta={marketMeta}
              cityRate={currentCityRate}
            />
          </>
        ) : null}
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-slate-800/80 bg-slate-950 py-8 px-4 text-xs text-slate-500">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-amber-400"></div>
            <span className="font-semibold text-slate-300">Live Gold Price India</span>
            <span>· All major Indian cities gold rates updated in real-time</span>
          </div>

          <p className="text-center md:text-right text-[11px] max-w-xl text-slate-500">
            Indicative gold rates for informational purposes only. Actual jewellery prices may vary by city, jeweller, taxes, making charges, and applicable fees.
          </p>
        </div>
      </footer>

      {/* Modals */}
      {currentCityRate && (
        <>
          <ShareRateModal
            isOpen={isShareModalOpen}
            onClose={() => setIsShareModalOpen(false)}
            cityRate={currentCityRate}
            marketMeta={marketMeta}
          />

          <CitySelectorModal
            isOpen={isCityModalOpen}
            onClose={() => setIsCityModalOpen(false)}
            citiesRates={allCitiesRates.length > 0 ? allCitiesRates : [currentCityRate]}
            selectedCityId={selectedCityId}
            onSelectCity={handleSelectCity}
            favourites={favourites}
            onToggleFavourite={toggleFavourite}
          />

          <GoldCalculatorModal
            isOpen={isCalculatorOpen}
            onClose={() => setIsCalculatorOpen(false)}
            cityRate={currentCityRate}
          />
        </>
      )}
    </div>
  );
}
