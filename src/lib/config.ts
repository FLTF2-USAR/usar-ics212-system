import type { Apparatus } from '../types';

/**
 * List of all apparatus in the MBFD fleet
 * Update this list when new apparatus are added to the system
 */
export const APPARATUS_LIST: Apparatus[] = [
  'Rescue 1',
  'Rescue 2', 
  'Rescue 3',
  'Rescue 11',
  'Engine 1'
];

/**
 * GitHub issue label constants
 * These labels are used to categorize and filter issues
 */
export const LABELS = {
  DEFECT: 'Defect',
  LOG: 'Log',
  DAMAGED: 'Damaged',
  RESOLVED: 'Resolved',
} as const;

/**
 * Regular expression for parsing defect issue titles
 * Format: [Apparatus] Compartment: Item - Status
 */
export const DEFECT_TITLE_REGEX = /\[(.+)\]\s+(.+):\s+(.+?)\s+-\s+(Missing|Damaged)/;