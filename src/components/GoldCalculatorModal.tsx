import React, { useMemo, useState } from 'react';
import { X, Calculator, Sparkles, ShieldCheck } from 'lucide-react';
import { CityGoldRate, GoldPurity } from '../types/gold';
import { formatINR } from '../utils/formatters';

interface GoldCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  cityRate: CityGoldRate;
}

type Unit = 'grams' | 'tola' | 'sovereign' | 'kg';

export const GoldCalculatorModal: React.FC<GoldCalculatorModalProps> = ({
  isOpen,
  onClose,
  cityRate,
}) => {
  const [purity, setPurity] = useState<GoldPurity>('22K');
  const [weightInput, setWeightInput] = useState<string>('10');
  const [unit, setUnit] = useState<Unit>('grams');
  const [makingChargeType, setMakingChargeType] = useState<'percent' | 'flat'>('percent');
  const [makingChargeVal, setMakingChargeVal] = useState<string>('8');
  const [includeGst, setIncludeGst] = useState<boolean>(true);

  // Conversion factor to grams
  const grams = useMemo(() => {
    const val = parseFloat(weightInput);
    if (isNaN(val) || val <= 0) return 0;
    switch (unit) {
      case 'grams':
        return val;
      case 'tola':
        return val * 11.6638;
      case 'sovereign':
        return val * 8.0;
      case 'kg':
        return val * 1000.0;
      default:
        return val;
    }
  }, [weightInput, unit]);

  const pricePerGram = cityRate.rates[purity].pricePerGram;

  // Calculation Breakdown
  const calculation = useMemo(() => {
    const baseGoldCost = grams * pricePerGram;
    const makingNum = parseFloat(makingChargeVal) || 0;

    let makingChargesAmount = 0;
    if (makingChargeType === 'percent') {
      makingChargesAmount = baseGoldCost * (makingNum / 100);
    } else {
      makingChargesAmount = grams * makingNum;
    }

    const subtotal = baseGoldCost + makingChargesAmount;
    const gstAmount = includeGst ? subtotal * 0.03 : 0;
    const totalPayable = subtotal + gstAmount;

    return {
      grams,
      pricePerGram,
      baseGoldCost,
      makingChargesAmount,
      subtotal,
      gstAmount,
      totalPayable,
    };
  }, [grams, pricePerGram, makingChargeType, makingChargeVal, includeGst]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-950 p-5 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-amber-400" />
            <div>
              <h3 className="text-base font-bold text-white sm:text-lg">
                Gold & Jewellery Purchase Calculator
              </h3>
              <p className="text-xs text-slate-400">
                Estimate jewellery bills with making charges and 3% GST in {cityRate.cityName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Inputs */}
        <div className="mt-4 space-y-4">
          {/* Purity selector */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Gold Purity
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['24K', '22K', '18K'] as GoldPurity[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPurity(p)}
                  className={`rounded-lg border p-2 text-center text-xs font-bold transition-all cursor-pointer ${
                    purity === p
                      ? 'border-amber-400 bg-amber-500/15 text-amber-300 shadow-sm'
                      : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  <div>{p}</div>
                  <div className="text-[10px] font-normal text-slate-400 mt-0.5">
                    {formatINR(cityRate.rates[p].pricePerGram)}/g
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Weight & Unit */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Weight
            </label>
            <div className="grid grid-cols-12 gap-2">
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
                className="col-span-7 rounded-lg border border-slate-700 bg-slate-900 py-2 px-3 text-sm text-slate-100 focus:border-amber-400 focus:outline-none font-mono"
              />
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as Unit)}
                className="col-span-5 rounded-lg border border-slate-700 bg-slate-900 py-2 px-2 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
              >
                <option value="grams">Grams (g)</option>
                <option value="tola">Tola (11.66g)</option>
                <option value="sovereign">Sovereign / Pavan (8g)</option>
                <option value="kg">Kilogram (kg)</option>
              </select>
            </div>
            {unit !== 'grams' && (
              <span className="text-[11px] text-slate-400 mt-1 block">
                Equivalent: <span className="font-mono text-amber-300">{calculation.grams.toFixed(2)} grams</span>
              </span>
            )}
          </div>

          {/* Making Charges */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Making Charges (Wastage / Crafting)
              </label>
              <div className="flex rounded bg-slate-900 border border-slate-800 p-0.5 text-[10px]">
                <button
                  type="button"
                  onClick={() => setMakingChargeType('percent')}
                  className={`px-2 py-0.5 rounded cursor-pointer ${
                    makingChargeType === 'percent' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'
                  }`}
                >
                  Percentage (%)
                </button>
                <button
                  type="button"
                  onClick={() => setMakingChargeType('flat')}
                  className={`px-2 py-0.5 rounded cursor-pointer ${
                    makingChargeType === 'flat' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'
                  }`}
                >
                  ₹ / gram
                </button>
              </div>
            </div>
            <input
              type="number"
              min="0"
              step="0.5"
              value={makingChargeVal}
              onChange={(e) => setMakingChargeVal(e.target.value)}
              placeholder={makingChargeType === 'percent' ? 'e.g. 8' : 'e.g. 500'}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 py-2 px-3 text-sm text-slate-100 focus:border-amber-400 focus:outline-none font-mono"
            />
          </div>

          {/* GST Toggle */}
          <div className="flex items-center justify-between rounded-lg bg-slate-900/60 p-2.5 border border-slate-800">
            <div>
              <span className="text-xs font-medium text-slate-200 block">Include Statutory 3% GST</span>
              <span className="text-[11px] text-slate-400">Mandatory on gold jewellery sales in India</span>
            </div>
            <input
              type="checkbox"
              checked={includeGst}
              onChange={(e) => setIncludeGst(e.target.checked)}
              className="h-4 w-4 rounded border-slate-700 text-amber-500 focus:ring-amber-400 cursor-pointer"
            />
          </div>

          {/* Invoice Breakdown */}
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-2 text-xs">
            <h4 className="font-bold text-amber-300 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              Estimated Showroom Quotation
            </h4>

            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">
                Gold Net Value ({calculation.grams.toFixed(2)}g @ {formatINR(calculation.pricePerGram)}/g):
              </span>
              <span className="font-mono text-white tabular-nums">{formatINR(calculation.baseGoldCost)}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">
                Making Charges ({makingChargeType === 'percent' ? `${makingChargeVal}%` : `₹${makingChargeVal}/g`}):
              </span>
              <span className="font-mono text-white tabular-nums">+{formatINR(calculation.makingChargesAmount)}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Subtotal Before GST:</span>
              <span className="font-mono text-white tabular-nums">{formatINR(calculation.subtotal)}</span>
            </div>

            {includeGst && (
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">GST (3% on Gold + Making):</span>
                <span className="font-mono text-amber-400 tabular-nums">+{formatINR(calculation.gstAmount)}</span>
              </div>
            )}

            <div className="flex justify-between items-baseline pt-2 text-sm font-bold">
              <span className="text-slate-200">Total Payable Amount:</span>
              <span className="font-mono text-xl text-amber-300 tabular-nums">
                {formatINR(calculation.totalPayable)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500 flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-amber-400 shrink-0" />
          <span>Always demand a BIS Hallmarked invoice (HUID 6-digit alphanumeric code) from your jeweller.</span>
        </div>
      </div>
    </div>
  );
};
