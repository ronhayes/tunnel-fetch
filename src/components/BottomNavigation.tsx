import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Language } from '../types';
import { translations } from '../i18n';

interface BottomNavigationProps {
  activeStepId: number;
  totalSteps: number;
  onPrev: () => void;
  onNext: () => void;
  onReset: () => void;
  lang: Language;
}

export function BottomNavigation({
  activeStepId,
  totalSteps,
  onPrev,
  onNext,
  lang
}: BottomNavigationProps) {
  const t = translations[lang];
  const isRtl = lang === 'fa';

  return (
    <footer className="h-16 bg-[#111318] border-t border-[#20242D] px-4 md:px-8 flex items-center justify-between shrink-0 select-none z-30">
      {/* Previous Step */}
      <button
        onClick={onPrev}
        disabled={activeStepId <= 1}
        className="flex items-center space-x-2 rtl:space-x-reverse px-4 py-2 rounded-xl bg-[#20242D] hover:bg-[#20242D]/80 disabled:opacity-40 disabled:hover:bg-[#20242D] text-white text-xs font-mono transition border border-[#20242D]"
      >
        {isRtl ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        <span>{t.previousStep}</span>
      </button>

      {/* Step Indicator */}
      <div className="flex items-center space-x-3 rtl:space-x-reverse">
        <span className="text-xs text-[#94A3B8] font-mono">
          <strong className="text-white">{activeStepId}</strong> / {totalSteps}
        </span>
      </div>

      {/* Next Step */}
      <button
        onClick={onNext}
        disabled={activeStepId >= totalSteps}
        className="flex items-center space-x-2 rtl:space-x-reverse px-5 py-2 rounded-xl bg-[#F59E0B] hover:bg-[#F59E0B]/90 disabled:opacity-40 disabled:hover:bg-[#F59E0B] text-[#111318] font-bold text-xs font-mono transition shadow-lg shadow-[#F59E0B]/10"
      >
        <span>{t.nextStep}</span>
        {isRtl ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>
    </footer>
  );
}
