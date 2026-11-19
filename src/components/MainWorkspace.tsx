import { useState, useRef } from 'react';
import { Terminal, CheckCircle, Sliders, Database, Lock, ShieldCheck, RefreshCw, Download, Copy, Code, Package, FileCheck, Server, Laptop, Upload, Activity, Globe, ShieldAlert, ArrowDownCircle } from 'lucide-react';
import type { Language, WorkflowStep } from '../types';
import { translations } from '../i18n';
import { CommandCenter } from './CommandCenter';
import { getStepById } from '../workflow/step-registry';
import { checkStepPrerequisites } from '../workflow/dependency-graph';
import { parseVpnUri } from '../engines/vpn-parser';
import type { ParsedVpnConfig } from '../engines/vpn-parser/types';
import { generateXrayConfig } from '../engines/xray-generator';
import type { XrayGeneratorOptions, GenerationResult } from '../engines/xray-generator/types';
import { COMPATIBILITY_MATRIX, validateCompatibility, type LinuxDistro, type LinuxArch } from '../engines/offline-bundle/compatibility';
import { computeSha256 } from '../engines/offline-bundle/checksum';
import { buildOfflineBundle } from '../engines/offline-bundle/builder';
import type { BundleManifest } from '../engines/offline-bundle/manifest';
import { generateTransferCommands, type TransferOptions } from '../engines/transfer-install/command-generator';
import { generateConfigUploadCommands, type ConfigUploadOptions } from '../engines/transfer-install/config-upload-generator';
import { generateConfigApplyCommands, type ConfigApplyOptions } from '../engines/transfer-install/config-apply-generator';
import { generateConnectivityCommands, type ConnectivityOptions } from '../engines/connectivity/connectivity-generator';
import { generateDownloaderProxyCommands } from '../engines/downloader-routing/proxy-generator';
import { generateTargetInstallerCommands, type TargetInstallerOptions } from '../engines/target-installer/installer-generator';

interface MainWorkspaceProps {
  step: WorkflowStep;
  lang: Language;
  onToggleStatusPanel: () => void;
  isStatusPanelOpen: boolean;
  runtimeStatus: string;
  onUpdateRuntimeStatus: (stepId: number, status: any) => void;
  allRuntimeStatuses: Record<number, string>;
}

