import { STEP_REGISTRY } from './step-registry';
import { checkStepPrerequisites } from './dependency-graph';
import type { RuntimeStatus, StepStatus } from './types';

export interface WorkflowError {
  code: 'VALIDATION_ERROR' | 'MISSING_PREREQUISITE' | 'INVALID_TRANSITION' | 'MODULE_NOT_IMPLEMENTED' | 'PROCESSING_ERROR' | 'USER_CANCELLED';
  messageFa: string;
  messageEn: string;
  stepId: number;
  severity: 'WARNING' | 'ERROR' | 'FATAL';
  recoveryGuidanceFa: string;
  recoveryGuidanceEn: string;
}

export interface WorkflowEngineState {
  activeStepId: number;
  runtimeStatuses: Record<number, RuntimeStatus>;
  implementationStatuses: Record<number, StepStatus>;
  validationResults: Record<number, boolean>;
  generatedOutputs: Record<number, string>;
  errors: WorkflowError[];
}

export function createInitialWorkflowState(): WorkflowEngineState {
  const runtimeStatuses: Record<number, RuntimeStatus> = {};
  const implementationStatuses: Record<number, StepStatus> = {};
  const validationResults: Record<number, boolean> = {};
  const generatedOutputs: Record<number, string> = {};

  for (const step of STEP_REGISTRY) {
    runtimeStatuses[step.id] = step.defaultRuntimeStatus;
    implementationStatuses[step.id] = step.implementationStatus;
    validationResults[step.id] = false;
    generatedOutputs[step.id] = '';
  }

  // Set step 1 ready by default
  runtimeStatuses[1] = 'READY';

  return {
    activeStepId: 1,
    runtimeStatuses,
    implementationStatuses,
    validationResults,
    generatedOutputs,
    errors: []
  };
}

export function canNavigateToStep(
  targetStepId: number,
  state: WorkflowEngineState
): { allowed: boolean; error?: WorkflowError } {
  // Users can inspect any step, but blocked steps or unmet prerequisites give warnings/guidance
  const prereqCheck = checkStepPrerequisites(targetStepId, state.runtimeStatuses);
  if (!prereqCheck.canExecute) {
    return {
      allowed: true, // Allow navigation for inspection per user requirements
      error: {
        code: 'MISSING_PREREQUISITE',
        stepId: targetStepId,
        severity: 'WARNING',
        messageFa: prereqCheck.reasonFa || 'پیش‌نیازها رعایت نشده‌اند.',
        messageEn: prereqCheck.reasonEn || 'Prerequisites not met.',
        recoveryGuidanceFa: 'لطفاً ابتدا مراحل قبلی را با موفقیت کامل کنید.',
        recoveryGuidanceEn: 'Please complete prerequisite steps successfully first.'
      }
    };
  }

  return { allowed: true };
}
