import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  X,
  Download,
  Share2,
  Copy,
  Check,
  Smartphone,
  Facebook,
  ExternalLink,
  Sparkles,
  Info,
} from 'lucide-react';
import { CityGoldRate, MarketMeta } from '../types/gold';
import { formatDateTimeIST, formatINR, generateShareText } from '../utils/formatters';

interface ShareRateModalProps {
  isOpen: boolean;
  onClose: () => void;
  cityRate: CityGoldRate;
  marketMeta?: MarketMeta;
}

type AspectRatioMode = 'post' | 'story';

export const ShareRateModal: React.FC<ShareRateModalProps> = ({
  isOpen,
  onClose,
  cityRate,
  marketMeta,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [aspectRatio, setAspectRatio] = useState<AspectRatioMode>('post');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  // Generates dynamic filename: gold-rate-<city>-<date>.png
  const getFilename = useCallback(() => {
    const dateStr = new Date(cityRate.sourceTimestamp || Date.now())
      .toISOString()
      .split('T')[0];
    const citySlug = cityRate.cityName.toLowerCase().replace(/\s+/g, '-');
    return `gold-rate-${citySlug}-${dateStr}.png`;
  }, [cityRate]);

  // High-Resolution Canvas Rendering Engine
  const renderCardCanvas = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsGenerating(true);
    const isStory = aspectRatio === 'story';
    const width = 1080;
    const height = isStory ? 1920 : 1350;

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Background Luxury Navy / Obsidian Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#060911');
    bgGrad.addColorStop(0.5, '#0b1324');
    bgGrad.addColorStop(1, '#05070d');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Subtle radial golden glow behind hero area
    const glowGrad = ctx.createRadialGradient(width / 2, 450, 50, width / 2, 450, 500);
    glowGrad.addColorStop(0, 'rgba(245, 158, 11, 0.12)');
    glowGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Decorative Double Gold Frame
    ctx.strokeStyle = 'rgba(217, 119, 6, 0.35)';
    ctx.lineWidth = 3;
    ctx.strokeRect(36, 36, width - 72, height - 72);

    ctx.strokeStyle = 'rgba(251, 191, 36, 0.8)';
    ctx.lineWidth = 1;
    ctx.strokeRect(48, 48, width - 96, height - 96);

    // Corner decorative accents
    const cornerSize = 28;
    const drawCorner = (x: number, y: number, angle: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((angle * Math.PI) / 180);
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-cornerSize, 0);
      ctx.lineTo(0, 0);
      ctx.lineTo(0, -cornerSize);
      ctx.stroke();
      ctx.restore();
    };
    drawCorner(48, 48, 0);
    drawCorner(width - 48, 48, 90);
    drawCorner(width - 48, height - 48, 180);
    drawCorner(48, height - 48, 270);

    // 3. Header Branding
    ctx.textAlign = 'center';

    // AU Emblem Gold Circle
    const iconY = isStory ? 140 : 110;
    ctx.beginPath();
    ctx.arc(width / 2, iconY, 36, 0, 2 * Math.PI);
    const emblemGrad = ctx.createLinearGradient(width / 2 - 36, iconY - 36, width / 2 + 36, iconY + 36);
    emblemGrad.addColorStop(0, '#fde68a');
    emblemGrad.addColorStop(0.5, '#f59e0b');
    emblemGrad.addColorStop(1, '#b45309');
    ctx.fillStyle = emblemGrad;
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 24px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('AU', width / 2, iconY + 8);

    // Application Title
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 34px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('LIVE GOLD PRICE INDIA', width / 2, iconY + 68);

    ctx.fillStyle = '#f59e0b';
    ctx.font = '600 16px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('OFFICIAL INDICATIVE MARKET RATES', width / 2, iconY + 98);

    // 4. City Banner Card
    const cityY = isStory ? 300 : 250;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(width / 2 - 360, cityY, 720, 110, 16);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fef3c7';
    ctx.font = '800 44px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(cityRate.cityName.toUpperCase(), width / 2, cityY + 54);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 18px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(
      `${cityRate.state} · ${cityRate.region} India · ${formatDateTimeIST(cityRate.sourceTimestamp)}`,
      width / 2,
      cityY + 90
    );

    // 5. Rate Cards for 24K, 22K, 18K
    const cardsStartY = isStory ? 460 : 395;
    const cardHeight = isStory ? 230 : 185;
    const cardGap = isStory ? 32 : 22;

    const purities = [
      {
        key: '24K' as const,
        label: '24K PURE GOLD (99.9%)',
        sub: 'Fine Bullion Investment Standard',
        badge: 'BIS 999 Standard',
        border: 'rgba(251, 191, 36, 0.6)',
        bg: 'rgba(245, 158, 11, 0.08)',
        priceColor: '#ffffff',
      },
      {
        key: '22K' as const,
        label: '22K JEWELLERY GOLD (91.6%)',
        sub: 'Standard Indian Jewellery Benchmark',
        badge: 'Most Popular',
        border: 'rgba(251, 191, 36, 0.9)',
        bg: 'rgba(245, 158, 11, 0.14)',
        priceColor: '#fde047',
      },
      {
        key: '18K' as const,
        label: '18K HALLMARKED GOLD (75.0%)',
        sub: 'Modern & Diamond Jewellery Standard',
        badge: 'BIS 750 Standard',
        border: 'rgba(148, 163, 184, 0.4)',
        bg: 'rgba(30, 41, 59, 0.5)',
        priceColor: '#e2e8f0',
      },
    ];

    purities.forEach((p, idx) => {
      const cy = cardsStartY + idx * (cardHeight + cardGap);
      const rate = cityRate.rates[p.key];

      // Box
      ctx.fillStyle = p.bg;
      ctx.strokeStyle = p.border;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(110, cy, width - 220, cardHeight, 16);
      ctx.fill();
      ctx.stroke();

      // Left Column: Purity & Subtitle
      ctx.textAlign = 'left';
      ctx.fillStyle = '#f59e0b';
      ctx.font = '800 22px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(p.label, 145, cy + 44);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '500 16px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(p.sub, 145, cy + 74);

      // Price per 10 grams label
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '600 18px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('10 Grams:', 145, cy + 125);

      ctx.fillStyle = '#fde68a';
      ctx.font = '700 24px "JetBrains Mono", monospace';
      ctx.fillText(formatINR(rate.pricePer10Gram), 270, cy + 126);

      // 24h change badge if available
      if (rate.change24hPercent !== undefined) {
        const isUp = rate.direction === 'up';
        const sign = rate.change24hPercent > 0 ? '+' : '';
        ctx.fillStyle = isUp ? '#34d399' : '#f87171';
        ctx.font = '600 15px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(`24h: ${sign}${rate.change24hPercent}% (${formatINR(rate.change24hAmount! * 10)})`, 145, cy + 158);
      }

      // Right Column: Price Per Gram Hero
      ctx.textAlign = 'right';
      ctx.fillStyle = '#94a3b8';
      ctx.font = '600 16px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('PRICE PER GRAM (1g)', width - 145, cy + 44);

      ctx.fillStyle = p.priceColor;
      ctx.font = '800 48px "JetBrains Mono", monospace';
      ctx.fillText(formatINR(rate.pricePerGram), width - 145, cy + 104);

      // Badge
      ctx.fillStyle = 'rgba(251, 191, 36, 0.2)';
      ctx.beginPath();
      ctx.roundRect(width - 275, cy + 124, 130, 28, 6);
      ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.font = '700 13px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(p.badge, width - 210, cy + 143);
    });

    // 6. Market Indicators Bar
    const metaY = isStory ? 1340 : 1060;
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
    ctx.strokeStyle = 'rgba(71, 85, 105, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(110, metaY, width - 220, 75, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 16px "Plus Jakarta Sans", sans-serif';
    const spotStr = marketMeta ? `Global Spot: $${marketMeta.goldSpotUsdPerOz.toLocaleString()}/oz` : '';
    const fxStr = marketMeta ? `USD/INR: ₹${marketMeta.usdInrRate}` : '';
    const dutyStr = `Customs Duty (6%) + GST (3%)`;
    ctx.fillText(`${spotStr}   ·   ${fxStr}   ·   ${dutyStr}`, width / 2, metaY + 44);

    // 7. Footer & Disclaimer
    const footerY = isStory ? 1720 : 1210;
    ctx.fillStyle = '#64748b';
    ctx.font = '400 13px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(
      'Indicative gold rates for informational purposes only. Actual jewellery rates vary by jeweller, taxes, and making charges.',
      width / 2,
      footerY
    );

    ctx.fillStyle = '#d97706';
    ctx.font = '700 15px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('LiveGoldPriceIndia.in · Powered by goldprice.dev API', width / 2, footerY + 30);

    // Export to data URL for preview
    const dataUrl = canvas.toDataURL('image/png');
    setPreviewUrl(dataUrl);
    setIsGenerating(false);
  }, [aspectRatio, cityRate, marketMeta]);

  // Re-generate when opened, city changes, or ratio changes
  useEffect(() => {
    if (isOpen) {
      renderCardCanvas();
    }
  }, [isOpen, renderCardCanvas]);

  // Action 1: Download Image
  const handleDownload = () => {
    if (!previewUrl) return;
    const link = document.createElement('a');
    link.download = getFilename();
    link.href = previewUrl;
    link.click();
    setShareFeedback('Gold rate card downloaded successfully!');
    setTimeout(() => setShareFeedback(null), 4000);
  };

  // Action 2: Share on WhatsApp
  const handleShareWhatsApp = async () => {
    const text = generateShareText(cityRate, marketMeta);

    // Try Web Share API with File first if supported
    if (canvasRef.current && navigator.canShare) {
      try {
        const blob = await new Promise<Blob | null>((res) =>
          canvasRef.current?.toBlob(res, 'image/png')
        );
        if (blob) {
          const file = new File([blob], getFilename(), { type: 'image/png' });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: `Live Gold Rate - ${cityRate.cityName}`,
              text: `Current Gold Rates for ${cityRate.cityName} (${formatDateTimeIST(cityRate.sourceTimestamp)})`,
              files: [file],
            });
            setShareFeedback('Shared successfully via native share!');
            return;
          }
        }
      } catch (e) {
        // User cancelled or browser rejected file share
      }
    }

    // Fallback: Download image and open WhatsApp URL with formatted rate text
    handleDownload();
    const encoded = encodeURIComponent(text);
    const waUrl = `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
    setShareFeedback(
      'Rate card downloaded to your device! Opening WhatsApp with rate summary—attach the downloaded image to your message.'
    );
  };

  // Action 3: Share on Facebook
  const handleShareFacebook = () => {
    // Facebook Web Share does not support attaching local canvas PNGs directly via URL.
    // Download image and open Facebook share dialog with clear prompt.
    handleDownload();
    const shareUrl = window.location.href;
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(fbUrl, '_blank', 'noopener,noreferrer');
    setShareFeedback(
      'PNG downloaded! Facebook web sharer opened. Attach the saved image when publishing your post.'
    );
  };

  // Action 4: Copy Share Text
  const handleCopyText = () => {
    const text = generateShareText(cityRate, marketMeta);
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setShareFeedback('Rate summary copied to clipboard!');
    setTimeout(() => setCopiedText(false), 3000);
    setTimeout(() => setShareFeedback(null), 4000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl border border-slate-800 bg-slate-950 p-5 sm:p-6 shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Share2 className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white sm:text-lg">
                Share Gold Rate Card
              </h3>
              <p className="text-xs text-slate-400">
                High-resolution market card for {cityRate.cityName} ({formatDateTimeIST(cityRate.sourceTimestamp)})
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

        {/* Format Selector: Post vs WhatsApp Status */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium">Card Layout:</span>
            <button
              onClick={() => setAspectRatio('post')}
              className={`rounded px-3 py-1 font-semibold transition-colors cursor-pointer ${
                aspectRatio === 'post'
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              Portrait Post (1080 × 1350)
            </button>
            <button
              onClick={() => setAspectRatio('story')}
              className={`rounded px-3 py-1 font-semibold transition-colors cursor-pointer ${
                aspectRatio === 'story'
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              WhatsApp Status / Story (1080 × 1920)
            </button>
          </div>

          <span className="text-[11px] text-slate-400">
            {aspectRatio === 'post' ? 'Optimized for feed posts & chats' : 'Full-screen 9:16 mobile status'}
          </span>
        </div>

        {/* Feedback Alert */}
        {shareFeedback && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/30 px-3 py-2 text-xs text-amber-200 animate-in fade-in">
            <Sparkles className="h-4 w-4 text-amber-400 shrink-0" />
            <span>{shareFeedback}</span>
          </div>
        )}

        {/* Content: Preview & Share Actions */}
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left: Card Preview */}
          <div className="lg:col-span-7 flex flex-col items-center">
            <div className="relative max-h-[480px] w-full max-w-[340px] overflow-hidden rounded-xl border-2 border-amber-500/40 shadow-2xl bg-black">
              {isGenerating ? (
                <div className="flex h-80 items-center justify-center">
                  <span className="text-xs text-slate-400">Rendering high-res card...</span>
                </div>
              ) : previewUrl ? (
                <img
                  src={previewUrl}
                  alt={`Gold rate card for ${cityRate.cityName}`}
                  className="w-full h-auto object-contain"
                />
              ) : null}
            </div>
            <span className="text-[11px] text-slate-500 mt-2">
              Preview rendered at 1080px resolution
            </span>
          </div>

          {/* Right: Actions */}
          <div className="lg:col-span-5 space-y-3">
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Quick Sharing Options
              </h4>

              {/* WhatsApp Action */}
              <button
                onClick={handleShareWhatsApp}
                className="w-full flex items-center justify-center gap-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 px-4 text-xs transition-colors cursor-pointer shadow-md shadow-emerald-900/30"
              >
                <Smartphone className="h-4 w-4" />
                <span>Share on WhatsApp</span>
              </button>

              {/* Download PNG */}
              <button
                onClick={handleDownload}
                className="w-full flex items-center justify-center gap-2.5 rounded-lg bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:brightness-110 text-slate-950 font-bold py-2.5 px-4 text-xs transition-all cursor-pointer shadow-md shadow-amber-500/20"
              >
                <Download className="h-4 w-4" />
                <span>Download PNG Image</span>
              </button>

              {/* Facebook Action */}
              <button
                onClick={handleShareFacebook}
                className="w-full flex items-center justify-center gap-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-4 text-xs transition-colors cursor-pointer"
              >
                <Facebook className="h-4 w-4" />
                <span>Share on Facebook</span>
              </button>

              {/* Copy Text */}
              <button
                onClick={handleCopyText}
                className="w-full flex items-center justify-center gap-2.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-2.5 px-4 text-xs transition-colors cursor-pointer"
              >
                {copiedText ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                <span>{copiedText ? 'Copied to Clipboard!' : 'Copy Rate Text Summary'}</span>
              </button>
            </div>

            {/* Explanatory Note */}
            <div className="rounded-lg bg-slate-900/40 p-3 border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
              <div className="flex items-center gap-1 font-semibold text-slate-300">
                <Info className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                <span>Sharing Guarantee & Integrity</span>
              </div>
              <p>
                On mobile devices with Web Share support, WhatsApp will open with the image directly attached.
                On desktop browsers, the PNG image is automatically saved to your downloads folder.
              </p>
            </div>
          </div>
        </div>

        {/* Hidden Canvas used for high-res generation */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
};
