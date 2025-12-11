export type Rank = 'Firefighter' | 'DE' | 'Lieutenant' | 'Captain' | 'Chief';

export type Apparatus = 
  | 'Engine 1' | 'Engine 2' | 'Engine 3' | 'Engine 4'
  | 'Rescue 1' | 'Rescue 2' | 'Rescue 3' | 'Rescue 4'
  | 'Rescue 11' | 'Rescue 22' | 'Rescue 44';

export type Shift = 'A' | 'B' | 'C';

export type ItemStatus = 'present' | 'missing' | 'damaged';

export interface User {
  name: string;
  rank: Rank;
  apparatus: Apparatus;
  shift: Shift;
  unitNumber: string;
}

export interface ChecklistItem {
  id: string;
  name: string;
  compartmentId: string;
  status: ItemStatus;
  notes?: string;
}

export interface Compartment {
  id: string;
  title: string;
  items: string[];
}

export interface ChecklistData {
  title: string;
  compartments: Compartment[];
}

export interface Defect {
  issueNumber: number;
  apparatus: Apparatus;
  compartment: string;
  item: string;
  status: 'missing' | 'damaged';
  notes: string;
  reportedBy: string;
  reportedAt: string;
  updatedAt: string;
  resolved: boolean;
}

export interface InspectionSubmission {
  user: User;
  apparatus: Apparatus;
  date: string;
  items: ChecklistItem[];
  defects: Array<{
    compartment: string;
    item: string;
    status: 'missing' | 'damaged';
    notes: string;
  }>;
}

export interface GitHubIssue {
  number: number;
  title: string;
  body: string;
  labels: Array<{ name: string }>;
  state: 'open' | 'closed';
  created_at: string;
  updated_at: string;
  user: {
    login: string;
  };
}