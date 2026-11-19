import { Globe, HelpCircle, RefreshCw, Settings as SettingsIcon, ShieldCheck } from 'lucide-react';
import type { Language, SessionState } from '../types';
import { translations } from '../i18n';

interface HeaderProps {
  lang: Language;
  onToggleLang: () => void;
  sessionState: SessionState;
  onResetSession: () => void;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
}

export function Header({
  lang,
  onToggleLang,
  sessionState,
  onResetSession,
  onOpenSettings,
  onOpenHelp
}: HeaderProps) {
  const t = translations[lang];

  return (
    <header className="h-16 bg-[#111318] border-b border-[#20242D] px-4 md:px-6 flex items-center justify-between shrink-0 select-none">
      {/* Brand & Title */}
      <div className="flex items-center space-x-3 rtl:space-x-reverse">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F59E0B] to-[#22D3EE] p-0.5 flex items-center justify-center shadow-lg shadow-[#F59E0B]/10">
          <div className="w-full h-full bg-[#111318] rounded-[10px] flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-[#F59E0B]" />
          </div>
        </div>
        <div>
          <h1 className="text-base md:text-lg font-bold tracking-wider text-white font-mono flex items-center gap-2">
            {t.brandTitle}
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#22D3EE]/10 text-[#22D3EE] font-sans border border-[#22D3EE]/20">
              v1.0 Pro
            </span>
          </h1>
          <p className="text-xs text-[#94A3B8] hidden sm:block">{t.brandSubtitle}</p>
        </div>
      </div>

      {/* Workflow Quick Status & Actions */}
      <div className="flex items-center space-x-2 md:space-x-4 rtl:space-x-reverse">
        {/* Session State Badge */}
        <div className="hidden lg:flex items-center space-x-2 rtl:space-x-reverse bg-[#20242D] px-3 py-1.5 rounded-lg border border-[#20242D]">
          <div className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse"></div>
          <span className="text-xs font-mono text-[#94A3B8]">
            {t.sessionStatus}: <strong className="text-white">{sessionState.sessionState}</strong>
          </span>
        </div>

        {/* Language Switcher */}
        <button
          onClick={onToggleLang}
          className="flex items-center space-x-1.5 rtl:space-x-reverse px-3 py-1.5 rounded-lg bg-[#20242D] hover:bg-[#20242D]/80 text-white text-xs font-medium transition border border-[#20242D]"
          title="Toggle Language / تغییر زبان"
        >
          <Globe className="w-4 h-4 text-[#22D3EE]" />
          <span>{lang === 'fa' ? 'English' : 'فارسی'}</span>
        </button>

        {/* Help */}
        <button
          onClick={onOpenHelp}
          className="p-2 rounded-lg bg-[#20242D] hover:bg-[#20242D]/80 text-[#94A3B8] hover:text-white transition"
          title={t.help}
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-lg bg-[#20242D] hover:bg-[#20242D]/80 text-[#94A3B8] hover:text-white transition"
          title={t.settings}
        >
          <SettingsIcon className="w-4 h-4" />
        </button>

        {/* Reset Session */}
        <button
          onClick={onResetSession}
          className="flex items-center space-x-1 rtl:space-x-reverse px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium transition border border-red-500/20"
          title={t.resetSession}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="hidden md:inline">{t.resetSession}</span>
        </button>
      </div>
    </header>
  );
}
