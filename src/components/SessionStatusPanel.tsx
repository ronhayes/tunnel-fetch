import { Cpu, HardDrive, Shield, Activity, RefreshCw, CheckCircle2 } from 'lucide-react';
import type { Language, SessionState } from '../types';
import { translations } from '../i18n';

interface SessionStatusPanelProps {
  sessionState: SessionState;
  lang: Language;
  isOpen: boolean;
  onClose: () => void;
  runtimeStatuses: Record<number, string>;
  activeStepId: number;
}

export function SessionStatusPanel({
  sessionState,
  lang,
  isOpen,
  onClose,
  runtimeStatuses,
  activeStepId
}: SessionStatusPanelProps) {
  const t = translations[lang];

  if (!isOpen) return null;

  // Calculate completed step count
  const completedCount = Object.values(runtimeStatuses).filter((s) => s === 'PASS').length;

  return (
    <div className="bg-[#111318] border border-[#20242D] rounded-2xl p-4 md:p-5 shadow-xl mb-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#22D3EE]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#20242D]">
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <Activity className="w-5 h-5 text-[#22D3EE]" />
          <h3 className="text-sm font-bold text-white font-mono tracking-wider">{t.sessionStatus}</h3>
        </div>
        <button
          onClick={onClose}
          className="text-xs text-[#94A3B8] hover:text-white px-2 py-1 rounded bg-[#20242D] transition"
        >
          {lang === 'fa' ? 'بستن پنل' : 'Close Panel'}
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {/* CPU */}
        <div className="bg-[#20242D]/50 p-3 rounded-xl border border-[#20242D]">
          <div className="flex items-center space-x-1.5 rtl:space-x-reverse text-[#94A3B8] mb-1">
            <Cpu className="w-4 h-4 text-[#F59E0B]" />
            <span className="text-[11px] font-mono">{t.systemInfo.cpu}</span>
          </div>
          <p className="text-xs font-bold text-white font-mono">{sessionState.cpuArchitecture}</p>
        </div>

        {/* Linux OS */}
        <div className="bg-[#20242D]/50 p-3 rounded-xl border border-[#20242D]">
          <div className="flex items-center space-x-1.5 rtl:space-x-reverse text-[#94A3B8] mb-1">
            <HardDrive className="w-4 h-4 text-[#22D3EE]" />
            <span className="text-[11px] font-mono">{t.systemInfo.os}</span>
          </div>
          <p className="text-xs font-bold text-white font-mono">{sessionState.linuxDistribution}</p>
        </div>

        {/* Xray Version */}
        <div className="bg-[#20242D]/50 p-3 rounded-xl border border-[#20242D]">
          <div className="flex items-center space-x-1.5 rtl:space-x-reverse text-[#94A3B8] mb-1">
            <Shield className="w-4 h-4 text-[#22C55E]" />
            <span className="text-[11px] font-mono">{t.systemInfo.xray}</span>
          </div>
          <p className="text-xs font-bold text-white font-mono">{sessionState.xrayVersion}</p>
        </div>

        {/* VPN Protocol */}
        <div className="bg-[#20242D]/50 p-3 rounded-xl border border-[#20242D]">
          <div className="flex items-center space-x-1.5 rtl:space-x-reverse text-[#94A3B8] mb-1">
            <RefreshCw className="w-4 h-4 text-purple-400" />
            <span className="text-[11px] font-mono">{t.systemInfo.protocol}</span>
          </div>
          <p className="text-xs font-bold text-white font-mono">{sessionState.vpnProtocol}</p>
        </div>

        {/* Config Status */}
        <div className="bg-[#20242D]/50 p-3 rounded-xl border border-[#20242D]">
          <div className="flex items-center space-x-1.5 rtl:space-x-reverse text-[#94A3B8] mb-1">
            <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
            <span className="text-[11px] font-mono">{t.systemInfo.config}</span>
          </div>
          <p className="text-xs font-bold text-white font-mono">{sessionState.configStatus}</p>
        </div>

        {/* Active Step */}
        <div className="bg-[#20242D]/50 p-3 rounded-xl border border-[#20242D]">
          <div className="flex items-center space-x-1.5 rtl:space-x-reverse text-[#94A3B8] mb-1">
            <Activity className="w-4 h-4 text-[#22D3EE]" />
            <span className="text-[11px] font-mono">{lang === 'fa' ? 'مرحله فعال' : 'Active Step'}</span>
          </div>
          <p className="text-xs font-bold text-white font-mono">Step 0{activeStepId}</p>
        </div>

        {/* Completed Count */}
        <div className="bg-[#20242D]/50 p-3 rounded-xl border border-[#20242D]">
          <div className="flex items-center space-x-1.5 rtl:space-x-reverse text-[#94A3B8] mb-1">
            <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
            <span className="text-[11px] font-mono">{lang === 'fa' ? 'تکمیل‌شده' : 'Completed'}</span>
          </div>
          <p className="text-xs font-bold text-[#22C55E] font-mono">{completedCount} / 10</p>
        </div>
      </div>
    </div>
  );
}