export function MainWorkspace({
  step,
  lang,
  onToggleStatusPanel,
  isStatusPanelOpen,
  runtimeStatus,
  onUpdateRuntimeStatus,
  allRuntimeStatuses
}: MainWorkspaceProps) {
  const t = translations[lang];
  const stepDef = getStepById(step.id);
  const title = lang === 'fa' ? step.titleFa : step.titleEn;
  const description = lang === 'fa' ? step.descriptionFa : step.descriptionEn;

  // Step 1 state (Offline Bundle)
  const [selectedDistro, setSelectedDistro] = useState<LinuxDistro>('ubuntu-22.04');
  const [selectedArch, setSelectedArch] = useState<LinuxArch>('amd64');
  const [xrayVersion, setXrayVersion] = useState('v1.8.24');
  const [binaryFile, setBinaryFile] = useState<File | null>(null);
  const [binaryHash, setBinaryHash] = useState('');
  const [calculatingHash, setCalculatingHash] = useState(false);
  const [bundleManifest, setBundleManifest] = useState<BundleManifest | null>(null);
  const [bundleBlob, setBundleBlob] = useState<Blob | null>(null);
  const [bundleFileName, setBundleFileName] = useState('tunnel-fetch-offline.zip');
  const [acceptedStep1, setAcceptedStep1] = useState(false);

  const binaryInputRef = useRef<HTMLInputElement>(null);

  // Step 2 state (Transfer & Install)
  const [transferOpts, setTransferOpts] = useState<TransferOptions>({
    localOs: 'windows-powershell',
    vpsIp: '203.0.113.50',
    sshPort: 22,
    sshUser: 'root',
    authMethod: 'key',
    privateKeyPath: '~/.ssh/id_rsa',
    remoteStagingDir: '/tmp/tunnel-fetch-staging',
    zipFilename: 'tunnel-fetch-offline.zip',
    expectedSha256: ''
  });
  const [acceptedStep2, setAcceptedStep2] = useState(false);

  // Step 3 state
  const [uriInput, setUriInput] = useState('');
  const [parsedConfig, setParsedConfig] = useState<ParsedVpnConfig | null>(null);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [parseWarnings, setParseWarnings] = useState<string[]>([]);
  const [acceptedStep3, setAcceptedStep3] = useState(false);

  // Step 4 state
  const [genOptions, setGenOptions] = useState<XrayGeneratorOptions>({
    targetVersion: 'v1.8.24',
    socksPort: 1080,
    enableHttpInbound: false,
    httpPort: 1081,
    enableIranDirect: true,
    enablePrivateIpDirect: true,
    dnsServers: ['1.1.1.1', '8.8.8.8']
  });
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null);
  const [acceptedStep4, setAcceptedStep4] = useState(false);

  // Step 5 state (Config Upload)
  const [uploadOpts, setUploadOpts] = useState<ConfigUploadOptions>({
    localOs: 'windows-powershell',
    vpsIp: '203.0.113.50',
    sshPort: 22,
    sshUser: 'root',
    authMethod: 'key',
    privateKeyPath: '~/.ssh/id_rsa',
    stagingDir: '/tmp/tunnel-fetch-config-staging',
    expectedSha256: ''
  });
  const [configJsonHash, setConfigJsonHash] = useState('');
  const [acceptedStep5, setAcceptedStep5] = useState(false);

  // Step 6 state (Config Apply)
  const [applyOpts, setApplyOpts] = useState<ConfigApplyOptions>({
    localOs: 'windows-powershell',
    vpsIp: '203.0.113.50',
    sshPort: 22,
    sshUser: 'root',
    authMethod: 'key',
    privateKeyPath: '~/.ssh/id_rsa',
    stagingConfigPath: '/tmp/tunnel-fetch-config-staging/config.json',
    activeConfigPath: '/usr/local/etc/xray/config.json',
    xrayBinaryPath: '/usr/local/bin/xray',
    backupDir: '/usr/local/etc/xray/backups'
  });
  const [acceptedStep6, setAcceptedStep6] = useState(false);

  // Step 7 & 8 state (Service & Connectivity)
  const [connOpts, setConnOpts] = useState<ConnectivityOptions>({
    localOs: 'windows-powershell',
    vpsIp: '203.0.113.50',
    sshPort: 22,
    sshUser: 'root',
    authMethod: 'key',
    privateKeyPath: '~/.ssh/id_rsa',
    socksPort: 1080
  });
  const [acceptedStep7, setAcceptedStep7] = useState(false);
  const [acceptedStep8, setAcceptedStep8] = useState(false);

  // Step 9 state (Downloader Routing)
  const [acceptedStep9, setAcceptedStep9] = useState(false);

  // Step 10 state (Target Installer)
  const [targetOpts, setTargetOpts] = useState<TargetInstallerOptions>({
    url: 'https://github.com/example/tool/releases/download/v1.0.0/tool-linux-amd64',
    filename: 'tool-linux-amd64',
    destinationDir: '/tmp',
    expectedSha256: '',
    socksPort: 1080,
    mode: 'download-review'
  });
  const [acceptedStep10, setAcceptedStep10] = useState(false);

  // Check prerequisites
  const prereqCheck = checkStepPrerequisites(step.id, allRuntimeStatuses as any);
  const compatibility = validateCompatibility(selectedDistro, selectedArch);

  // Handle Binary File Selection & Hash Calculation
  const handleBinarySelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBinaryFile(file);
    setCalculatingHash(true);
    try {
      const buffer = await file.arrayBuffer();
      const hash = await computeSha256(buffer);
      setBinaryHash(hash);
      setTransferOpts(prev => ({ ...prev, expectedSha256: hash }));
    } catch (err) {
      console.error('Failed to compute hash', err);
    } finally {
      setCalculatingHash(false);
    }
  };

  const handleBuildBundle = async () => {
    if (!binaryFile || !binaryHash) return;
    const res = await buildOfflineBundle({
      xrayVersion,
      architecture: selectedArch,
      distribution: selectedDistro,
      binaryFile,
      binaryHash,
    });
    setBundleManifest(res.manifest);
    setBundleBlob(res.zipBlob);
    setBundleFileName(res.fileName);
    setTransferOpts(prev => ({ ...prev, zipFilename: res.fileName, expectedSha256: binaryHash }));
    onUpdateRuntimeStatus(step.id, 'WAITING_USER');
  };

  const handleAcceptStep1 = () => {
    if (!bundleManifest || !bundleBlob) return;
    setAcceptedStep1(true);
    onUpdateRuntimeStatus(step.id, 'PASS');
  };

  const handleDownloadBundleZip = () => {
    if (!bundleBlob) return;
    const url = URL.createObjectURL(bundleBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = bundleFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Step 2 handlers
  const transferCommands = generateTransferCommands(transferOpts);
  const handleAcceptStep2 = () => {
    setAcceptedStep2(true);
    onUpdateRuntimeStatus(step.id, 'PASS');
  };

  // Step 3 handlers
  const handleParseUri = (e: React.FormEvent) => {
    e.preventDefault();
    setAcceptedStep3(false);
    if (!prereqCheck.canExecute) return;

    if (!uriInput.trim()) {
      setParseErrors([lang === 'fa' ? 'رشته اتصال VPN نمی‌تواند خالی باشد.' : 'VPN URI string cannot be empty.']);
      setParsedConfig(null);
      return;
    }

    const result = parseVpnUri(uriInput);
    if (result.success) {
      setParsedConfig(result.config);
      setParseErrors([]);
      setParseWarnings(result.warnings.map(w => w.message));
      onUpdateRuntimeStatus(step.id, 'WAITING_USER');
    } else {
      setParsedConfig(null);
      setParseErrors(result.errors.map(err => `[${err.code}] ${err.message}`));
      setParseWarnings(result.warnings.map(w => w.message));
    }
  };

  const handleAcceptConfig = () => {
    if (!parsedConfig) return;
    setAcceptedStep3(true);
    onUpdateRuntimeStatus(step.id, 'PASS');
  };

  // Step 4 handlers
  const handleGenerateXray = async () => {
    if (!parsedConfig) return;
    const res = generateXrayConfig(parsedConfig, genOptions);
    setGenerationResult(res);
    if (res.success) {
      const encoder = new TextEncoder();
      const hash = await computeSha256(encoder.encode(res.json).buffer);
      setConfigJsonHash(hash);
      setUploadOpts(prev => ({ ...prev, expectedSha256: hash, vpsIp: transferOpts.vpsIp, sshPort: transferOpts.sshPort, sshUser: transferOpts.sshUser }));
      setApplyOpts(prev => ({ ...prev, vpsIp: transferOpts.vpsIp, sshPort: transferOpts.sshPort, sshUser: transferOpts.sshUser, authMethod: transferOpts.authMethod, privateKeyPath: transferOpts.privateKeyPath }));
      setConnOpts(prev => ({ ...prev, vpsIp: transferOpts.vpsIp, sshPort: transferOpts.sshPort, sshUser: transferOpts.sshUser, authMethod: transferOpts.authMethod, privateKeyPath: transferOpts.privateKeyPath, socksPort: genOptions.socksPort }));
      setTargetOpts(prev => ({ ...prev, socksPort: genOptions.socksPort }));
      onUpdateRuntimeStatus(step.id, 'WAITING_USER');
    }
  };

  const handleAcceptStep4 = () => {
    if (!generationResult || !generationResult.success) return;
    setAcceptedStep4(true);
    onUpdateRuntimeStatus(step.id, 'PASS');
  };

  const handleDownloadJson = () => {
    if (!generationResult || !generationResult.success) return;
    const blob = new Blob([generationResult.json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'config.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyJson = () => {
    if (!generationResult || !generationResult.success) return;
    navigator.clipboard.writeText(generationResult.json);
  };

  // Step 5 handlers
  const uploadCommands = generateConfigUploadCommands(uploadOpts);
  const handleAcceptStep5 = () => {
    setAcceptedStep5(true);
    onUpdateRuntimeStatus(step.id, 'PASS');
  };

  // Step 6 handlers
  const applyCommands = generateConfigApplyCommands(applyOpts);
  const handleAcceptStep6 = () => {
    setAcceptedStep6(true);
    onUpdateRuntimeStatus(step.id, 'PASS');
  };

  // Step 7 & 8 handlers
  const connectivityCommands = generateConnectivityCommands(connOpts);
  const handleAcceptStep7 = () => {
    setAcceptedStep7(true);
    onUpdateRuntimeStatus(step.id, 'PASS');
  };

  const handleAcceptStep8 = () => {
    setAcceptedStep8(true);
    onUpdateRuntimeStatus(step.id, 'PASS');
  };

  // Step 9 handlers (Downloader Routing)
  const proxyCommands = generateDownloaderProxyCommands({
    socksPort: genOptions.socksPort,
    enableHttp: genOptions.enableHttpInbound,
    httpPort: genOptions.httpPort
  });
  const handleAcceptStep9 = () => {
    setAcceptedStep9(true);
    onUpdateRuntimeStatus(step.id, 'PASS');
  };

  // Step 10 handlers (Target Installer)
  const installerCommands = generateTargetInstallerCommands(targetOpts);

  return (
    <main className="flex-1 flex flex-col min-w-0 overflow-y-auto p-4 md:p-8 bg-[#111318]">
      {/* Top Bar inside Workspace */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-[#20242D]">
        <div>
          <div className="flex items-center space-x-2 rtl:space-x-reverse mb-1">
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#F59E0B]/10 text-[#F59E0B] font-mono font-bold border border-[#F59E0B]/20">
              {t.step} {step.id < 10 ? `0${step.id}` : step.id}
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#20242D] text-[#94A3B8] font-mono">
              {t.status}: <strong className="text-white">{runtimeStatus}</strong>
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-300 font-mono border border-purple-500/20">
              {stepDef?.implementationStatus}
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-wide">{title}</h2>
        </div>

        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <button
            onClick={onToggleStatusPanel}
            className={`flex items-center space-x-2 rtl:space-x-reverse px-4 py-2 rounded-xl text-xs font-mono transition border ${
              isStatusPanelOpen
                ? 'bg-[#22D3EE]/10 text-[#22D3EE] border-[#22D3EE]/30'
                : 'bg-[#20242D] text-white border-[#20242D] hover:bg-[#20242D]/80'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>{t.sessionStatus}</span>
          </button>
        </div>
      </div>

      {/* Description Card */}
      <div className="bg-[#20242D]/30 border border-[#20242D] rounded-2xl p-5 mb-6">
        <p className="text-sm text-[#94A3B8] leading-relaxed mb-4">{description}</p>

        {stepDef && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-[#20242D]/50 text-xs font-mono">
            <div>
              <span className="text-[#94A3B8] block mb-1">{lang === 'fa' ? 'پیش‌نیازها:' : 'Prerequisites:'}</span>
              <span className="text-white">
                {stepDef.prerequisites.length > 0 ? stepDef.prerequisites.map(id => `Step 0${id}`).join(', ') : (lang === 'fa' ? 'بدون پیش‌نیاز' : 'None')}
              </span>
            </div>
            <div>
              <span className="text-[#94A3B8] block mb-1">{lang === 'fa' ? 'ورودی‌های موردنیاز:' : 'Required Inputs:'}</span>
              <span className="text-white">{stepDef.requiredInputs.join(' | ')}</span>
            </div>
            <div>
              <span className="text-[#94A3B8] block mb-1">{lang === 'fa' ? 'خروجی‌های مورد انتظار:' : 'Expected Outputs:'}</span>
              <span className="text-white">{stepDef.expectedOutputs.join(' | ')}</span>
            </div>
          </div>
        )}
      </div>

      {!prereqCheck.canExecute && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center space-x-3 rtl:space-x-reverse text-amber-300 text-xs font-mono">
          <Lock className="w-5 h-5 shrink-0 text-amber-400" />
          <div>
            <p className="font-bold mb-0.5">{lang === 'fa' ? 'پیش‌نیاز این مرحله رعایت نشده است' : 'Prerequisite Not Met'}</p>
            <p>{lang === 'fa' ? prereqCheck.reasonFa : prereqCheck.reasonEn}</p>
          </div>
        </div>
      )}

      {/* STEP 1: OFFLINE BUNDLE */}
      {step.id === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-[#111318] border border-[#20242D] rounded-2xl p-5 shadow-lg space-y-4 font-mono text-xs">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Package className="w-4 h-4 text-[#F59E0B]" />
              {lang === 'fa' ? 'انتخاب پلتفرم و فایل‌های باینری Xray Core' : 'Platform Target & Binary Asset Selection'}
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-[#94A3B8] mb-1">{lang === 'fa' ? 'توزیع لینوکس هدف' : 'Target Linux Distribution'}</label>
                <select
                  value={selectedDistro}
                  onChange={(e) => setSelectedDistro(e.target.value as LinuxDistro)}
                  className="w-full bg-[#20242D]/50 border border-[#20242D] rounded-xl px-3 py-2 text-white"
                >
                  {COMPATIBILITY_MATRIX.map((m) => (
                    <option key={m.distro} value={m.distro}>{m.distroName}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#94A3B8] mb-1">{lang === 'fa' ? 'معماری پردازنده' : 'CPU Architecture'}</label>
                  <select
                    value={selectedArch}
                    onChange={(e) => setSelectedArch(e.target.value as LinuxArch)}
                    className="w-full bg-[#20242D]/50 border border-[#20242D] rounded-xl px-3 py-2 text-white"
                  >
                    <option value="amd64">AMD64 / x86_64</option>
                    <option value="arm64">ARM64 / aarch64</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#94A3B8] mb-1">{lang === 'fa' ? 'نسخه Xray Core' : 'Xray Core Version'}</label>
                  <input
                    type="text"
                    value={xrayVersion}
                    onChange={(e) => setXrayVersion(e.target.value)}
                    className="w-full bg-[#20242D]/50 border border-[#20242D] rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              {!compatibility.compatible && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
                  {compatibility.reason}
                </div>
              )}

              <div className="pt-2">
                <label className="block text-[#94A3B8] mb-1.5">{lang === 'fa' ? 'فایل باینری Xray (ELF)' : 'Xray Binary Executable (ELF)'}</label>
                <input
                  type="file"
                  ref={binaryInputRef}
                  onChange={handleBinarySelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => binaryInputRef.current?.click()}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#20242D] hover:bg-[#20242D]/80 text-white font-mono text-xs border border-[#20242D] flex items-center justify-center gap-2 transition"
                >
                  <FileCheck className="w-4 h-4 text-[#22D3EE]" />
                  <span>{binaryFile ? binaryFile.name : (lang === 'fa' ? 'انتخاب فایل باینری xray' : 'Select xray binary file')}</span>
                </button>
                {calculatingHash && <p className="text-[11px] text-[#22D3EE] mt-1">Calculating SHA256...</p>}
              </div>

              {binaryHash && (
                <div>
                  <label className="block text-[#94A3B8] mb-1">Calculated SHA256 Checksum</label>
                  <input
                    type="text"
                    readOnly
                    value={binaryHash}
                    className="w-full bg-[#0B0D10] border border-[#20242D] rounded-xl px-3 py-1.5 text-zinc-300 font-mono text-[11px]"
                  />
                </div>
              )}
            </div>

            <button
              onClick={handleBuildBundle}
              disabled={!binaryFile || !compatibility.compatible || calculatingHash}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#22D3EE] text-[#111318] font-bold text-xs uppercase tracking-wider hover:opacity-95 disabled:opacity-40 transition shadow-lg shadow-[#F59E0B]/20"
            >
              {lang === 'fa' ? 'ساخت بسته آفلاین (ZIP)' : 'Build Offline Installation ZIP'}
            </button>
          </div>

          <div className="bg-[#111318] border border-[#20242D] rounded-2xl p-5 flex flex-col justify-between shadow-lg">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-[#22D3EE]" />
                  {lang === 'fa' ? 'مانیفست پکیج و دانلود ZIP' : 'Bundle Manifest & ZIP Download'}
                </h3>
                {bundleBlob && (
                  <button
                    onClick={handleDownloadBundleZip}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#22D3EE]/20 text-[#22D3EE] hover:bg-[#22D3EE]/30 transition text-xs font-mono border border-[#22D3EE]/30"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download ZIP</span>
                  </button>
                )}
              </div>

              <div className="bg-[#0B0D10] border border-[#20242D] rounded-xl p-3 h-[240px] font-mono text-[11px] text-zinc-300 overflow-auto">
                {bundleManifest ? (
                  <pre><code>{JSON.stringify(bundleManifest, null, 2)}</code></pre>
                ) : (
                  <p className="text-[#94A3B8] text-center pt-20 font-mono text-xs">
                    {lang === 'fa' ? 'هنوز بسته‌ای ساخته نشده است.' : 'No offline bundle built yet.'}
                  </p>
                )}
              </div>
            </div>

            {bundleManifest && !acceptedStep1 && (
              <button
                onClick={handleAcceptStep1}
                className="mt-4 w-full py-2.5 px-4 rounded-xl bg-[#22C55E] hover:bg-[#22C55E]/90 text-[#111318] font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-[#22C55E]/20"
              >
                {lang === 'fa' ? 'تایید پکیج آفلاین و ثبت در وضعیت' : 'Accept & Register Offline Bundle'}
              </button>
            )}

            {acceptedStep1 && (
              <div className="mt-4 p-3 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/30 flex items-center space-x-2 rtl:space-x-reverse text-[#22C55E] text-xs font-mono">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{lang === 'fa' ? 'بسته آفلاین تایید شد. اکنون می‌توانید به مراحل بعدی بروید.' : 'Offline bundle accepted and verified successfully.'}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 2: TRANSFER & INSTALL */}
      {step.id === 2 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#111318] border border-[#20242D] rounded-2xl p-5 shadow-lg space-y-4 font-mono text-xs">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Server className="w-4 h-4 text-[#F59E0B]" />
                {lang === 'fa' ? 'تنظیمات اتصال VPS و پلتفرم محلی' : 'VPS Connection & Local Platform Settings'}
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-[#94A3B8] mb-1">{lang === 'fa' ? 'سیستم‌عامل محلی' : 'Local Operating System'}</label>
                  <select
                    value={transferOpts.localOs}
                    onChange={(e) => setTransferOpts({ ...transferOpts, localOs: e.target.value as any })}
                    className="w-full bg-[#20242D]/50 border border-[#20242D] rounded-xl px-3 py-2 text-white"
                  >
                    <option value="windows-powershell">Windows PowerShell</option>
                    <option value="linux-terminal">Linux Terminal</option>
                    <option value="macos-terminal">macOS Terminal</option>
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-[#94A3B8] mb-1">VPS IP / Hostname</label>
                    <input
                      type="text"
                      value={transferOpts.vpsIp}
                      onChange={(e) => setTransferOpts({ ...transferOpts, vpsIp: e.target.value })}
                      className="w-full bg-[#20242D]/50 border border-[#20242D] rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[#94A3B8] mb-1">SSH Port</label>
                    <input
                      type="number"
                      value={transferOpts.sshPort}
                      onChange={(e) => setTransferOpts({ ...transferOpts, sshPort: Number(e.target.value) })}
                      className="w-full bg-[#20242D]/50 border border-[#20242D] rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#94A3B8] mb-1">SSH User</label>
                    <input
                      type="text"
                      value={transferOpts.sshUser}
                      onChange={(e) => setTransferOpts({ ...transferOpts, sshUser: e.target.value })}
                      className="w-full bg-[#20242D]/50 border border-[#20242D] rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[#94A3B8] mb-1">Auth Method</label>
                    <select
                      value={transferOpts.authMethod}
                      onChange={(e) => setTransferOpts({ ...transferOpts, authMethod: e.target.value as any })}
                      className="w-full bg-[#20242D]/50 border border-[#20242D] rounded-xl px-3 py-2 text-white"
                    >
                      <option value="key">SSH Private Key</option>
                      <option value="password">Password (Interactive)</option>
                    </select>
                  </div>
                </div>

                {transferOpts.authMethod === 'key' && (
                  <div>
                    <label className="block text-[#94A3B8] mb-1">Private Key Path</label>
                    <input
                      type="text"
                      value={transferOpts.privateKeyPath}
                      onChange={(e) => setTransferOpts({ ...transferOpts, privateKeyPath: e.target.value })}
                      className="w-full bg-[#20242D]/50 border border-[#20242D] rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="bg-[#111318] border border-[#20242D] rounded-2xl p-5 shadow-lg space-y-4">
              <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                <Laptop className="w-4 h-4 text-[#22D3EE]" />
                {lang === 'fa' ? 'دستورات نصب Xray روی VPS' : 'Generated Installation Commands'}
              </h3>

              <div className="space-y-3 text-xs font-mono">
                <div>
                  <span className="text-[#94A3B8] block mb-1">1. Transfer & Extract & Install:</span>
                  <div className="bg-[#0B0D10] p-2 rounded-xl border border-[#20242D] text-zinc-300 overflow-x-auto select-text">
                    <code>{transferCommands.install}</code>
                  </div>
                </div>
              </div>

              {!acceptedStep2 ? (
                <button
                  onClick={handleAcceptStep2}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#22C55E] hover:bg-[#22C55E]/90 text-[#111318] font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-[#22C55E]/20"
                >
                  {lang === 'fa' ? 'تایید نصب و ثبت در وضعیت' : 'Confirm Installation & Register Step 02'}
                </button>
              ) : (
                <div className="p-3 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/30 flex items-center space-x-2 rtl:space-x-reverse text-[#22C55E] text-xs font-mono">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>{lang === 'fa' ? 'مرحله نصب تایید شد.' : 'Step 02 installation confirmed.'}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: VPN IMPORT */}
      {step.id === 3 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-[#111318] border border-[#20242D] rounded-2xl p-5 flex flex-col justify-between shadow-lg">
            <div>
              <h3 className="text-sm font-bold text-white font-mono mb-3 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#F59E0B]" />
                {lang === 'fa' ? 'ورودی رشته اتصال VPN (VLESS, VMess, Trojan, SS)' : 'VPN URI Connection String Input'}
              </h3>
              <form onSubmit={handleParseUri} className="space-y-4">
                <div>
                  <textarea
                    rows={4}
                    value={uriInput}
                    onChange={(e) => setUriInput(e.target.value)}
                    placeholder="vless://uuid@server:port?security=reality... یا vmess://... یا trojan://... یا ss://..."
                    className="w-full bg-[#20242D]/50 border border-[#20242D] rounded-xl p-3 text-xs text-white placeholder-zinc-500 font-mono focus:outline-none focus:border-[#22D3EE] transition"
                  />
                </div>
                <div className="flex space-x-2 rtl:space-x-reverse">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#22D3EE] text-[#111318] font-bold text-xs uppercase tracking-wider hover:opacity-95 transition shadow-lg shadow-[#F59E0B]/20"
                  >
                    {lang === 'fa' ? 'تجزیه و اعتبارسنجی' : 'Parse & Validate'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUriInput('');
                      setParsedConfig(null);
                      setParseErrors([]);
                      setParseWarnings([]);
                      setAcceptedStep3(false);
                    }}
                    className="py-2.5 px-4 rounded-xl bg-[#20242D] hover:bg-[#20242D]/80 text-[#94A3B8] hover:text-white text-xs font-mono transition"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>

            {(parseErrors.length > 0 || parseWarnings.length > 0) && (
              <div className="mt-4 space-y-2">
                {parseErrors.map((err, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 shrink-0 text-red-500" />
                    <span>{err}</span>
                  </div>
                ))}
                {parseWarnings.map((warn, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400" />
                    <span>[Warning] {warn}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-[#111318] border border-[#20242D] rounded-2xl p-5 flex flex-col justify-between shadow-lg">
            <div>
              <h3 className="text-sm font-bold text-white font-mono mb-3 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#22D3EE]" />
                {lang === 'fa' ? 'پیش‌نمایش پیکربندی (امن با پنهان‌سازی رمز)' : 'Configuration Preview (Masked Credentials)'}
              </h3>
              <div className="bg-[#0B0D10] border border-[#20242D] rounded-xl p-4 min-h-[160px] font-mono text-xs text-zinc-300 overflow-x-auto">
                {parsedConfig ? (
                  <div className="space-y-1.5">
                    <p><strong className="text-[#22D3EE]">Protocol:</strong> {parsedConfig.protocol.toUpperCase()}</p>
                    <p><strong className="text-[#22D3EE]">Name:</strong> {parsedConfig.name}</p>
                    <p><strong className="text-[#22D3EE]">Server:</strong> {parsedConfig.server}:{parsedConfig.port}</p>
                    <p><strong className="text-[#22D3EE]">Security:</strong> {parsedConfig.security}</p>
                    <p><strong className="text-[#22D3EE]">Transport:</strong> {parsedConfig.transport}</p>
                    {'uuid' in parsedConfig && <p><strong className="text-[#22D3EE]">UUID:</strong> {parsedConfig.uuid.substring(0, 8)}-****-****-****-************</p>}
                    {'password' in parsedConfig && <p><strong className="text-[#22D3EE]">Password:</strong> *******</p>}
                  </div>
                ) : (
                  <p className="text-[#94A3B8] text-center pt-10">
                    {lang === 'fa' ? 'هنوز کانفیگی تجزیه نشده است.' : 'No configuration parsed yet.'}
                  </p>
                )}
              </div>
            </div>

            {parsedConfig && !acceptedStep3 && (
              <button
                onClick={handleAcceptConfig}
                className="mt-4 w-full py-2.5 px-4 rounded-xl bg-[#22C55E] hover:bg-[#22C55E]/90 text-[#111318] font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-[#22C55E]/20"
              >
                {lang === 'fa' ? 'تایید و پذیرش پیکربندی' : 'Accept & Proceed Configuration'}
              </button>
            )}

            {acceptedStep3 && (
              <div className="mt-4 p-3 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/30 flex items-center space-x-2 rtl:space-x-reverse text-[#22C55E] text-xs font-mono">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{lang === 'fa' ? 'پیکربندی تایید شد. اکنون می‌توانید به مرحله ۴ (تولید کانفیگ) بروید.' : 'Configuration accepted. You can now proceed to Step 04.'}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 4: GENERATE XRAY CONFIG */}
      {step.id === 4 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-[#111318] border border-[#20242D] rounded-2xl p-5 shadow-lg space-y-4">
            <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              <Code className="w-4 h-4 text-[#F59E0B]" />
              {lang === 'fa' ? 'تنظیمات ژنراتور Xray Core' : 'Xray Core Generator Options'}
            </h3>

            {!acceptedStep3 && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono">
                {lang === 'fa' ? 'هشدار: مرحله ۳ (وارد کردن VPN) هنوز تایید نشده است.' : 'Warning: Step 03 (VPN Import) is not yet accepted.'}
              </div>
            )}

            <div className="space-y-3 text-xs font-mono">
              <div>
                <label className="block text-[#94A3B8] mb-1">{lang === 'fa' ? 'نسخه هدف Xray' : 'Target Xray Version'}</label>
                <input
                  type="text"
                  value={genOptions.targetVersion}
                  onChange={(e) => setGenOptions({ ...genOptions, targetVersion: e.target.value })}
                  className="w-full bg-[#20242D]/50 border border-[#20242D] rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#94A3B8] mb-1">SOCKS5 Port (Default: 1080)</label>
                  <input
                    type="number"
                    value={genOptions.socksPort}
                    onChange={(e) => setGenOptions({ ...genOptions, socksPort: Number(e.target.value) })}
                    className="w-full bg-[#20242D]/50 border border-[#20242D] rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-[#94A3B8] mb-1">HTTP Proxy Port (1081)</label>
                  <input
                    type="number"
                    value={genOptions.httpPort}
                    onChange={(e) => setGenOptions({ ...genOptions, httpPort: Number(e.target.value) })}
                    className="w-full bg-[#20242D]/50 border border-[#20242D] rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 rtl:space-x-reverse pt-1">
                <input
                  type="checkbox"
                  id="enableHttp"
                  checked={genOptions.enableHttpInbound}
                  onChange={(e) => setGenOptions({ ...genOptions, enableHttpInbound: e.target.checked })}
                  className="rounded bg-[#20242D] border-[#20242D]"
                />
                <label htmlFor="enableHttp" className="text-white">
                  {lang === 'fa' ? 'فعال‌سازی اینباند اختیاری HTTP (غیرفعال پیش‌فرض)' : 'Enable Optional HTTP Inbound (Disabled by default)'}
                </label>
              </div>

              <div className="flex items-center space-x-2 rtl:space-x-reverse pt-1">
                <input
                  type="checkbox"
                  id="iranDirect"
                  checked={genOptions.enableIranDirect}
                  onChange={(e) => setGenOptions({ ...genOptions, enableIranDirect: e.target.checked })}
                  className="rounded bg-[#20242D] border-[#20242D]"
                />
                <label htmlFor="iranDirect" className="text-white">
                  {lang === 'fa' ? 'مسیردهی مستقیم ترافیک ایران (Iran GeoIP Direct)' : 'Iran Direct Routing (GeoIP)'}
                </label>
              </div>
            </div>

            <button
              onClick={handleGenerateXray}
              disabled={!acceptedStep3}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#22D3EE] text-[#111318] font-bold text-xs uppercase tracking-wider hover:opacity-95 disabled:opacity-40 transition shadow-lg shadow-[#F59E0B]/20"
            >
              {lang === 'fa' ? 'تولید کانفیگ Xray Core' : 'Generate Xray Config.json'}
            </button>
          </div>

          <div className="bg-[#111318] border border-[#20242D] rounded-2xl p-5 flex flex-col justify-between shadow-lg">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-[#22D3EE]" />
                  {lang === 'fa' ? 'پیش‌نمایش امن JSON (پنهان‌سازی رمزها)' : 'Safe JSON Preview (Masked)'}
                </h3>
                {generationResult && generationResult.success && (
                  <div className="flex space-x-2 rtl:space-x-reverse">
                    <button
                      onClick={handleCopyJson}
                      className="p-2 rounded-lg bg-[#20242D] text-white hover:bg-[#20242D]/80 transition"
                      title="Copy JSON"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={handleDownloadJson}
                      className="p-2 rounded-lg bg-[#22D3EE]/20 text-[#22D3EE] hover:bg-[#22D3EE]/30 transition flex items-center gap-1 text-xs font-mono"
                      title="Download config.json"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>config.json</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="bg-[#0B0D10] border border-[#20242D] rounded-xl p-3 h-[220px] font-mono text-[11px] text-zinc-300 overflow-auto">
                {generationResult && generationResult.success ? (
                  <pre><code>{generationResult.safeJson}</code></pre>
                ) : (
                  <p className="text-[#94A3B8] text-center pt-16 font-mono text-xs">
                    {lang === 'fa' ? 'هنوز فایلی تولید نشده است.' : 'No configuration generated yet.'}
                  </p>
                )}
              </div>
            </div>

            {generationResult && generationResult.success && !acceptedStep4 && (
              <button
                onClick={handleAcceptStep4}
                className="mt-4 w-full py-2.5 px-4 rounded-xl bg-[#22C55E] hover:bg-[#22C55E]/90 text-[#111318] font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-[#22C55E]/20"
              >
                {lang === 'fa' ? 'تایید نهایی کانفیگ و ثبت در وضعیت' : 'Accept & Register Config State'}
              </button>
            )}

            {acceptedStep4 && (
              <div className="mt-4 p-3 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/30 flex items-center space-x-2 rtl:space-x-reverse text-[#22C55E] text-xs font-mono">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{lang === 'fa' ? 'کانفیگ با موفقیت تولید و تایید شد.' : 'Configuration successfully generated and accepted.'}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 5: SECURE CONFIG UPLOAD */}
      {step.id === 5 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-[#111318] border border-[#20242D] rounded-2xl p-5 shadow-lg space-y-4 font-mono text-xs">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Upload className="w-4 h-4 text-[#F59E0B]" />
              {lang === 'fa' ? 'تنظیمات آپلود امن کانفیگ به VPS (Step 05)' : 'Secure Config Upload Settings (Step 05)'}
            </h3>

            {!acceptedStep4 && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono">
                {lang === 'fa' ? 'هشدار: مرحله ۴ (تولید کانفیگ) هنوز تایید نشده است.' : 'Warning: Step 04 (Generate Config) is not yet accepted.'}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-[#94A3B8] mb-1">Staging Directory</label>
                <input
                  type="text"
                  value={uploadOpts.stagingDir}
                  onChange={(e) => setUploadOpts({ ...uploadOpts, stagingDir: e.target.value })}
                  className="w-full bg-[#20242D]/50 border border-[#20242D] rounded-xl px-3 py-2 text-white"
                />
              </div>

              {configJsonHash && (
                <div>
                  <label className="block text-[#94A3B8] mb-1">Operational Config SHA256</label>
                  <input
                    type="text"
                    readOnly
                    value={configJsonHash}
                    className="w-full bg-[#0B0D10] border border-[#20242D] rounded-xl px-3 py-1.5 text-zinc-300 font-mono text-[11px]"
                  />
                </div>
              )}
            </div>

            <div className="bg-[#111318] border border-[#20242D] rounded-2xl p-5 shadow-lg space-y-4">
              <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                <Laptop className="w-4 h-4 text-[#22D3EE]" />
                {lang === 'fa' ? 'دستورات آپلود امن config.json به VPS' : 'Generated Secure Upload Commands'}
              </h3>

              <div className="space-y-3 text-xs font-mono">
                <div>
                  <span className="text-[#94A3B8] block mb-1">1. Prepare Remote Staging Directory:</span>
                  <div className="bg-[#0B0D10] p-2 rounded-xl border border-[#20242D] text-zinc-300 overflow-x-auto select-text">
                    <code>{uploadCommands.prepare}</code>
                  </div>
                </div>

                <div>
                  <span className="text-[#94A3B8] block mb-1">2. Secure SCP Upload to config.json.pending:</span>
                  <div className="bg-[#0B0D10] p-2 rounded-xl border border-[#20242D] text-zinc-300 overflow-x-auto select-text">
                    <code>{uploadCommands.upload}</code>
                  </div>
                </div>

                <div>
                  <span className="text-[#94A3B8] block mb-1">3. Remote Checksum Verification:</span>
                  <div className="bg-[#0B0D10] p-2 rounded-xl border border-[#20242D] text-zinc-300 overflow-x-auto select-text">
                    <code>{uploadCommands.verify}</code>
                  </div>
                </div>

                <div>
                  <span className="text-[#94A3B8] block mb-1">4. Secure Permission (600) & Promotion to config.json:</span>
                  <div className="bg-[#0B0D10] p-2 rounded-xl border border-[#20242D] text-zinc-300 overflow-x-auto select-text">
                    <code>{uploadCommands.promote}</code>
                  </div>
                </div>
              </div>

              {!acceptedStep5 ? (
                <button
                  onClick={handleAcceptStep5}
                  disabled={!acceptedStep4}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#22C55E] hover:bg-[#22C55E]/90 disabled:opacity-40 text-[#111318] font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-[#22C55E]/20"
                >
                  {lang === 'fa' ? 'تایید آپلود و ثبت در وضعیت Step 05' : 'Confirm Upload & Register Step 05'}
                </button>
              ) : (
                <div className="p-3 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/30 flex items-center space-x-2 rtl:space-x-reverse text-[#22C55E] text-xs font-mono">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>{lang === 'fa' ? 'مرحله آپلود کانفیگ با موفقیت تایید شد.' : 'Step 05 config upload successfully confirmed.'}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* STEP 6: SAFE CONFIGURATION APPLICATION */}
      {step.id === 6 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-[#111318] border border-[#20242D] rounded-2xl p-5 shadow-lg space-y-4 font-mono text-xs">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#F59E0B]" />
              {lang === 'fa' ? 'اعمال امن کانفیگ Xray روی VPS (Step 06)' : 'Safe Configuration Application (Step 06)'}
            </h3>

            {!acceptedStep5 && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono">
                {lang === 'fa' ? 'هشدار: مرحله ۵ (آپلود کانفیگ) هنوز تایید نشده است.' : 'Warning: Step 05 (Config Upload) is not yet accepted.'}
              </div>
            )}

            <div className="space-y-3 text-xs font-mono">
              <div>
                <span className="text-[#94A3B8] block mb-1">1. Pre-flight Environment Inspection:</span>
                <div className="bg-[#0B0D10] p-2 rounded-xl border border-[#20242D] text-zinc-300 overflow-x-auto select-text">
                  <code>{applyCommands.preflight}</code>
                </div>
              </div>

              <div>
                <span className="text-[#94A3B8] block mb-1">2. Atomic Backup Generation:</span>
                <div className="bg-[#0B0D10] p-2 rounded-xl border border-[#20242D] text-zinc-300 overflow-x-auto select-text">
                  <code>{applyCommands.backup}</code>
                </div>
              </div>

              <div>
                <span className="text-[#94A3B8] block mb-1">3. Native Xray Configuration Test:</span>
                <div className="bg-[#0B0D10] p-2 rounded-xl border border-[#20242D] text-zinc-300 overflow-x-auto select-text">
                  <code>{applyCommands.nativeTest}</code>
                </div>
              </div>

              <div>
                <span className="text-[#94A3B8] block mb-1">4. Secure Atomic Replacement (Temp file + Rename):</span>
                <div className="bg-[#0B0D10] p-2 rounded-xl border border-[#20242D] text-zinc-300 overflow-x-auto select-text">
                  <code>{applyCommands.atomicReplace}</code>
                </div>
              </div>

              <div>
                <span className="text-[#94A3B8] block mb-1">5. Post-apply Verification:</span>
                <div className="bg-[#0B0D10] p-2 rounded-xl border border-[#20242D] text-zinc-300 overflow-x-auto select-text">
                  <code>{applyCommands.verify}</code>
                </div>
              </div>

              <div>
                <span className="text-[#94A3B8] block mb-1">6. Rollback Plan (If Needed):</span>
                <div className="bg-[#0B0D10] p-2 rounded-xl border border-[#20242D] text-zinc-300 overflow-x-auto select-text">
                  <code>{applyCommands.rollback}</code>
                </div>
              </div>
            </div>

            {!acceptedStep6 ? (
              <button
                onClick={handleAcceptStep6}
                disabled={!acceptedStep5}
                className="w-full py-2.5 px-4 rounded-xl bg-[#22C55E] hover:bg-[#22C55E]/90 disabled:opacity-40 text-[#111318] font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-[#22C55E]/20"
              >
                {lang === 'fa' ? 'تایید اعمال کانفیگ و ثبت در وضعیت Step 06' : 'Confirm Config Apply & Register Step 06'}
              </button>
            ) : (
              <div className="p-3 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/30 flex items-center space-x-2 rtl:space-x-reverse text-[#22C55E] text-xs font-mono">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{lang === 'fa' ? 'مرحله اعمال کانفیگ با موفقیت تایید شد.' : 'Step 06 configuration application successfully confirmed.'}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 7: START XRAY SERVICE */}
      {step.id === 7 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-[#111318] border border-[#20242D] rounded-2xl p-5 shadow-lg space-y-4 font-mono text-xs">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#F59E0B]" />
              {lang === 'fa' ? 'راه‌اندازی سرویس Xray روی VPS (Step 07)' : 'Xray Service Activation (Step 07)'}
            </h3>

            {!acceptedStep6 && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono">
                {lang === 'fa' ? 'هشدار: مرحله ۶ (اعمال کانفیگ) هنوز تایید نشده است.' : 'Warning: Step 06 (Config Apply) is not yet accepted.'}
              </div>
            )}

            <div className="space-y-3 text-xs font-mono">
              <div>
                <span className="text-[#94A3B8] block mb-1">1. Systemd Service Activation & Status:</span>
                <div className="bg-[#0B0D10] p-2 rounded-xl border border-[#20242D] text-zinc-300 overflow-x-auto select-text">
                  <code>{connectivityCommands.serviceControl}</code>
                </div>
              </div>

              <div>
                <span className="text-[#94A3B8] block mb-1">2. SOCKS5 Loopback Listener Verification (127.0.0.1:1080):</span>
                <div className="bg-[#0B0D10] p-2 rounded-xl border border-[#20242D] text-zinc-300 overflow-x-auto select-text">
                  <code>{connectivityCommands.listenerCheck}</code>
                </div>
              </div>
            </div>

            {!acceptedStep7 ? (
              <button
                onClick={handleAcceptStep7}
                disabled={!acceptedStep6}
                className="w-full py-2.5 px-4 rounded-xl bg-[#22C55E] hover:bg-[#22C55E]/90 disabled:opacity-40 text-[#111318] font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-[#22C55E]/20"
              >
                {lang === 'fa' ? 'تایید فعال‌سازی سرویس و ثبت Step 07' : 'Confirm Service Activation & Register Step 07'}
              </button>
            ) : (
              <div className="p-3 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/30 flex items-center space-x-2 rtl:space-x-reverse text-[#22C55E] text-xs font-mono">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{lang === 'fa' ? 'سرویس Xray با موفقیت فعال و تایید شد.' : 'Xray service successfully activated and verified.'}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 8: CONNECTIVITY TEST */}
      {step.id === 8 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-[#111318] border border-[#20242D] rounded-2xl p-5 shadow-lg space-y-4 font-mono text-xs">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#F59E0B]" />
              {lang === 'fa' ? 'تست اتصال اینترنت از طریق SOCKS5 (Step 08)' : 'SOCKS5 External Connectivity Test (Step 08)'}
            </h3>

            {!acceptedStep7 && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono">
                {lang === 'fa' ? 'هشدار: مرحله ۷ (راه‌اندازی سرویس) هنوز تایید نشده است.' : 'Warning: Step 07 (Service Activation) is not yet accepted.'}
              </div>
            )}

            <div className="space-y-3 text-xs font-mono">
              <div>
                <span className="text-[#94A3B8] block mb-1">1. TCP/TLS SOCKS5 Proxy Test (api.github.com):</span>
                <div className="bg-[#0B0D10] p-2 rounded-xl border border-[#20242D] text-zinc-300 overflow-x-auto select-text">
                  <code>{connectivityCommands.socksTest}</code>
                </div>
              </div>

              <div>
                <span className="text-[#94A3B8] block mb-1">2. Cloudflare Egress IP Trace (cdn-cgi/trace):</span>
                <div className="bg-[#0B0D10] p-2 rounded-xl border border-[#20242D] text-zinc-300 overflow-x-auto select-text">
                  <code>{connectivityCommands.cloudflareTrace}</code>
                </div>
              </div>

              <div>
                <span className="text-[#94A3B8] block mb-1">3. Diagnostics & Journal Inspector:</span>
                <div className="bg-[#0B0D10] p-2 rounded-xl border border-[#20242D] text-zinc-300 overflow-x-auto select-text">
                  <code>{connectivityCommands.diagnostics}</code>
                </div>
              </div>
            </div>

            {!acceptedStep8 ? (
              <button
                onClick={handleAcceptStep8}
                disabled={!acceptedStep7}
                className="w-full py-2.5 px-4 rounded-xl bg-[#22C55E] hover:bg-[#22C55E]/90 disabled:opacity-40 text-[#111318] font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-[#22C55E]/20"
              >
                {lang === 'fa' ? 'تایید تست اتصال و ثبت Step 08' : 'Confirm Connectivity & Register Step 08'}
              </button>
            ) : (
              <div className="p-3 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/30 flex items-center space-x-2 rtl:space-x-reverse text-[#22C55E] text-xs font-mono">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{lang === 'fa' ? 'تست اتصال با موفقیت تایید شد.' : 'Connectivity verification successfully confirmed.'}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 9: DOWNLOADER ROUTING */}
      {step.id === 9 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-[#111318] border border-[#20242D] rounded-2xl p-5 shadow-lg space-y-4 font-mono text-xs">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ArrowDownCircle className="w-4 h-4 text-[#F59E0B]" />
              {lang === 'fa' ? 'مسیردهی دانلودرها از طریق تونل (Step 09)' : 'Downloader Routing via Tunnel (Step 09)'}
            </h3>

            {!acceptedStep8 && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono">
                {lang === 'fa' ? 'هشدار: مرحله ۸ (تست اتصال) هنوز تایید نشده است.' : 'Warning: Step 08 (Connectivity Test) is not yet accepted.'}
              </div>
            )}

            <div className="space-y-3 text-xs font-mono">
              <div>
                <span className="text-[#94A3B8] block mb-1">1. Session-Scoped Proxy Environment Export:</span>
                <div className="bg-[#0B0D10] p-2 rounded-xl border border-[#20242D] text-zinc-300 overflow-x-auto select-text">
                  <code>{proxyCommands.envExport}</code>
                </div>
              </div>

              <div>
                <span className="text-[#94A3B8] block mb-1">2. Curl SOCKS5H Test Command:</span>
                <div className="bg-[#0B0D10] p-2 rounded-xl border border-[#20242D] text-zinc-300 overflow-x-auto select-text">
                  <code>{proxyCommands.curlCmd}</code>
                </div>
              </div>

              <div>
                <span className="text-[#94A3B8] block mb-1">3. Git Scoped Proxy Command:</span>
                <div className="bg-[#0B0D10] p-2 rounded-xl border border-[#20242D] text-zinc-300 overflow-x-auto select-text">
                  <code>{proxyCommands.gitCmd}</code>
                </div>
              </div>

              <div>
                <span className="text-[#94A3B8] block mb-1">4. Session Cleanup (Unset):</span>
                <div className="bg-[#0B0D10] p-2 rounded-xl border border-[#20242D] text-zinc-300 overflow-x-auto select-text">
                  <code>{proxyCommands.envCleanup}</code>
                </div>
              </div>
            </div>

            {!acceptedStep9 ? (
              <button
                onClick={handleAcceptStep9}
                disabled={!acceptedStep8}
                className="w-full py-2.5 px-4 rounded-xl bg-[#22C55E] hover:bg-[#22C55E]/90 disabled:opacity-40 text-[#111318] font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-[#22C55E]/20"
              >
                {lang === 'fa' ? 'تایید مسیردهی و ثبت Step 09' : 'Confirm Routing & Register Step 09'}
              </button>
            ) : (
              <div className="p-3 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/30 flex items-center space-x-2 rtl:space-x-reverse text-[#22C55E] text-xs font-mono">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{lang === 'fa' ? 'مرحله مسیردهی دانلودرها با موفقیت تایید شد.' : 'Downloader routing successfully confirmed.'}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 10: TARGET INSTALLER */}
      {step.id === 10 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-[#111318] border border-[#20242D] rounded-2xl p-5 shadow-lg space-y-4 font-mono text-xs">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Download className="w-4 h-4 text-[#F59E0B]" />
              {lang === 'fa' ? 'نصب‌کننده هدف و دانلود امن از طریق تونل (Step 10)' : 'Target File Installer & Secure Download (Step 10)'}
            </h3>

            {!acceptedStep9 && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono">
                {lang === 'fa' ? 'هشدار: مرحله ۹ (مسیردهی دانلودرها) هنوز تایید نشده است.' : 'Warning: Step 09 (Downloader Routing) is not yet accepted.'}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-[#94A3B8] mb-1">Target HTTPS URL</label>
                <input
                  type="text"
                  value={targetOpts.url}
                  onChange={(e) => setTargetOpts({ ...targetOpts, url: e.target.value })}
                  className="w-full bg-[#20242D]/50 border border-[#20242D] rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#94A3B8] mb-1">Filename</label>
                  <input
                    type="text"
                    value={targetOpts.filename}
                    onChange={(e) => setTargetOpts({ ...targetOpts, filename: e.target.value })}
                    className="w-full bg-[#20242D]/50 border border-[#20242D] rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-[#94A3B8] mb-1">Execution Mode</label>
                  <select
                    value={targetOpts.mode}
                    onChange={(e) => setTargetOpts({ ...targetOpts, mode: e.target.value as any })}
                    className="w-full bg-[#20242D]/50 border border-[#20242D] rounded-xl px-3 py-2 text-white"
                  >
                    <option value="download-only">Download Only</option>
                    <option value="download-review">Download & Review</option>
                    <option value="execute-confirm">Execute After Confirmation</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-3 text-xs font-mono pt-2">
              <div>
                <span className="text-[#94A3B8] block mb-1">1. Secure HTTPS Download Command (via SOCKS5H):</span>
                <div className="bg-[#0B0D10] p-2 rounded-xl border border-[#20242D] text-zinc-300 overflow-x-auto select-text">
                  <code>{installerCommands.downloadCmd}</code>
                </div>
              </div>

              <div>
                <span className="text-[#94A3B8] block mb-1">2. SHA256 Integrity Verification:</span>
                <div className="bg-[#0B0D10] p-2 rounded-xl border border-[#20242D] text-zinc-300 overflow-x-auto select-text">
                  <code>{installerCommands.integrityCmd}</code>
                </div>
              </div>

              <div>
                <span className="text-[#94A3B8] block mb-1">3. File Type & Architecture Inspection:</span>
                <div className="bg-[#0B0D10] p-2 rounded-xl border border-[#20242D] text-zinc-300 overflow-x-auto select-text">
                  <code>{installerCommands.inspectCmd}</code>
                </div>
              </div>

              <div>
                <span className="text-[#94A3B8] block mb-1">4. Controlled Execution Command:</span>
                <div className="bg-[#0B0D10] p-2 rounded-xl border border-[#20242D] text-zinc-300 overflow-x-auto select-text">
                  <code>{installerCommands.executeCmd}</code>
                </div>
              </div>
            </div>

            {!acceptedStep10 ? (
              <button
                onClick={() => {
                  setAcceptedStep10(true);
                  onUpdateRuntimeStatus(step.id, 'PASS');
                }}
                disabled={!acceptedStep9}
                className="w-full py-2.5 px-4 rounded-xl bg-[#22C55E] hover:bg-[#22C55E]/90 disabled:opacity-40 text-[#111318] font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-[#22C55E]/20"
              >
                {lang === 'fa' ? 'تایید نصب‌کننده هدف و ثبت Step 10' : 'Confirm Target Installer & Register Step 10'}
              </button>
            ) : (
              <div className="p-3 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/30 flex items-center space-x-2 rtl:space-x-reverse text-[#22C55E] text-xs font-mono">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{lang === 'fa' ? 'مرحله نصب‌کننده هدف با موفقیت تایید شد.' : 'Target installer successfully confirmed.'}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* For Steps other than 1-10 */}
      {step.id > 10 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-[#111318] border border-[#20242D] rounded-2xl p-5 flex flex-col justify-between shadow-lg">
            <div>
              <h3 className="text-sm font-bold text-white font-mono mb-3 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#F59E0B]" />
                {t.userInput} / {t.requirements}
              </h3>
              <p className="text-xs text-[#94A3B8] font-mono">
                {lang === 'fa' ? 'ورودی این مرحله در فازهای بعدی فعال خواهد شد.' : 'Inputs for this step will be enabled in upcoming phases.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Command Center Integration */}
      <CommandCenter lang={lang} stepId={step.id} isValidated={acceptedStep1 || acceptedStep2 || acceptedStep3 || acceptedStep4 || acceptedStep5 || acceptedStep6 || acceptedStep7 || acceptedStep8 || acceptedStep9 || acceptedStep10} />
    </main>
  );
}
