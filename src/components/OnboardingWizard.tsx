import { useState } from 'react';
import { Server, ShieldCheck, ArrowRight, ArrowLeft, Terminal, Key, Cpu, Sparkles } from 'lucide-react';
import type { Language } from '../types';
import type { TransferOptions } from '../engines/transfer-install/command-generator';

interface OnboardingWizardProps {
  lang: Language;
  onCompleteSetup: (serverOpts: TransferOptions, vpnUri: string, detectedInfo?: { distro: string; arch: string }) => void;
}

export function OnboardingWizard({ lang, onCompleteSetup }: OnboardingWizardProps) {
  const isFa = lang === 'fa';
  const [step, setStep] = useState<number>(1);

  // Form states
  const [vpsIp, setVpsIp] = useState('');
  const [sshPort, setSshPort] = useState(22);
  const [sshUser] = useState('root');
  const [authMethod, setAuthMethod] = useState<'key' | 'password'>('key');
  const [privateKeyPath, setPrivateKeyPath] = useState('~/.ssh/id_rsa');
  const [terminalOutput, setTerminalOutput] = useState('');
  const [detectedSummary, setDetectedSummary] = useState<{ distro: string; arch: string } | null>(null);
  const [vpnUri, setVpnUri] = useState('');

  const sampleVpnPlaceholder = 'vless://12345678-1234-5678-1234-567812345678@example.com:443?security=reality&pbk=pub123&sid=abc&sni=yahoo.com#MyTunnel';

  const inspectCommand = `cat /etc/os-release && uname -m && id && command -v systemctl`;

  const handleCopyInspect = () => {
    navigator.clipboard.writeText(inspectCommand);
    alert(isFa ? 'دستور کپی شد. آن را در ترمینال سرور خود اجرا کرده و خروجی‌اش را در کادر پایین paste کنید.' : 'Command copied. Run it in your server terminal and paste the output below.');
  };

  const handleParseTerminalOutput = () => {
    if (!terminalOutput.trim()) return;
    const text = terminalOutput.toLowerCase();

    let arch = 'amd64';
    if (text.includes('aarch64') || text.includes('arm64')) {
      arch = 'arm64';
    } else if (text.includes('x86_64') || text.includes('amd64')) {
      arch = 'amd64';
    }

    let distro = 'ubuntu-22.04';
    if (text.includes('ubuntu 24.04') || text.includes('version_id="24.04"')) {
      distro = 'ubuntu-24.04';
    } else if (text.includes('ubuntu 22.04') || text.includes('version_id="22.04"')) {
      distro = 'ubuntu-22.04';
    } else if (text.includes('debian 12') || text.includes('bookworm')) {
      distro = 'debian-12';
    } else if (text.includes('ubuntu')) {
      distro = 'ubuntu-24.04';
    }

    setDetectedSummary({ distro, arch });
  };

  const handleFinish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vpsIp.trim()) {
      alert(isFa ? 'لطفاً آی‌پی یا دامنه سرور VPS خود را وارد کنید.' : 'Please enter your VPS IP or hostname.');
      return;
    }
    const transferOpts: TransferOptions = {
      localOs: 'windows-powershell',
      vpsIp: vpsIp.trim(),
      sshPort,
      sshUser,
      authMethod,
      privateKeyPath,
      remoteStagingDir: '/tmp/tunnel-fetch',
      zipFilename: 'tunnel-fetch-offline-bundle.zip',
      expectedSha256: ''
    };
    onCompleteSetup(transferOpts, vpnUri.trim() || sampleVpnPlaceholder, detectedSummary || undefined);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0B0D10]/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#161922] border border-[#2A303C] rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#F59E0B]/5 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center space-x-3 rtl:space-x-reverse mb-6 pb-4 border-b border-[#2A303C]">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#F59E0B] to-[#22D3EE] p-0.5 flex items-center justify-center shadow-lg">
            <div className="w-full h-full bg-[#111318] rounded-[14px] flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-[#F59E0B]" />
            </div>
          </div>
          <div>
            <h2 className="text-lg font-bold text-white font-mono">
              {isFa ? 'راه‌اندازی هوشمند Tunnel Fetch (تشخیص خودکار سرور)' : 'Smart Setup Wizard (Auto-Detect Server)'}
            </h2>
            <p className="text-xs text-[#94A3B8]">
              {isFa ? 'اطلاعات سرور خود را وارد کنید تا پکیج و دستورات دقیقاً با سیستم‌عامل شما سازگار شوند.' : 'Enter your server specs so bundles and commands match your OS perfectly.'}
            </p>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-6 text-xs font-mono">
          <span className={`px-3 py-1 rounded-full ${step === 1 ? 'bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/30' : 'bg-[#20242D] text-[#94A3B8]'}`}>
            {isFa ? 'مرحله ۱: مشخصات و تشخیص سرور' : 'Step 1: Server Info & Detection'}
          </span>
          <span className={`px-3 py-1 rounded-full ${step === 2 ? 'bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/30' : 'bg-[#20242D] text-[#94A3B8]'}`}>
            {isFa ? 'مرحله ۲: لینک اتصال VPN' : 'Step 2: VPN Connection Link'}
          </span>
        </div>

        <form onSubmit={step === 1 ? (e) => { e.preventDefault(); if(!vpsIp.trim()) { alert(isFa ? 'لطفاً آی‌پی سرور را وارد کنید' : 'Please enter VPS IP'); return; } setStep(2); } : handleFinish} className="space-y-5">
          {step === 1 ? (
            <div className="space-y-4 font-mono text-xs">
              {/* Server Info Helper & Paste Box */}
              <div className="bg-[#0B0D10] p-4 rounded-2xl border border-[#2A303C] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[#22D3EE] font-bold flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#F59E0B]" />
                    {isFa ? 'تشخیص هوشمند مشخصات سرور (توصیه شده)' : 'Smart Server Detection (Recommended)'}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyInspect}
                    className="px-3 py-1 rounded-lg bg-[#20242D] hover:bg-[#20242D]/80 text-white text-[11px] border border-[#2A303C] transition"
                  >
                    {isFa ? 'کپی دستور بررسی سرور' : 'Copy Inspect Command'}
                  </button>
                </div>
                <p className="text-[11px] text-[#94A3B8]">
                  {isFa ? 'دستور بالا را در سرور اجرا کرده و خروجی ترمینال را در کادر زیر paste کنید تا نسخه و معماری به طور خودکار تنظیم شود:' : 'Run command on server and paste terminal output below to auto-detect OS and architecture:'}
                </p>
                <div className="flex gap-2">
                  <textarea
                    rows={3}
                    value={terminalOutput}
                    onChange={(e) => setTerminalOutput(e.target.value)}
                    placeholder="PRETTY_NAME=&quot;Ubuntu 24.04.4 LTS&quot;... x86_64..."
                    className="w-full bg-[#161922] border border-[#2A303C] rounded-xl p-2.5 text-zinc-300 text-[11px] font-mono focus:outline-none focus:border-[#22D3EE]"
                  />
                  <button
                    type="button"
                    onClick={handleParseTerminalOutput}
                    className="px-4 py-2 bg-[#22D3EE]/20 hover:bg-[#22D3EE]/30 text-[#22D3EE] border border-[#22D3EE]/30 rounded-xl font-bold transition shrink-0"
                  >
                    {isFa ? 'تشخیص' : 'Detect'}
                  </button>
                </div>
                {detectedSummary && (
                  <div className="p-2.5 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/30 text-[#22C55E] flex items-center justify-between">
                    <span>{isFa ? `تشخیص موفق: ${detectedSummary.distro.toUpperCase()} (${detectedSummary.arch.toUpperCase()})` : `Detected: ${detectedSummary.distro} (${detectedSummary.arch})`}</span>
                    <Cpu className="w-4 h-4" />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-[#94A3B8] mb-1.5">{isFa ? 'آدرس IP سرور VPS (الزامی - خالی برای ورود دستی)' : 'VPS IP Address (Required)'}</label>
                  <div className="relative">
                    <Server className="absolute rtl:right-3 ltr:left-3 top-3 w-4 h-4 text-[#22D3EE]" />
                    <input
                      type="text"
                      required
                      value={vpsIp}
                      onChange={(e) => setVpsIp(e.target.value)}
                      placeholder="مثال: 192.168.1.50 یا 94.184.x.x"
                      className="w-full bg-[#0B0D10] border border-[#2A303C] rounded-xl px-4 rtl:pr-10 ltr:pl-10 py-2.5 text-white focus:border-[#22D3EE] focus:outline-none placeholder-zinc-600"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[#94A3B8] mb-1.5">{isFa ? 'پورت SSH' : 'SSH Port'}</label>
                  <input
                    type="number"
                    required
                    value={sshPort}
                    onChange={(e) => setSshPort(Number(e.target.value))}
                    className="w-full bg-[#0B0D10] border border-[#2A303C] rounded-xl px-3 py-2.5 text-white focus:border-[#22D3EE] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#94A3B8] mb-1.5">{isFa ? 'نام کاربری SSH' : 'SSH Username'}</label>
                  <div className="relative">
                    <Terminal className="absolute rtl:right-3 ltr:left-3 top-3 w-4 h-4 text-[#F59E0B]" />
                    <input
                      type="text"
                      required
                      value={sshUser}
                      onChange={(e) => setSSHUserPlaceholder(e.target.value)}
                      className="w-full bg-[#0B0D10] border border-[#2A303C] rounded-xl px-4 rtl:pr-10 ltr:pl-10 py-2.5 text-white focus:border-[#22D3EE] focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[#94A3B8] mb-1.5">{isFa ? 'روش احراز هویت' : 'Authentication Method'}</label>
                  <select
                    value={authMethod}
                    onChange={(e) => setAuthMethod(e.target.value as any)}
                    className="w-full bg-[#0B0D10] border border-[#2A303C] rounded-xl px-3 py-2.5 text-white focus:border-[#22D3EE] focus:outline-none"
                  >
                    <option value="key">{isFa ? 'کلید خصوصی (SSH Key)' : 'SSH Private Key'}</option>
                    <option value="password">{isFa ? 'رمز عبور (تعاملی در ترمینال)' : 'Password (Interactive)'}</option>
                  </select>
                </div>
              </div>

              {authMethod === 'key' && (
                <div>
                  <label className="block text-[#94A3B8] mb-1.5">{isFa ? 'مسیر کلید خصوصی' : 'Private Key Path'}</label>
                  <div className="relative">
                    <Key className="absolute rtl:right-3 ltr:left-3 top-3 w-4 h-4 text-purple-400" />
                    <input
                      type="text"
                      value={privateKeyPath}
                      onChange={(e) => setPrivateKeyPath(e.target.value)}
                      className="w-full bg-[#0B0D10] border border-[#2A303C] rounded-xl px-4 rtl:pr-10 ltr:pl-10 py-2.5 text-white focus:border-[#22D3EE] focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4 font-mono text-xs">
              <div>
                <label className="block text-[#94A3B8] mb-1.5">
                  {isFa ? 'رشته اتصال VPN (VLESS / VMess / Trojan / SS)' : 'VPN Connection String (VLESS / VMess / Trojan / SS)'}
                </label>
                <textarea
                  rows={5}
                  value={vpnUri}
                  onChange={(e) => setVpnUri(e.target.value)}
                  placeholder={sampleVpnPlaceholder}
                  className="w-full bg-[#0B0D10] border border-[#2A303C] rounded-xl p-3 text-white focus:border-[#22D3EE] focus:outline-none font-mono placeholder-zinc-600"
                />
              </div>
              <p className="text-[11px] text-[#94A3B8]">
                {isFa ? 'این لینک به صورت امن در حافظه موقت مرورگر تجزیه شده و کانفیگ سرور شما را می‌سازد.' : 'This link will be securely parsed in browser memory to build your server configuration.'}
              </p>
            </div>
          )}

          {/* Footer Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-[#2A303C]">
            {step === 2 ? (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center space-x-1.5 rtl:space-x-reverse px-4 py-2.5 rounded-xl bg-[#20242D] hover:bg-[#20242D]/80 text-white text-xs font-mono transition border border-[#2A303C]"
              >
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                <span>{isFa ? 'مرحله قبل' : 'Back'}</span>
              </button>
            ) : <div />}

            <button
              type="submit"
              className="flex items-center space-x-2 rtl:space-x-reverse px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#22D3EE] text-[#111318] font-bold text-xs font-mono uppercase tracking-wider hover:opacity-95 transition shadow-lg shadow-[#F59E0B]/20"
            >
              <span>{step === 1 ? (isFa ? 'مرحله بعد' : 'Next Step') : (isFa ? 'شروع هوشمند تونل فچ' : 'Start Tunnel Fetch')}</span>
              <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function setSSHUserPlaceholder(val: string) {
  return val;
}
