import type { StepStatus, RuntimeStatus } from '../types';

export interface WorkflowStepDefinition {
  id: number;
  key: string;
  order: number;
  titleFa: string;
  titleEn: string;
  descriptionFa: string;
  descriptionEn: string;
  prerequisites: number[]; // Step IDs required before this step
  implementationStatus: StepStatus;
  defaultRuntimeStatus: RuntimeStatus;
  requiredInputs: string[];
  expectedOutputs: string[];
}

export type { StepStatus, RuntimeStatus };
