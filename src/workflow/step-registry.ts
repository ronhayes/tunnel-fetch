import type { WorkflowStepDefinition } from './types';

export const STEP_REGISTRY: WorkflowStepDefinition[] = [
  {
    id: 1,
    key: 'STEP_01_OFFLINE_BUNDLE',
    order: 1,
    titleFa: 'بسته آفلاین',
    titleEn: 'Offline Bundle',
    descriptionFa: 'آماده‌سازی بسته‌های وابستگی و ابزارهای موردنیاز برای محیط‌های ایزوله و محدود.',
    descriptionEn: 'Prepare dependency bundles and required tools for restricted and isolated environments.',
    prerequisites: [],
    implementationStatus: 'IMPLEMENTED',
    defaultRuntimeStatus: 'READY',
    requiredInputs: ['Target Architecture (amd64/arm64)', 'Node/Python offline binaries'],
    expectedOutputs: ['bundle-archive.tar.gz', 'checksums.sha256']
  },
  {
    id: 2,
    key: 'STEP_02_XRAY_INSTALL',
    order: 2,
    titleFa: 'نصب Xray',
    titleEn: 'Install Xray',
    descriptionFa: 'تولید دستورات امن انتقال پکیج به VPS ایران و کنترل فرآیند نصب آفلاین.',
    descriptionEn: 'Generate secure package transfer commands to Iran VPS and control offline installation.',
    prerequisites: [1],
    implementationStatus: 'IMPLEMENTED',
    defaultRuntimeStatus: 'BLOCKED',
    requiredInputs: ['Accepted Step 01 Bundle', 'VPS SSH IP, Port & Credentials'],
    expectedOutputs: ['Transfer verification evidence', 'Installed binary & systemd unit']
  },
  {
    id: 3,
    key: 'STEP_03_VPN_IMPORT',
    order: 3,
    titleFa: 'وارد کردن VPN',
    titleEn: 'Import VPN',
    descriptionFa: 'وارد کردن امن رشته‌های اتصال VPN یا لینک‌های اشتراک (VLESS/VMess/Trojan).',
    descriptionEn: 'Import VPN connection strings or subscription links securely (VLESS/VMess/Trojan).',
    prerequisites: [2],
    implementationStatus: 'IMPLEMENTED',
    defaultRuntimeStatus: 'BLOCKED',
    requiredInputs: ['VPN Connection String / Subscription URL'],
    expectedOutputs: ['Parsed Protocol Parameters', 'Validated Server Handshake']
  },
  {
    id: 4,
    key: 'STEP_04_XRAY_CONFIG',
    order: 4,
    titleFa: 'تولید کانفیگ Xray',
    titleEn: 'Generate Xray Config',
    descriptionFa: 'تولید خودکار فایل تنظیمات سفارشی Xray متناسب با شرایط شبکه محدود.',
    descriptionEn: 'Automatically generate customized Xray configuration files tailored for restricted networks.',
    prerequisites: [3],
    implementationStatus: 'IMPLEMENTED',
    defaultRuntimeStatus: 'BLOCKED',
    requiredInputs: ['Accepted VPN profile from Step 03', 'Inbound/Outbound routing options'],
    expectedOutputs: ['config.json (Xray format)']
  },
  {
    id: 5,
    key: 'STEP_05_CONFIG_UPLOAD',
    order: 5,
    titleFa: 'آپلود کانفیگ',
    titleEn: 'Upload Config',
    descriptionFa: 'انتقال امن فایل تنظیمات config.json به دایرکتوری staging روی VPS بدون اعمال فعال.',
    descriptionEn: 'Securely transfer config.json to VPS staging directory without activating or restarting Xray.',
    prerequisites: [2, 4],
    implementationStatus: 'IMPLEMENTED',
    defaultRuntimeStatus: 'BLOCKED',
    requiredInputs: ['Accepted Step 02 installation', 'Accepted Step 04 configuration'],
    expectedOutputs: ['Staged config.json on remote VPS']
  },
  {
    id: 6,
    key: 'STEP_06_CONFIG_APPLY',
    order: 6,
    titleFa: 'اعمال پیکربندی',
    titleEn: 'Apply Configuration',
    descriptionFa: 'بررسی پیش‌ازپرواز، پشتیبان‌گیری اتمیک، تست بومی Xray و جایگزینی امن کانفیگ بدون ریستارت.',
    descriptionEn: 'Pre-flight inspection, atomic backup, native Xray test, and secure replacement without restarting.',
    prerequisites: [2, 4, 5],
    implementationStatus: 'IMPLEMENTED',
    defaultRuntimeStatus: 'BLOCKED',
    requiredInputs: ['Staged config.json from Step 05', 'Installed Xray binary from Step 02'],
    expectedOutputs: ['Active verified config.json', 'Timestamped backup', 'Rollback plan']
  },
  {
    id: 7,
    key: 'STEP_07_XRAY_SERVICE',
    order: 7,
    titleFa: 'راه‌اندازی سرویس Xray',
    titleEn: 'Start Xray Service',
    descriptionFa: 'اجرا و کنترل سرویس Xray به عنوان Systemd Service روی VPS همراه با اعتبارسنجی پورت‌ها.',
    descriptionEn: 'Start and control Xray service as a Systemd Service on VPS with port listener validation.',
    prerequisites: [2, 6],
    implementationStatus: 'IMPLEMENTED',
    defaultRuntimeStatus: 'BLOCKED',
    requiredInputs: ['Accepted Step 02 installation', 'Accepted Step 06 configuration apply'],
    expectedOutputs: ['Active systemd xray service', 'Loopback 127.0.0.1:1080 listener']
  },
  {
    id: 8,
    key: 'STEP_08_CONNECTIVITY',
    order: 8,
    titleFa: 'تست اتصال',
    titleEn: 'Connectivity Test',
    descriptionFa: 'بررسی صحت اتصال اینترنت از طریق پروکسی SOCKS5 محلی با استفاده از socks5h و curl.',
    descriptionEn: 'Verify external internet connectivity through local SOCKS5 proxy using socks5h and curl.',
    prerequisites: [7],
    implementationStatus: 'IMPLEMENTED',
    defaultRuntimeStatus: 'BLOCKED',
    requiredInputs: ['Running Xray service from Step 07'],
    expectedOutputs: ['GitHub API TLS handshake response', 'Cloudflare egress IP trace']
  },
  {
    id: 9,
    key: 'STEP_09_DOWNLOADER_ROUTING',
    order: 9,
    titleFa: 'مسیردهی دانلودرها',
    titleEn: 'Downloader Routing',
    descriptionFa: 'تولید دستورات مسیردهی موقت پکیج‌منجرها و ابزارها (curl, git, apt, docker) از طریق پروکسی SOCKS5H.',
    descriptionEn: 'Generate temporary proxy routing commands for package managers and tools via SOCKS5H proxy.',
    prerequisites: [8],
    implementationStatus: 'IMPLEMENTED',
    defaultRuntimeStatus: 'BLOCKED',
    requiredInputs: ['Verified connectivity from Step 08'],
    expectedOutputs: ['Session-scoped proxy environment variables and tool commands']
  },
  {
    id: 10,
    key: 'STEP_10_TARGET_INSTALLER',
    order: 10,
    titleFa: 'نصب‌کننده هدف',
    titleEn: 'Target Installer',
    descriptionFa: 'دانلود امن فایل‌های هدف از طریق تونل با اعتبارسنجی SHA256 و حالت‌های اجرایی کنترل‌شده.',
    descriptionEn: 'Secure target file downloads through tunnel with SHA256 integrity and controlled execution modes.',
    prerequisites: [9],
    implementationStatus: 'IMPLEMENTED',
    defaultRuntimeStatus: 'BLOCKED',
    requiredInputs: ['Verified SOCKS5 routing from Step 09', 'HTTPS URL and expected SHA256'],
    expectedOutputs: ['Verified downloaded file with explicit execution approval']
  }
];

export function getStepById(id: number): WorkflowStepDefinition | undefined {
  return STEP_REGISTRY.find((s) => s.id === id);
}
