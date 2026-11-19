import { useState } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { MainWorkspace } from './components/MainWorkspace';
import { SessionStatusPanel } from './components/SessionStatusPanel';
import { BottomNavigation } from './components/BottomNavigation';
import { OnboardingWizard } from './components/OnboardingWizard';
import { WORKFLOW_STEPS } from './stepsData';
import type { Language, SessionState, WorkflowStep, RuntimeStatus } from './types';
import { translations } from './i18n';
import { Menu, X, Settings2 } from 'lucide-react';
import { createInitialWorkflowState } from './workflow/workflow-engine';
import type { TransferOptions } from './engines/transfer-install/command-generator';

export function App() {
  const [lang, setLang] = useState<Language>('fa');
  const [activeStepId, setActiveStepId] = useState<number>(1);
  const [steps] = useState<WorkflowStep[]>(WORKFLOW_STEPS);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isStatusPanelOpen, setIsStatusPanelOpen] = useState(true);
  const [showWizard, setShowWizard] = useState(true);

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

  const [wizardConfig, setWizardConfig] = useState<{ transferOpts: TransferOptions | null; vpnUri: string }>({
    transferOpts: null,
    vpnUri: ''
  });

  const t = translations[lang];
  const isRtl = lang === 'fa';

  const handleToggleLang = () => {
    const newLang = lang === 'fa' ? 'en' : 'fa';
    setLang(newLang);
  };

  const handleResetSession = () => {
    if (window.confirm(t.confirmReset)) {
      setShowWizard(true);
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

  const handleCompleteSetup = (transferOpts: TransferOptions, vpnUri: string) => {
    setWizardConfig({ transferOpts, vpnUri });
    setShowWizard(false);
    // Mark step 1 ready and prefill state
    setEngineState(prev => ({
      ...prev,
      runtimeStatuses: {
        ...prev.runtimeStatuses,
        1: 'READY'
      }
    }));
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
      dir={isRtl ? 'rtl' : 'ltr'}
      className="flex flex-col h-screen w-screen overflow-hidden bg-[#0B0D10] text-[#F8FAFC] font-sans select-none"
    >
      {showWizard && (
        <OnboardingWizard lang={lang} onCompleteSetup={handleCompleteSetup} />
      )}

      {/* Header */}
      <Header
        lang={lang}
        onToggleLang={handleToggleLang}
        sessionState={sessionState}
        onResetSession={handleResetSession}
        onOpenSettings={() => setShowWizard(true)}
        onOpenHelp={() => alert(lang === 'fa' ? 'راهنمای Tunnel Fetch: ابزار هوشمند آماده‌سازی تونل Xray.' : 'Tunnel Fetch Help: Smart Xray tunnel preparation tool.')}
      />

      {/* Mobile Sidebar Toggle Bar & Wizard Reopen */}
      <div className="md:hidden bg-[#161922] border-b border-[#2A303C] px-4 py-2 flex items-center justify-between shrink-0">
        <button
          onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          className="flex items-center space-x-2 rtl:space-x-reverse text-white text-xs font-mono bg-[#1E222D] px-3 py-1.5 rounded-lg border border-[#2A303C]"
        >
          {isMobileSidebarOpen ? <X className="w-4 h-4 text-[#F59E0B]" /> : <Menu className="w-4 h-4 text-[#F59E0B]" />}
          <span>{t.stepsHeader} ({activeStepId}/10)</span>
        </button>
        <button
          onClick={() => setShowWizard(true)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#22D3EE]/20 text-[#22D3EE] text-xs font-mono border border-[#22D3EE]/30"
        >
          <Settings2 className="w-3.5 h-3.5" />
          <span>{isRtl ? 'تغییر تنظیمات سرور' : 'Server Setup'}</span>
        </button>
      </div>

      {/* Main 3-Column Deterministic Grid Layout with Grid Template Areas */}
      <div
        className="flex-1 overflow-hidden relative w-full"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gridTemplateRows: '100%',
        }}
      >
        <style>{`
          @media (min-width: 768px) {
            .app-grid-layout {
              display: grid !important;
              grid-template-columns: ${isRtl ? '300px minmax(0, 1fr) 280px' : '280px minmax(0, 1fr) 300px'};
              grid-template-areas: ${isRtl ? '"status workspace sidebar"' : '"sidebar workspace status"'};
            }
          }
          @media (min-width: 1024px) {
            .app-grid-layout {
              grid-template-columns: ${isRtl ? '320px minmax(0, 1fr) 300px' : '300px minmax(0, 1fr) 320px'};
            }
          }
        `}</style>
        <div className="app-grid-layout h-full w-full overflow-hidden" style={{ display: 'flex', flexDirection: 'column' }}>
          {/* Sidebar */}
          <div className="h-full overflow-hidden flex flex-col bg-[#161922]" style={{ gridArea: 'sidebar' }}>
            <Sidebar
              steps={steps}
              activeStepId={activeStepId}
              onSelectStep={(id) => setActiveStepId(id)}
              lang={lang}
              isOpen={isMobileSidebarOpen}
              onCloseMobile={() => setIsMobileSidebarOpen(false)}
              runtimeStatuses={engineState.runtimeStatuses}
            />
          </div>

          {/* Main Workspace (Center) */}
          <div className="h-full overflow-y-auto flex flex-col bg-[#0B0D10] p-4 md:p-6 min-w-0" style={{ gridArea: 'workspace' }}>
            <MainWorkspace
              step={currentStep}
              lang={lang}
              onToggleStatusPanel={() => setIsStatusPanelOpen(!isStatusPanelOpen)}
              isStatusPanelOpen={isStatusPanelOpen}
              runtimeStatus={engineState.runtimeStatuses[activeStepId] || 'NOT_STARTED'}
              onUpdateRuntimeStatus={handleUpdateRuntimeStatus}
              allRuntimeStatuses={engineState.runtimeStatuses}
              wizardConfig={wizardConfig}
            />
          </div>

          {/* Session Status Panel */}
          <div className={`h-full overflow-y-auto flex flex-col bg-[#161922] p-4 ${isStatusPanelOpen ? 'block' : 'hidden md:block'}`} style={{ gridArea: 'status' }}>
            <SessionStatusPanel
              sessionState={sessionState}
              lang={lang}
              isOpen={isStatusPanelOpen}
              onClose={() => setIsStatusPanelOpen(false)}
              runtimeStatuses={engineState.runtimeStatuses}
              activeStepId={activeStepId}
            />
          </div>
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
