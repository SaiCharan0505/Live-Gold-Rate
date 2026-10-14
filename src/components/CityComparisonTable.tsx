import React, { useMemo, useState } from 'react';
import { Search, ArrowUpDown, Star, Check, MapPin } from 'lucide-react';
import { CityGoldRate } from '../types/gold';
import { formatINR, formatRelativeTime } from '../utils/formatters';

interface CityComparisonTableProps {
  citiesRates: CityGoldRate[];
  selectedCityId: string;
  onSelectCity: (cityId: string) => void;
  favourites: string[];
  onToggleFavourite: (cityId: string) => void;
}

type SortField = 'city' | '24K' | '22K' | '18K';
type SortOrder = 'asc' | 'desc';

export const CityComparisonTable: React.FC<CityComparisonTableProps> = ({
  citiesRates,
  selectedCityId,
  onSelectCity,
  favourites,
  onToggleFavourite,
}) => {
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('24K');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const filteredAndSorted = useMemo(() => {
    return citiesRates
      .filter((c) => {
        const query = search.toLowerCase();
        return (
          c.cityName.toLowerCase().includes(query) ||
          c.state.toLowerCase().includes(query) ||
          c.region.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortField === 'city') {
          diff = a.cityName.localeCompare(b.cityName);
        } else {
          diff = a.rates[sortField].pricePerGram - b.rates[sortField].pricePerGram;
        }
        return sortOrder === 'asc' ? diff : -diff;
      });
  }, [citiesRates, search, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  return (
    <section id="comparison" className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 sm:p-6 shadow-xl space-y-4">
      {/* Header & Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-lg font-bold text-white tracking-tight">
            Major Indian Cities Comparison
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Rates across 16 major Indian trade hubs with regional transport & duty adjustments
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search city, state or region..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950/80 py-1.5 pl-8 pr-3 text-xs text-slate-200 placeholder-slate-500 focus:border-amber-400 focus:outline-none"
          />
        </div>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-800">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
            <tr>
              <th className="py-3 px-4 w-10 text-center">Fav</th>
              <th
                onClick={() => handleSort('city')}
                className="py-3 px-4 cursor-pointer hover:text-amber-300 transition-colors select-none"
              >
                <div className="flex items-center gap-1">
                  <span>City & State</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('24K')}
                className="py-3 px-4 text-right cursor-pointer hover:text-amber-300 transition-colors select-none"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>24K / gram</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('22K')}
                className="py-3 px-4 text-right cursor-pointer hover:text-amber-300 transition-colors select-none"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>22K / gram</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('18K')}
                className="py-3 px-4 text-right cursor-pointer hover:text-amber-300 transition-colors select-none"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>18K / gram</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="py-3 px-4 text-right">Freshness</th>
              <th className="py-3 px-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-medium">
            {filteredAndSorted.map((city) => {
              const isSelected = city.cityId.toLowerCase() === selectedCityId.toLowerCase();
              const isFav = favourites.includes(city.cityId.toLowerCase());

              return (
                <tr
                  key={city.cityId}
                  className={`transition-colors hover:bg-slate-800/40 ${
                    isSelected ? 'bg-amber-500/10 border-l-2 border-l-amber-400' : ''
                  }`}
                >
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => onToggleFavourite(city.cityId)}
                      className="text-slate-500 hover:text-amber-400 transition-colors cursor-pointer"
                      title={isFav ? 'Remove from favourites' : 'Mark as favourite'}
                    >
                      <Star
                        className={`h-3.5 w-3.5 ${
                          isFav ? 'fill-amber-400 text-amber-400' : 'text-slate-600'
                        }`}
                      />
                    </button>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5 font-bold text-white">
                        <span>{city.cityName}</span>
                        {isSelected && (
                          <span className="rounded bg-amber-400/20 px-1.5 py-0.2 text-[10px] text-amber-300 font-semibold border border-amber-400/30">
                            Active
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 font-normal">
                        {city.state} · <span className="text-slate-500">{city.region}</span>
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-white tabular-nums">
                    {formatINR(city.rates['24K'].pricePerGram)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-amber-300 tabular-nums">
                    {formatINR(city.rates['22K'].pricePerGram)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-300 tabular-nums">
                    {formatINR(city.rates['18K'].pricePerGram)}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-400 font-mono text-[11px]">
                    {formatRelativeTime(city.sourceTimestamp)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {isSelected ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                        <Check className="h-3 w-3" /> Selected
                      </span>
                    ) : (
                      <button
                        onClick={() => onSelectCity(city.cityId)}
                        className="rounded border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-[11px] text-slate-300 hover:border-amber-400 hover:text-white transition-colors cursor-pointer"
                      >
                        Select
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2 pt-1">
        <span>* Indicative retail benchmark inclusive of statutory Customs Duty (6%) and GST (3%).</span>
        <span>Showing {filteredAndSorted.length} Indian trade hubs</span>
      </div>
    </section>
  );
};
