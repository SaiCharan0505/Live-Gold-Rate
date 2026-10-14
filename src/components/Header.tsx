import React from 'react';
import {
  Sparkles,
  MapPin,
  RefreshCw,
  Share2,
  Calculator,
  AlertCircle,
  Star,
  CheckCircle2,
} from 'lucide-react';
import { formatDateTimeIST, formatRelativeTime } from '../utils/formatters';

interface HeaderProps {
  selectedCityName: string;
  selectedCityState: string;
  onOpenCitySelector: () => void;
  onOpenShareModal: () => void;
  onOpenCalculator: () => void;
  isRefreshing: boolean;
  onRefreshManual: () => void;
  lastUpdatedIso?: string;
  lastCheckedIso?: string;
  isStale: boolean;
  isDemo: boolean;
  favourites: string[];
  allCitiesConfig: Array<{ id: string; name: string }>;
  onSelectCity: (id: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  selectedCityName,
  selectedCityState,
  onOpenCitySelector,
  onOpenShareModal,
  onOpenCalculator,
  isRefreshing,
  onRefreshManual,
  lastUpdatedIso,
  lastCheckedIso,
  isStale,
  isDemo,
  favourites,
  allCitiesConfig,
  onSelectCity,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
      {/* Top Bar Contract: Zone 1 (Wordmark) — Zone 2 (Navigation) — Zone 3 (Primary CTA) */}
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-3 sm:px-6">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-300 via-amber-500 to-amber-700 text-slate-950 shadow-md shadow-amber-500/20">
            <span className="font-extrabold text-xs tracking-tighter">AU</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-white sm:text-lg">
                Live Gold Price India
              </span>
              {isDemo ? (
                <span className="rounded bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-rose-400 border border-rose-500/20">
                  DEMO DATA
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  LIVE
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-400">
          <a href="#overview" className="hover:text-amber-300 transition-colors whitespace-nowrap">
            Rates Overview
          </a>
          <a href="#chart" className="hover:text-amber-300 transition-colors whitespace-nowrap">
            Price Trend
          </a>
          <a href="#comparison" className="hover:text-amber-300 transition-colors whitespace-nowrap">
            All Cities
          </a>
          <button
            onClick={onOpenCalculator}
            className="flex items-center gap-1.5 text-slate-300 hover:text-amber-300 transition-colors whitespace-nowrap cursor-pointer"
          >
            <Calculator className="h-3.5 w-3.5 text-amber-400" />
            Jewellery Calculator
          </button>
        </nav>

        {/* Zone 3: Primary Action CTA */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onOpenShareModal}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 px-3.5 py-1.5 text-xs font-semibold text-slate-950 shadow-md shadow-amber-500/25 transition-all hover:brightness-110 active:scale-95 cursor-pointer whitespace-nowrap"
            title="Generate and share high-resolution gold rate image"
          >
            <Share2 className="h-3.5 w-3.5" />
            <span>Share Gold Rate</span>
          </button>
        </div>
      </div>

      {/* Control Strip: City Selector, Favourites, Auto-refresh status */}
      <div className="border-t border-slate-800/50 bg-slate-900/50 px-4 py-2 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 text-xs">
          {/* Selected City Trigger & Favourites */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onOpenCitySelector}
              className="flex items-center gap-1.5 rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-200 transition-colors hover:bg-amber-500/20 cursor-pointer"
            >
              <MapPin className="h-3.5 w-3.5 text-amber-400" />
              <span>
                {selectedCityName}, {selectedCityState}
              </span>
              <span className="text-[10px] text-amber-400/70">▼ Change</span>
            </button>

            {/* Favourites Quick Switching */}
            <div className="hidden sm:flex items-center gap-1 pl-1">
              <span className="text-[11px] text-slate-500 mr-1">Quick:</span>
              {favourites.slice(0, 4).map((favId) => {
                const cityMatch = allCitiesConfig.find((c) => c.id === favId);
                if (!cityMatch) return null;
                const isCurrent = cityMatch.name.toLowerCase() === selectedCityName.toLowerCase();
                return (
                  <button
                    key={favId}
                    onClick={() => onSelectCity(favId)}
                    className={`rounded px-2 py-0.5 text-[11px] transition-colors cursor-pointer ${
                      isCurrent
                        ? 'bg-slate-800 text-amber-300 font-medium border border-amber-500/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    {cityMatch.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Refresh and Timestamp Status */}
          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            {isStale ? (
              <span className="flex items-center gap-1 text-amber-400 font-medium">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>Stale Data (retrying...)</span>
              </span>
            ) : (
              <span className="hidden sm:inline-flex items-center gap-1 text-slate-400">
                <span>Source Updated:</span>
                <span className="font-mono text-slate-200">{formatRelativeTime(lastUpdatedIso)}</span>
              </span>
            )}

            <span className="hidden md:inline text-slate-600">·</span>

            <span className="text-slate-400">
              Auto-refresh: <span className="font-mono text-slate-300">10s</span>
            </span>

            <button
              onClick={onRefreshManual}
              disabled={isRefreshing}
              className="flex items-center gap-1 rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh now"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
