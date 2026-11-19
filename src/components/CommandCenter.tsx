import { useState } from 'react';
import { Terminal, Copy, Check, Code2, Server, Laptop } from 'lucide-react';
import type { Language } from '../types';
import { translations } from '../i18n';

interface CommandCenterProps {
  lang: Language;
  stepId: number;
  isValidated: boolean;
}

type EnvTab = 'powershell' | 'bash' | 'vps' | 'json';

export function CommandCenter({ lang, stepId, isValidated }: CommandCenterProps) {
  const t = translations[lang];
  const [activeTab, setActiveTab] = useState<EnvTab>('powershell');
  const [copied, setCopied] = useState(false);

  // Generate dynamic command or default empty state
  const getCommandForStep = (tab: EnvTab): string => {
    if (!isValidated && stepId !== 1) {
      return lang === 'fa'
        ? `# هیچ دستوری برای این مرحله هنوز تولید نشده است.\n# لطفاً ابتدا ورودی‌های مرحله را اعتبارسنجی کنید.`
        : `# No command has been generated for this step yet.\n# Please validate the step inputs first.`;
    }

    switch (tab) {
      case 'powershell':
        return `# Tunnel Fetch - Step 0${stepId} PowerShell Execution\n$Env:TUNNEL_FETCH_STEP = "${stepId}"\nWrite-Host "Executing Step 0${stepId} operational check..." -ForegroundColor Cyan\nTest-NetConnection -ComputerName 127.0.0.1 -Port 443`;
      case 'bash':
        return `# Tunnel Fetch - Step 0${stepId} Linux / Mac Worker\nexport TUNNEL_FETCH_STEP="${stepId}"\necho "Running Step 0${stepId} automation script..."\nuname -a`;
      case 'vps':
        return `# Tunnel Fetch - Step 0${stepId} Iran VPS Remote Terminal\n# Target: Xray Core Deployment\nsystemctl status xray --no-pager`;
      case 'json':
        return `{\n  "stepId": ${stepId},\n  "status": "${isValidated ? 'VERIFIED' : 'PENDING'}",\n  "timestamp": "${new Date().toISOString()}",\n  "protocol": "VLESS-Reality"\n}`;
    }
  };

  const currentCommand = getCommandForStep(activeTab);
  const isEmptyCommand = currentCommand.startsWith('# No command') || currentCommand.startsWith('# هیچ دستوری');

  const handleCopy = () => {
    if (isEmptyCommand) return;
    navigator.clipboard.writeText(currentCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tabs: { id: EnvTab; label: string; icon: any }[] = [
    { id: 'powershell', label: t.tabs.powershell, icon: Laptop },
    { id: 'bash', label: t.tabs.bash, icon: Terminal },
    { id: 'vps', label: t.tabs.vps, icon: Server },
    { id: 'json', label: t.tabs.json, icon: Code2 },
  ];

  return (
    <div className="bg-[#111318] border border-[#20242D] rounded-2xl overflow-hidden shadow-xl mt-6">
      {/* Tabs Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-[#20242D] bg-[#20242D]/30 px-4 py-2">
        <div className="flex items-center space-x-1 rtl:space-x-reverse overflow-x-auto py-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 rtl:space-x-reverse px-3.5 py-2 rounded-xl text-xs font-mono transition ${
                  isActive
                    ? 'bg-[#111318] text-[#22D3EE] border border-[#22D3EE]/30 shadow-md'
                    : 'text-[#94A3B8] hover:text-white hover:bg-[#20242D]/50 border border-transparent'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Copy Button */}
        <button
          onClick={handleCopy}
          disabled={isEmptyCommand}
          className={`flex items-center space-x-1.5 rtl:space-x-reverse px-3 py-1.5 rounded-lg text-xs font-mono transition border ${
            isEmptyCommand
              ? 'bg-[#20242D]/50 text-zinc-600 border-transparent cursor-not-allowed'
              : 'bg-[#20242D] hover:bg-[#20242D]/80 text-white border-[#20242D]'
          }`}
        >
          {copied ? <Check className="w-3.5 h-3.5 text-[#22C55E]" /> : <Copy className="w-3.5 h-3.5 text-[#22D3EE]" />}
          <span>{copied ? t.copied : t.copyCode}</span>
        </button>
      </div>

      {/* Code Display Area */}
      <div className="p-4 bg-[#0B0D10] overflow-x-auto">
        <pre className="text-xs font-mono text-zinc-300 leading-relaxed rtl:text-left select-text">
          <code>{currentCommand}</code>
        </pre>
      </div>
    </div>
  );
}
