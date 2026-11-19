import { STEP_REGISTRY } from './workflow/step-registry';
import type { WorkflowStep } from './types';

// Adapter to convert STEP_REGISTRY into WorkflowStep interface expected by existing components
export const WORKFLOW_STEPS: WorkflowStep[] = STEP_REGISTRY.map((s) => ({
  id: s.id,
  key: s.key,
  titleFa: s.titleFa,
  titleEn: s.titleEn,
  descriptionFa: s.descriptionFa,
  descriptionEn: s.descriptionEn,
  status: s.implementationStatus === 'IMPLEMENTED' ? (s.id === 1 ? 'READY' : 'NOT_STARTED') : 'NOT_IMPLEMENTED'
}));
