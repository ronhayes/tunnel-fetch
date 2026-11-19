import { useState } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { MainWorkspace } from './components/MainWorkspace';
import { SessionStatusPanel } from './components/SessionStatusPanel';
import { BottomNavigation } from './components/BottomNavigation';
import { WORKFLOW_STEPS } from './stepsData';
import type { Language, SessionState, WorkflowStep, RuntimeStatus } from './types';
import { translations } from './i18n';
import { Menu, X } from 'lucide-react';
import { createInitialWorkflowState } from './workflow/workflow-engine';

export function App() {
  const [lang, setLang] = useState<Language>('fa');
  const [activeStepId, setActiveStepId] = useState<number>(1);
  const [steps] = useState<WorkflowStep[]>(WORKFLOW_STEPS);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isStatusPanelOpen, setIsStatusPanelOpen] = useState(true);

  // Workflow Engine State
  const [engineState, setEngineState] = useState(createInitialWorkflowState());

  const [sessionState, setSessionState] = useState<SessionState>({
    cpuArchitecture: 'x86_64 / amd64',
    linuxDistribution: 'Ubuntu 22.04.3 LTS',
    xrayVersion: 'v1.8.24 (Core)',
    vpnProtocol: 'VLESS + Reality',
    configStatus: 'Config Pending',
    currentStep: 1,
    sessionState: 'READY'
  });

  const t = translations[lang];

  const handleToggleLang = () => {
    const newLang = lang === 'fa' ? 'en' : 'fa';
    setLang(newLang);
  };

  const handleResetSession = () => {
    if (window.confirm(t.confirmReset)) {
      setActiveStepId(1);
      setEngineState(createInitialWorkflowState());
      setSessionState({
        cpuArchitecture: 'x86_64 / amd64',
        linuxDistribution: 'Ubuntu 22.04.3 LTS',
        xrayVersion: 'v1.8.24 (Core)',
        vpnProtocol: 'VLESS + Reality',
        configStatus: 'Reset / Pending',
        currentStep: 1,
        sessionState: 'IDLE'
      });
    }
  };

  const currentStep = steps.find((s) => s.id === activeStepId) || steps[0];

  const handlePrevStep = () => {
    if (activeStepId > 1) {
      setActiveStepId(activeStepId - 1);
    }
  };

  const handleNextStep = () => {
    if (activeStepId < steps.length) {
      setActiveStepId(activeStepId + 1);
    }
  };

  const handleUpdateRuntimeStatus = (stepId: number, newStatus: RuntimeStatus) => {
    setEngineState((prev) => ({
      ...prev,
      runtimeStatuses: {
        ...prev.runtimeStatuses,
        [stepId]: newStatus
      }
    }));
  };

  return (
    <div
      dir={lang === 'fa' ? 'rtl' : 'ltr'}
      className="flex flex-col h-screen w-screen overflow-hidden bg-[#111318] text-[#94A3B8] font-sans select-none"
    >
      {/* Header */}
      <Header
        lang={lang}
        onToggleLang={handleToggleLang}
        sessionState={sessionState}
        onResetSession={handleResetSession}
        onOpenSettings={() => alert(lang === 'fa' ? 'تنظیمات پیش‌فرض فعال است.' : 'Default settings active.')}
        onOpenHelp={() => alert(lang === 'fa' ? 'راهنمای Tunnel Fetch: ابزار هوشمند آماده‌سازی تونل Xray.' : 'Tunnel Fetch Help: Smart Xray tunnel preparation tool.')}
      />

      {/* Mobile Sidebar Toggle Bar */}
      <div className="md:hidden bg-[#111318] border-b border-[#20242D] px-4 py-2 flex items-center justify-between">
        <button
          onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          className="flex items-center space-x-2 rtl:space-x-reverse text-white text-xs font-mono bg-[#20242D] px-3 py-1.5 rounded-lg border border-[#20242D]"
        >
          {isMobileSidebarOpen ? <X className="w-4 h-4 text-[#F59E0B]" /> : <Menu className="w-4 h-4 text-[#F59E0B]" />}
          <span>{t.stepsHeader} ({activeStepId}/10)</span>
        </button>
        <span className="text-xs text-[#22D3EE] font-mono">{currentStep.titleFa}</span>
      </div>

      {/* Main Body Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar */}
        <Sidebar
          steps={steps}
          activeStepId={activeStepId}
          onSelectStep={(id) => setActiveStepId(id)}
          lang={lang}
          isOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          runtimeStatuses={engineState.runtimeStatuses}
        />

        {/* Workspace & Status Panel Container */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto p-4 md:p-6 bg-[#111318]">
          <SessionStatusPanel
            sessionState={sessionState}
            lang={lang}
            isOpen={isStatusPanelOpen}
            onClose={() => setIsStatusPanelOpen(false)}
            runtimeStatuses={engineState.runtimeStatuses}
            activeStepId={activeStepId}
          />

          <MainWorkspace
            step={currentStep}
            lang={lang}
            onToggleStatusPanel={() => setIsStatusPanelOpen(!isStatusPanelOpen)}
            isStatusPanelOpen={isStatusPanelOpen}
            runtimeStatus={engineState.runtimeStatuses[activeStepId] || 'NOT_STARTED'}
            onUpdateRuntimeStatus={handleUpdateRuntimeStatus}
            allRuntimeStatuses={engineState.runtimeStatuses}
          />
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation
        activeStepId={activeStepId}
        totalSteps={steps.length}
        onPrev={handlePrevStep}
        onNext={handleNextStep}
        onReset={handleResetSession}
        lang={lang}
      />
    </div>
  );
}

export default App;
