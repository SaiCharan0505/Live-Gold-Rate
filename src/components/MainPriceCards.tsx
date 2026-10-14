import React from 'react';
import { TrendingUp, TrendingDown, Minus, ShieldCheck, Award, Sparkles } from 'lucide-react';
import { CityGoldRate } from '../types/gold';
import { formatINR } from '../utils/formatters';

interface MainPriceCardsProps {
  rateData: CityGoldRate;
  priceChangeSignal: number;
}

export const MainPriceCards: React.FC<MainPriceCardsProps> = ({ rateData, priceChangeSignal }) => {
  const { '24K': r24, '22K': r22, '18K': r18 } = rateData.rates;

  const cards = [
    {
      purity: '24K' as const,
      data: r24,
      title: '24K Pure Gold',
      subtitle: '999 Purity · Fine Investment Bullion',
      badge: 'BIS 999 Standard',
      accentBorder: 'border-amber-500/40 hover:border-amber-400',
      glowColor: 'from-amber-500/10 via-amber-500/5 to-transparent',
      tagColor: 'bg-amber-400 text-slate-950 font-bold',
      popular: false,
    },
    {
      purity: '22K' as const,
      data: r22,
      title: '22K Jewellery Gold',
      subtitle: '916 Purity · Indian Jewellery Benchmark',
      badge: 'Most Popular for Jewellery',
      accentBorder: 'border-amber-400 hover:border-amber-300 ring-1 ring-amber-400/20',
      glowColor: 'from-amber-400/15 via-amber-500/5 to-transparent',
      tagColor: 'bg-amber-500 text-slate-950 font-bold',
      popular: true,
    },
    {
      purity: '18K' as const,
      data: r18,
      title: '18K Hallmarked Gold',
      subtitle: '750 Purity · Modern & Diamond Jewellery',
      badge: 'BIS 750 Standard',
      accentBorder: 'border-slate-700 hover:border-slate-600',
      glowColor: 'from-slate-700/10 via-slate-800/5 to-transparent',
      tagColor: 'bg-slate-700 text-slate-200',
      popular: false,
    },
  ];

  return (
    <section id="overview" className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
            Today's Gold Rates in {rateData.cityName}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time bullion indicative benchmark calculated with statutory duties & GST for {rateData.state}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-400"></span>
          <span>Per Gram & Per 10 Grams (Tola reference)</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
        {cards.map((card) => {
          const isUp = card.data.direction === 'up';
          const isDown = card.data.direction === 'down';
          const hasChange = card.data.change24hPercent !== undefined;

          return (
            <div
              key={card.purity}
              className={`relative overflow-hidden rounded-xl border bg-slate-900/90 p-5 transition-all duration-300 hover:shadow-xl hover:shadow-black/40 ${card.accentBorder} ${
                card.popular ? 'bg-gradient-to-b from-slate-900 via-slate-900 to-amber-950/20' : ''
              }`}
            >
              {/* Subtle top background sheen */}
              <div
                className={`absolute inset-x-0 top-0 h-32 bg-gradient-to-b ${card.glowColor} pointer-events-none`}
              />

              {/* Card Header */}
              <div className="relative flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-white tracking-tight">{card.title}</span>
                    {card.popular && (
                      <span className="rounded bg-amber-400/20 px-2 py-0.5 text-[10px] font-semibold text-amber-300 border border-amber-400/30">
                        Retail Standard
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{card.subtitle}</p>
                </div>
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold ${
                    card.purity === '24K'
                      ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                      : card.purity === '22K'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}
                >
                  {card.purity}
                </div>
              </div>

              {/* Rate per gram (Hero Metric) */}
              <div className="relative mt-5 pt-3 border-t border-slate-800/70">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-medium text-slate-400">Price Per Gram (1g)</span>
                  <div className="flex items-center gap-1 text-xs">
                    {hasChange ? (
                      <div
                        className={`flex items-center gap-0.5 font-medium tabular-nums ${
                          isUp ? 'text-emerald-400' : isDown ? 'text-rose-400' : 'text-slate-400'
                        }`}
                      >
                        {isUp && <TrendingUp className="h-3.5 w-3.5" />}
                        {isDown && <TrendingDown className="h-3.5 w-3.5" />}
                        {!isUp && !isDown && <Minus className="h-3.5 w-3.5" />}
                        <span>
                          {card.data.change24hPercent! > 0 ? '+' : ''}
                          {card.data.change24hPercent}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-500">Change unavailable</span>
                    )}
                  </div>
                </div>

                <div className="mt-1 flex items-baseline gap-2">
                  <span
                    key={`gram-${card.purity}-${priceChangeSignal}`}
                    className="font-mono text-3xl font-extrabold tracking-tight text-white transition-colors duration-300 sm:text-4xl tabular-nums"
                  >
                    {formatINR(card.data.pricePerGram)}
                  </span>
                  <span className="text-xs text-slate-400">/ gram</span>
                </div>
              </div>

              {/* Rate per 10 grams */}
              <div className="relative mt-4 rounded-lg bg-slate-950/60 p-3 border border-slate-800/80">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-medium text-slate-300">Price Per 10 Grams</span>
                  <span className="text-[11px] text-slate-500 font-mono">(10 × 1g)</span>
                </div>
                <div className="mt-1 flex items-baseline justify-between">
                  <span
                    key={`10g-${card.purity}-${priceChangeSignal}`}
                    className="font-mono text-xl font-bold tracking-tight text-amber-300 tabular-nums"
                  >
                    {formatINR(card.data.pricePer10Gram)}
                  </span>
                  {hasChange && card.data.change24hAmount ? (
                    <span
                      className={`text-[11px] tabular-nums ${
                        isUp ? 'text-emerald-400' : isDown ? 'text-rose-400' : 'text-slate-400'
                      }`}
                    >
                      {isUp ? '+' : ''}
                      {formatINR(card.data.change24hAmount * 10)} (24h)
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Card Footer Features */}
              <div className="relative mt-4 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/40">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <ShieldCheck className="h-3.5 w-3.5 text-amber-400/80" />
                  <span>{card.badge}</span>
                </div>
                <span className="text-slate-500 font-mono">Factor: {card.data.purityFactor}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
