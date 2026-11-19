export type Language = 'fa' | 'en';
export type Direction = 'rtl' | 'ltr';

export type StepStatus =
  | 'NOT_STARTED'
  | 'ACTIVE'
  | 'READY'
  | 'RUNNING'
  | 'PASS'
  | 'FAIL'
  | 'BLOCKED'
  | 'NOT_IMPLEMENTED'
  | 'IMPLEMENTED';

export type RuntimeStatus =
  | 'NOT_STARTED'
  | 'BLOCKED'
  | 'READY'
  | 'RUNNING'
  | 'WAITING_USER'
  | 'PASS'
  | 'FAIL';

export interface WorkflowStep {
  id: number;
  key: string;
  titleFa: string;
  titleEn: string;
  descriptionFa: string;
  descriptionEn: string;
  status: StepStatus;
}

export interface SessionState {
  cpuArchitecture: string;
  linuxDistribution: string;
  xrayVersion: string;
  vpnProtocol: string;
  configStatus: string;
  currentStep: number;
  sessionState: 'IDLE' | 'CONFIGURING' | 'READY' | 'DEPLOYING' | 'TESTING';
}

export interface CommandEnvironment {
  id: 'powershell' | 'bash' | 'vps' | 'json';
  titleFa: string;
  titleEn: string;
}
