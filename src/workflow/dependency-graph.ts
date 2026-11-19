import { STEP_REGISTRY, getStepById } from './step-registry';
import type { RuntimeStatus } from './types';

export interface DependencyCheckResult {
  canExecute: boolean;
  missingPrerequisites: number[];
  reasonFa?: string;
  reasonEn?: string;
}

export function checkStepPrerequisites(
  stepId: number,
  stepStatuses: Record<number, RuntimeStatus>
): DependencyCheckResult {
  const step = getStepById(stepId);
  if (!step) {
    return { canExecute: false, missingPrerequisites: [], reasonFa: 'مرحله نامعتبر است.', reasonEn: 'Invalid step.' };
  }

  const missing: number[] = [];
  for (const prereqId of step.prerequisites) {
    const status = stepStatuses[prereqId];
    if (status !== 'PASS') {
      missing.push(prereqId);
    }
  }

  if (missing.length > 0) {
    const missingNames = missing.map((id) => {
      const s = getSTEP_NAME_BY_ID(id);
      return s;
    }).join(', ');

    return {
      canExecute: false,
      missingPrerequisites: missing,
      reasonFa: `پیش‌نیازهای این مرحله (${missingNames}) هنوز کامل نشده یا تایید نشده‌اند.`,
      reasonEn: `Prerequisites (${missingNames}) are not yet completed or verified.`
    };
  }

  return { canExecute: true, missingPrerequisites: [] };
}

function getSTEP_NAME_BY_ID(id: number): string {
  const step = getStepById(id);
  return step ? `Step 0${step.id}` : `#${id}`;
}

export function getAllDependenciesGraph() {
  const graph: Record<number, number[]> = {};
  for (const step of STEP_REGISTRY) {
    graph[step.id] = [...step.prerequisites];
  }
  return graph;
}
