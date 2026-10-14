import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Cpu, Globe, Scale, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { CityGoldRate, MarketMeta } from '../types/gold';
import { formatDateTimeIST } from '../utils/formatters';

interface TechnicalDetailsDrawerProps {
  meta?: MarketMeta;
  cityRate: CityGoldRate;
}

export const TechnicalDetailsDrawer: React.FC<TechnicalDetailsDrawerProps> = ({ meta, cityRate }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden text-xs">
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left text-slate-300 hover:text-white transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2 font-semibold">
          <Cpu className="h-4 w-4 text-amber-400" />
          <span>Market Calculations, Statutory Duties & Data Source Details</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
          <span>{isOpen ? 'Hide technical data' : 'View formulas & sources'}</span>
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      {/* Collapsible Content */}
      {isOpen && (
        <div className="border-t border-slate-800/80 p-5 space-y-5 bg-slate-950/70">
          {/* Key Reference Variables */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-3">
              <span className="text-slate-500 block text-[11px]">XAU/USD Spot Price</span>
              <span className="font-mono text-base font-bold text-amber-300 tabular-nums">
                ${meta?.goldSpotUsdPerOz.toLocaleString() || '—'}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Per Troy Ounce (31.1035g)</span>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-3">
              <span className="text-slate-500 block text-[11px]">USD / INR Exchange Rate</span>
              <span className="font-mono text-base font-bold text-slate-200 tabular-nums">
                ₹{meta?.usdInrRate || '—'}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Live Forex Benchmark</span>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-3">
              <span className="text-slate-500 block text-[11px]">Basic Customs Duty + AIDC</span>
              <span className="font-mono text-base font-bold text-slate-200 tabular-nums">
                {meta?.importDutyPercent || 6.0}%
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Ministry of Finance Tariff</span>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-3">
              <span className="text-slate-500 block text-[11px]">Indian Statutory GST</span>
              <span className="font-mono text-base font-bold text-slate-200 tabular-nums">
                {meta?.gstPercent || 3.0}%
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Integrated Goods & Services Tax</span>
            </div>
          </div>

          {/* Mathematical Formula Explanation */}
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4 space-y-2">
            <h4 className="font-bold text-slate-200 flex items-center gap-1.5 text-xs">
              <Scale className="h-4 w-4 text-amber-400" />
              Standard Pricing Formula Applied
            </h4>
            <div className="font-mono text-[11px] bg-slate-950 p-2.5 rounded border border-slate-800 text-amber-300/90 leading-relaxed overflow-x-auto">
              Raw Spot (₹/g) = (Spot USD/oz × USD/INR Rate) ÷ 31.1034768
              <br />
              National 24K Benchmark = Raw Spot × (1 + 6% Import Duty) × (1 + 0.8% Refining/Logistics) × (1 + 3% GST)
              <br />
              City 24K Baseline = National 24K Benchmark + City Transport Premium (₹{cityRate.cityAdjustmentPerGram}/g)
              <br />
              22K Rate = City 24K Baseline × 0.916 · 18K Rate = City 24K Baseline × 0.750
            </div>
          </div>

          {/* Timestamps & Provider Integrity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px] text-slate-400">
            <div className="space-y-1">
              <span className="text-slate-500 font-semibold block">Market Data Source:</span>
              <span className="text-slate-300 font-medium">{meta?.providerName || cityRate.providerName}</span>
              <p className="text-slate-500">
                Live commodity & karat quotes powered by{' '}
                <a
                  href="https://goldprice.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-400 hover:underline font-semibold"
                >
                  goldprice.dev API
                </a>{' '}
                and FX conversion from{' '}
                <a
                  href="https://exchangerate.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-400 hover:underline"
                >
                  exchangerate.dev
                </a>
                . Polled via a shared backend cache with 10-second refresh and rate-limit protection.
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-slate-500 font-semibold block">Audit & Timestamps:</span>
              <div>Upstream Quote Time: <span className="font-mono text-slate-300">{formatDateTimeIST(meta?.sourceTimestamp)}</span></div>
              <div>Backend Last Checked: <span className="font-mono text-slate-300">{formatDateTimeIST(meta?.lastCheckedTimestamp)}</span></div>
            </div>
          </div>

          {/* Formal Legal Disclaimer */}
          <div className="rounded-lg bg-amber-500/5 border border-amber-500/20 p-3 text-[11px] text-slate-400 flex items-start gap-2">
            <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-amber-300 block mb-0.5">Indicative Informational Disclaimer</span>
              Indicative gold rates for informational purposes only. Actual jewellery prices may vary by city, jeweller, taxes, making charges, and applicable fees. This platform does not sell bullion or offer investment guarantees.
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
