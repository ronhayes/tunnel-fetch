import { CheckCircle2, Clock, Lock, PlayCircle, Layers } from 'lucide-react';
import type { Language, WorkflowStep, StepStatus } from '../types';
import { translations } from '../i18n';
import { getStepById } from '../workflow/step-registry';

interface SidebarProps {
  steps: WorkflowStep[];
  activeStepId: number;
  onSelectStep: (id: number) => void;
  lang: Language;
  isOpen: boolean;
  onCloseMobile: () => void;
  runtimeStatuses: Record<number, string>;
}

export function Sidebar({
  steps,
  activeStepId,
  onSelectStep,
  lang,
  isOpen,
  onCloseMobile,
  runtimeStatuses
}: SidebarProps) {
  const t = translations[lang];

  const getStatusIcon = (stepId: number, implStatus: StepStatus) => {
    const runtime = runtimeStatuses[stepId] || 'NOT_STARTED';

    if (runtime === 'PASS') {
      return <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />;
    }
    if (runtime === 'RUNNING') {
      return <PlayCircle className="w-4 h-4 text-[#22D3EE] animate-pulse" />;
    }
    if (runtime === 'BLOCKED') {
      return <Lock className="w-4 h-4 text-red-400" />;
    }
    if (implStatus === 'NOT_IMPLEMENTED') {
      return <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-amber-400 font-mono">SOON</span>;
    }
    if (runtime === 'READY') {
      return <Clock className="w-4 h-4 text-[#F59E0B]" />;
    }
    return <div className="w-2 h-2 rounded-full bg-[#94A3B8]/40" />;
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:static inset-y-0 ${
          lang === 'fa' ? 'right-0' : 'left-0'
        } z-50 w-72 bg-[#111318] border-${
          lang === 'fa' ? 'l' : 'r'
        } border-[#20242D] flex flex-col shrink-0 transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : lang === 'fa' ? 'translate-x-full md:translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-[#20242D] flex items-center justify-between">
          <div className="flex items-center space-x-2 rtl:space-x-reverse text-white">
            <Layers className="w-5 h-5 text-[#F59E0B]" />
            <h2 className="text-sm font-semibold tracking-wider font-mono">{t.stepsHeader}</h2>
          </div>
          <span className="text-xs px-2 py-0.5 rounded bg-[#20242D] text-[#94A3B8] font-mono">
            10 Steps
          </span>
        </div>

        {/* Steps List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 scrollbar-thin scrollbar-thumb-[#20242D]">
          {steps.map((step) => {
            const isActive = step.id === activeStepId;
            const title = lang === 'fa' ? step.titleFa : step.titleEn;
            const stepDef = getStepById(step.id);
            const implStatus = stepDef ? stepDef.implementationStatus : 'NOT_IMPLEMENTED';

            return (
              <button
                key={step.id}
                onClick={() => {
                  onSelectStep(step.id);
                  onCloseMobile();
                }}
                className={`w-full text-start px-3.5 py-2.5 rounded-xl flex items-center justify-between transition-all group ${
                  isActive
                    ? 'bg-[#20242D] text-white shadow-md border border-[#F59E0B]/30'
                    : 'text-[#94A3B8] hover:bg-[#20242D]/50 hover:text-white border border-transparent'
                }`}
              >
                <div className="flex items-center space-x-3 rtl:space-x-reverse min-w-0">
                  <span
                    className={`text-xs font-mono font-bold shrink-0 w-5 ${
                      isActive ? 'text-[#F59E0B]' : 'text-[#94A3B8]'
                    }`}
                  >
                    {step.id < 10 ? `0${step.id}` : step.id}
                  </span>
                  <span className="text-xs font-medium truncate">{title}</span>
                </div>
                <div className="shrink-0 ml-2 rtl:mr-2">{getStatusIcon(step.id, implStatus)}</div>
              </button>
            );
          })}
        </div>

        {/* Sidebar Footer info */}
        <div className="p-3 border-t border-[#20242D] bg-[#111318]/50 text-center">
          <p className="text-[10px] text-[#94A3B8] font-mono">
            {lang === 'fa' ? 'موتور جریان کاری فعال' : 'Workflow Engine Active'}
          </p>
        </div>
      </aside>
    </>
  );
}
