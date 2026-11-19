import type { Language } from './types';

export const translations: Record<Language, {
  brandTitle: string;
  brandSubtitle: string;
  workflowProgress: string;
  sessionStatus: string;
  language: string;
  help: string;
  settings: string;
  resetSession: string;
  previousStep: string;
  nextStep: string;
  commandCenter: string;
  tabs: {
    powershell: string;
    bash: string;
    vps: string;
    json: string;
  };
  copyCode: string;
  copied: string;
  stepsHeader: string;
  step: string;
  status: string;
  requirements: string;
  userInput: string;
  configOptions: string;
  validation: string;
  processingResult: string;
  generatedOutput: string;
  errorMessages: string;
  notImplementedNotice: string;
  systemInfo: {
    cpu: string;
    os: string;
    xray: string;
    protocol: string;
    config: string;
    state: string;
  };
  confirmReset: string;
  footerNote: string;
}> = {
  fa: {
    brandTitle: 'TUNNEL FETCH',
    brandSubtitle: 'ابزار پیکربندی و راه‌اندازی تونل Xray روی VPS',
    workflowProgress: 'پیشرفت جریان کاری',
    sessionStatus: 'وضعیت نشست',
    language: 'زبان',
    help: 'راهنما',
    settings: 'تنظیمات',
    resetSession: 'بازنشانی نشست',
    previousStep: 'مرحله قبل',
    nextStep: 'مرحله بعد',
    commandCenter: 'مرکز فرماندهی',
    tabs: {
      powershell: 'پاورشل ویندوز',
      bash: 'ترمینال لینوکس / مک',
      vps: 'ترمینال VPS ایران',
      json: 'تنظیمات JSON'
    },
    copyCode: 'کپی دستور',
    copied: 'کپی شد!',
    stepsHeader: 'مراحل ۱۰گانه تونل فچ',
    step: 'مرحله',
    status: 'وضعیت',
    requirements: 'پیش‌نیازها',
    userInput: 'ورودی کاربر',
    configOptions: 'گزینه‌های پیکربندی',
    validation: 'اعتبارسنجی',
    processingResult: 'نتیجه پردازش',
    generatedOutput: 'خروجی تولید شده',
    errorMessages: 'پیام‌های خطا',
    notImplementedNotice: 'این مرحله در فاز فعلی به صورت ساختاری آماده شده و در فازهای بعدی پیاده‌سازی موتور اصلی فعال خواهد شد.',
    systemInfo: {
      cpu: 'معماری پردازنده',
      os: 'توزیع لینوکس',
      xray: 'نسخه Xray',
      protocol: 'پروتکل VPN',
      config: 'وضعیت کانفیگ',
      state: 'حالت نشست'
    },
    confirmReset: 'آیا از بازنشانی کامل نشست و پاکسازی داده‌های موقت اطمینان دارید؟',
    footerNote: 'Tunnel Fetch — ابزار حرفه‌ای دور زدن محدودیت‌های شبکه'
  },
  en: {
    brandTitle: 'TUNNEL FETCH',
    brandSubtitle: 'Xray Tunnel Configuration & Deployment Assistant',
    workflowProgress: 'Workflow Progress',
    sessionStatus: 'Session Status',
    language: 'Language',
    help: 'Help',
    settings: 'Settings',
    resetSession: 'Reset Session',
    previousStep: 'Previous Step',
    nextStep: 'Next Step',
    commandCenter: 'Command Center',
    tabs: {
      powershell: 'Windows PowerShell',
      bash: 'Linux / Mac Terminal',
      vps: 'Iran VPS Terminal',
      json: 'JSON Configuration'
    },
    copyCode: 'Copy Command',
    copied: 'Copied!',
    stepsHeader: 'Tunnel Fetch 10-Step Pipeline',
    step: 'Step',
    status: 'Status',
    requirements: 'Requirements',
    userInput: 'User Input',
    configOptions: 'Configuration Options',
    validation: 'Validation',
    processingResult: 'Processing Result',
    generatedOutput: 'Generated Output',
    errorMessages: 'Error Messages',
    notImplementedNotice: 'This step is structurally prepared in the current phase. Core engine execution will be implemented in upcoming phases.',
    systemInfo: {
      cpu: 'CPU Architecture',
      os: 'Linux Distribution',
      xray: 'Xray Version',
      protocol: 'VPN Protocol',
      config: 'Config Status',
      state: 'Session State'
    },
    confirmReset: 'Are you sure you want to reset the session and clear temporary data?',
    footerNote: 'Tunnel Fetch — Professional Network Limitation Bypass Assistant'
  }
};
