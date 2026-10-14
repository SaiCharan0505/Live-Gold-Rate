import React, { useEffect, useMemo, useState } from 'react';
import { LineChart as ChartIcon, Calendar, TrendingUp, TrendingDown, Clock, Info } from 'lucide-react';
import { ApiClient } from '../services/apiClient';
import { GoldPurity, HistoricalPricePoint } from '../types/gold';
import { formatDateTimeIST, formatINR } from '../utils/formatters';

interface PriceChartProps {
  cityId: string;
  cityName: string;
}

type Period = '1h' | '24h' | '7d' | '30d';

export const PriceChart: React.FC<PriceChartProps> = ({ cityId, cityName }) => {
  const [selectedPurity, setSelectedPurity] = useState<GoldPurity>('24K');
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('24h');
  const [points, setPoints] = useState<HistoricalPricePoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);

    ApiClient.getHistory(cityId, selectedPeriod)
      .then((res) => {
        if (!isCancelled) {
          setPoints(res.points || []);
          setIsLoading(false);
          setHoverIndex(null);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setPoints([]);
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [cityId, selectedPeriod]);

  // Extract values based on selected purity
  const dataSeries = useMemo(() => {
    return points.map((p) => {
      const price =
        selectedPurity === '24K'
          ? p.price24kPerGram
          : selectedPurity === '22K'
          ? p.price22kPerGram
          : p.price18kPerGram;
      return {
        timestamp: p.timestamp,
        price,
      };
    });
  }, [points, selectedPurity]);

  const stats = useMemo(() => {
    if (dataSeries.length === 0) return null;
    const prices = dataSeries.map((d) => d.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const first = prices[0];
    const last = prices[prices.length - 1];
    const diff = last - first;
    const percent = first > 0 ? (diff / first) * 100 : 0;
    return { min, max, first, last, diff, percent };
  }, [dataSeries]);

  // SVG Chart Dimensions
  const width = 800;
  const height = 280;
  const padding = { top: 20, right: 30, bottom: 40, left: 70 };

  const chartData = useMemo(() => {
    if (dataSeries.length < 2 || !stats) return null;

    const plotWidth = width - padding.left - padding.right;
    const plotHeight = height - padding.top - padding.bottom;

    const priceRange = stats.max - stats.min || 1;
    const yMin = stats.min - priceRange * 0.08;
    const yMax = stats.max + priceRange * 0.08;
    const effectiveRange = yMax - yMin;

    const coords = dataSeries.map((d, i) => {
      const x = padding.left + (i / (dataSeries.length - 1)) * plotWidth;
      const y = padding.top + plotHeight - ((d.price - yMin) / effectiveRange) * plotHeight;
      return { x, y, ...d };
    });

    const pathString = coords.reduce((acc, curr, i) => {
      return i === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
    }, '');

    const areaString = `${pathString} L ${coords[coords.length - 1].x} ${height - padding.bottom} L ${
      coords[0].x
    } ${height - padding.bottom} Z`;

    return { coords, pathString, areaString, yMin, yMax, plotWidth, plotHeight };
  }, [dataSeries, stats]);

  const activePoint = hoverIndex !== null && chartData ? chartData.coords[hoverIndex] : null;

  return (
    <section id="chart" className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 sm:p-6 shadow-xl">
      {/* Chart Header Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-white tracking-tight">Gold Price Trend</h3>
            <span className="text-xs text-slate-400">· {cityName}</span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real time-series quotes from spot and bullion exchanges
          </p>
        </div>

        {/* Purity & Period Segmented Selectors */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Purity Selector */}
          <div className="flex items-center rounded-lg bg-slate-950 p-1 border border-slate-800">
            {(['24K', '22K', '18K'] as GoldPurity[]).map((p) => (
              <button
                key={p}
                onClick={() => setSelectedPurity(p)}
                className={`rounded px-3 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                  selectedPurity === p
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Period Selector */}
          <div className="flex items-center rounded-lg bg-slate-950 p-1 border border-slate-800">
            {(['1h', '24h', '7d', '30d'] as Period[]).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`rounded px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer uppercase ${
                  selectedPeriod === period
                    ? 'bg-slate-800 text-amber-300 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart Meta & Hover Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 border-b border-slate-800/60 text-xs">
          <div>
            <span className="text-slate-500 block">Current / Focus</span>
            <span className="font-mono font-bold text-white text-sm tabular-nums">
              {activePoint ? formatINR(activePoint.price) : formatINR(stats.last)}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Period Change</span>
            <div
              className={`flex items-center gap-1 font-mono font-semibold text-sm tabular-nums ${
                stats.diff >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {stats.diff >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              <span>
                {stats.diff >= 0 ? '+' : ''}
                {formatINR(stats.diff)} ({stats.percent.toFixed(2)}%)
              </span>
            </div>
          </div>
          <div>
            <span className="text-slate-500 block">Period Low</span>
            <span className="font-mono text-slate-300 text-sm tabular-nums">{formatINR(stats.min)}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Period High</span>
            <span className="font-mono text-slate-300 text-sm tabular-nums">{formatINR(stats.max)}</span>
          </div>
        </div>
      )}

      {/* Chart Canvas Area */}
      <div className="relative mt-4">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center text-slate-500">
            <div className="flex flex-col items-center gap-2">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent"></div>
              <span className="text-xs">Loading authentic historical data...</span>
            </div>
          </div>
        ) : !chartData || dataSeries.length < 2 ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed border-slate-800 bg-slate-950/40 p-6 text-center">
            <Info className="h-8 w-8 text-amber-500/70 mb-2" />
            <h4 className="text-sm font-semibold text-slate-300">
              Historical quotes unavailable for this window
            </h4>
            <p className="text-xs text-slate-500 max-w-md mt-1">
              Per strict data accuracy principles, we do not fabricate synthetic chart points.
              Historical intervals update as live exchange records stream into the backend cache.
            </p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-auto min-h-[220px] select-none"
              onMouseLeave={() => setHoverIndex(null)}
            >
              <defs>
                <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.35" />
                  <stop offset="85%" stopColor="#f59e0b" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                const y = padding.top + chartData.plotHeight * (1 - ratio);
                const priceVal = chartData.yMin + (chartData.yMax - chartData.yMin) * ratio;
                return (
                  <g key={ratio}>
                    <line
                      x1={padding.left}
                      y1={y}
                      x2={width - padding.right}
                      y2={y}
                      stroke="#1e293b"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={padding.left - 8}
                      y={y + 4}
                      textAnchor="end"
                      fill="#64748b"
                      className="font-mono text-[10px]"
                    >
                      {Math.round(priceVal)}
                    </text>
                  </g>
                );
              })}

              {/* Area & Line */}
              <path d={chartData.areaString} fill="url(#goldGradient)" />
              <path
                d={chartData.pathString}
                fill="none"
                stroke="#fbbf24"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Hover Crosshair & Tooltip */}
              {chartData.coords.map((point, idx) => (
                <rect
                  key={idx}
                  x={point.x - chartData.plotWidth / (chartData.coords.length * 2)}
                  y={padding.top}
                  width={chartData.plotWidth / chartData.coords.length}
                  height={chartData.plotHeight}
                  fill="transparent"
                  className="cursor-crosshair"
                  onMouseEnter={() => setHoverIndex(idx)}
                />
              ))}

              {activePoint && (
                <g>
                  {/* Vertical line */}
                  <line
                    x1={activePoint.x}
                    y1={padding.top}
                    x2={activePoint.x}
                    y2={height - padding.bottom}
                    stroke="#94a3b8"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                  {/* Point circle */}
                  <circle
                    cx={activePoint.x}
                    cy={activePoint.y}
                    r="5"
                    fill="#fbbf24"
                    stroke="#0f172a"
                    strokeWidth="2"
                  />
                </g>
              )}
            </svg>

            {/* Floating Tooltip info */}
            {activePoint && (
              <div className="mt-2 flex items-center justify-between text-xs text-slate-400 bg-slate-950/80 px-3 py-1.5 rounded border border-slate-800">
                <span>Time: <span className="font-mono text-slate-200">{formatDateTimeIST(activePoint.timestamp)}</span></span>
                <span>Rate ({selectedPurity}): <span className="font-mono font-bold text-amber-300">{formatINR(activePoint.price)}/g</span></span>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
