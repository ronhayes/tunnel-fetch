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

  const completedCount = Object.values(runtimeStatuses).filter((s) => s === 'PASS').length;

  return (
    <div className="bg-[#161922] border border-[#2A303C] rounded-2xl p-4 shadow-xl mb-4 relative overflow-hidden flex flex-col space-y-3 font-mono text-xs">
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#22D3EE]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center justify-between pb-2 border-b border-[#2A303C]">
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <Activity className="w-4 h-4 text-[#22D3EE]" />
          <h3 className="font-bold text-white tracking-wider">{t.sessionStatus}</h3>
        </div>
        <button
          onClick={onClose}
          className="text-[10px] text-[#94A3B8] hover:text-white px-2 py-0.5 rounded bg-[#1E222D] transition md:hidden"
        >
          {lang === 'fa' ? 'بستن' : 'Close'}
        </button>
      </div>

      <div className="space-y-2.5">
        {/* Progress */}
        <div className="bg-[#1E222D]/70 p-2.5 rounded-xl border border-[#2A303C] flex items-center justify-between">
          <div className="flex items-center space-x-2 rtl:space-x-reverse text-[#94A3B8]">
            <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
            <span>{lang === 'fa' ? 'پیشرفت کلی:' : 'Workflow Progress:'}</span>
          </div>
          <span className="font-bold text-[#22C55E]">{completedCount} / 10</span>
        </div>

        {/* CPU */}
        <div className="bg-[#1E222D]/70 p-2.5 rounded-xl border border-[#2A303C] flex items-center justify-between">
          <div className="flex items-center space-x-2 rtl:space-x-reverse text-[#94A3B8]">
            <Cpu className="w-4 h-4 text-[#F59E0B]" />
            <span>{t.systemInfo.cpu}:</span>
          </div>
          <span className="font-bold text-white truncate max-w-[140px]">{sessionState.cpuArchitecture}</span>
        </div>

        {/* Linux OS */}
        <div className="bg-[#1E222D]/70 p-2.5 rounded-xl border border-[#2A303C] flex items-center justify-between">
          <div className="flex items-center space-x-2 rtl:space-x-reverse text-[#94A3B8]">
            <HardDrive className="w-4 h-4 text-[#22D3EE]" />
            <span>{t.systemInfo.os}:</span>
          </div>
          <span className="font-bold text-white truncate max-w-[140px]">{sessionState.linuxDistribution}</span>
        </div>

        {/* Xray Version */}
        <div className="bg-[#1E222D]/70 p-2.5 rounded-xl border border-[#2A303C] flex items-center justify-between">
          <div className="flex items-center space-x-2 rtl:space-x-reverse text-[#94A3B8]">
            <Shield className="w-4 h-4 text-[#22C55E]" />
            <span>{t.systemInfo.xray}:</span>
          </div>
          <span className="font-bold text-white">{sessionState.xrayVersion}</span>
        </div>

        {/* VPN Protocol */}
        <div className="bg-[#1E222D]/70 p-2.5 rounded-xl border border-[#2A303C] flex items-center justify-between">
          <div className="flex items-center space-x-2 rtl:space-x-reverse text-[#94A3B8]">
            <RefreshCw className="w-4 h-4 text-purple-400" />
            <span>{t.systemInfo.protocol}:</span>
          </div>
          <span className="font-bold text-white">{sessionState.vpnProtocol}</span>
        </div>

        {/* Active Step */}
        <div className="bg-[#1E222D]/70 p-2.5 rounded-xl border border-[#2A303C] flex items-center justify-between">
          <div className="flex items-center space-x-2 rtl:space-x-reverse text-[#94A3B8]">
            <Activity className="w-4 h-4 text-[#22D3EE]" />
            <span>{lang === 'fa' ? 'مرحله فعال:' : 'Active Step:'}</span>
          </div>
          <span className="font-bold text-[#22D3EE]">Step 0{activeStepId}</span>
        </div>

        {/* Zero-Persistence Status */}
        <div className="bg-[#1E222D]/70 p-2.5 rounded-xl border border-[#2A303C] flex items-center justify-between">
          <div className="flex items-center space-x-2 rtl:space-x-reverse text-[#94A3B8]">
            <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
            <span>{lang === 'fa' ? 'حالت امن (Zero-Persistence):' : 'Zero-Persistence:'}</span>
          </div>
          <span className="font-bold text-[#22C55E]">Memory Only</span>
        </div>
      </div>
    </div>
  );
}
