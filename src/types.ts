// Core Types
export type Rank = 'Firefighter' | 'DE' | 'Lieutenant' | 'Captain' | 'Chief';
export type Apparatus = 'Rescue 1';
export type ItemStatus = 'present' | 'missing' | 'damaged';
export type Shift = 'A' | 'B' | 'C';

// User Interface
export interface User {
  name: string;
  rank: Rank;
  apparatus: Apparatus;
  shift?: Shift;
  unitNumber?: string;
}

// Checklist Item
export interface ChecklistItem {
  id: string;
  name: string;
  compartmentId: string;
  status: ItemStatus;
  notes?: string;
  photoUrl?: string;
}

// Compartment
export interface Compartment {
  id: string;
  title: string;
  items: string[];
}

// Officer Checklist Item
export interface OfficerChecklistItem {
  id: string;
  name: string;
  checked?: boolean;
  value?: string;
}

// Daily Schedule Task
export interface DailyScheduleTask {
  day: string;
  tasks: string[];
}

// Front Cab Checks
export interface FrontCabChecks {
  lights: boolean;
  siren: boolean;
  mobileRadio: boolean;
  airHorn: boolean;
  noSmokingSign: boolean;
  fuelLevel?: number;
  defLevel?: number;
}

// Defect Interface (for admin dashboard) - matches github.ts usage
export interface Defect {
  issueNumber: number;
  apparatus: string; // Use string instead of Apparatus since parsed from existing issues
  compartment: string;
  item: string;
  status: 'missing' | 'damaged';
  notes: string;
  reportedBy: string;
  reportedAt: string;
  updatedAt: string;
  resolved: boolean;
}

// Complete Checklist Data
export interface ChecklistData {
  title: string;
  compartments: Compartment[];
  officerChecklist?: OfficerChecklistItem[];
  dailySchedule?: DailyScheduleTask[];
  frontCabChecks?: FrontCabChecks;
}

// Inspection Submission
export interface InspectionSubmission {
  user: User;
  apparatus: string;
  date: string;
  shift?: Shift;
  unitNumber?: string;
  items: ChecklistItem[];
  defects: Array<{
    compartment: string;
    item: string;
    status: 'missing' | 'damaged';
    notes: string;
    photoUrl?: string;
  }>;
  officerChecklist?: OfficerChecklistItem[];
  frontCabChecks?: FrontCabChecks;
  signatures?: {
    inspector: string;
    lieutenant?: string;
  };
}

// GitHub Issue
export interface GitHubIssue {
  number: number;
  title: string;
  body: string;
  state: 'open' | 'closed';
  labels: string[];
  created_at: string;
  updated_at: string;
  user?: {
    login: string;
  };
}
