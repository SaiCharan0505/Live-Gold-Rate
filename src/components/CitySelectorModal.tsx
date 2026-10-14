import React, { useMemo, useState } from 'react';
import { X, Search, Star, MapPin, Check } from 'lucide-react';
import { CityGoldRate } from '../types/gold';
import { formatINR } from '../utils/formatters';

interface CitySelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  citiesRates: CityGoldRate[];
  selectedCityId: string;
  onSelectCity: (cityId: string) => void;
  favourites: string[];
  onToggleFavourite: (cityId: string) => void;
}

export const CitySelectorModal: React.FC<CitySelectorModalProps> = ({
  isOpen,
  onClose,
  citiesRates,
  selectedCityId,
  onSelectCity,
  favourites,
  onToggleFavourite,
}) => {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return citiesRates;
    return citiesRates.filter(
      (c) =>
        c.cityName.toLowerCase().includes(q) ||
        c.state.toLowerCase().includes(q) ||
        c.region.toLowerCase().includes(q)
    );
  }, [citiesRates, query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-950 p-5 sm:p-6 shadow-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-amber-400" />
            <h3 className="text-base font-bold text-white sm:text-lg">
              Select Indian City
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="mt-3 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Type city or state (e.g. Hyderabad, Chennai, Delhi)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full rounded-xl border border-slate-700 bg-slate-900 py-2.5 pl-9 pr-3 text-sm text-slate-100 placeholder-slate-500 focus:border-amber-400 focus:outline-none"
          />
        </div>

        {/* Cities Grid List */}
        <div className="mt-4 flex-1 overflow-y-auto space-y-2 pr-1">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              No cities match "{query}".
            </div>
          ) : (
            filtered.map((city) => {
              const isSelected = city.cityId.toLowerCase() === selectedCityId.toLowerCase();
              const isFav = favourites.includes(city.cityId.toLowerCase());

              return (
                <div
                  key={city.cityId}
                  onClick={() => {
                    onSelectCity(city.cityId);
                    onClose();
                  }}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-amber-400/80 bg-amber-500/10 shadow-sm'
                      : 'border-slate-800/80 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavourite(city.cityId);
                      }}
                      className="p-1 text-slate-500 hover:text-amber-400 transition-colors cursor-pointer"
                    >
                      <Star
                        className={`h-4 w-4 ${
                          isFav ? 'fill-amber-400 text-amber-400' : 'text-slate-600'
                        }`}
                      />
                    </button>

                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-white text-sm">
                        <span>{city.cityName}</span>
                        {isSelected && (
                          <span className="rounded bg-amber-400/20 px-1.5 py-0.2 text-[10px] text-amber-300 font-semibold border border-amber-400/30">
                            Current
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400">
                        {city.state} · {city.region} India
                      </span>
                    </div>
                  </div>

                  {/* Rates mini preview */}
                  <div className="text-right">
                    <div className="font-mono text-xs font-bold text-amber-300 tabular-nums">
                      22K: {formatINR(city.rates['22K'].pricePerGram)}/g
                    </div>
                    <div className="font-mono text-[11px] text-slate-400 tabular-nums">
                      24K: {formatINR(city.rates['24K'].pricePerGram)}/g
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500 flex justify-between items-center">
          <span>Click star to pin city to quick switch bar</span>
          <span>16 Supported Indian Hubs</span>
        </div>
      </div>
    </div>
  );
};
