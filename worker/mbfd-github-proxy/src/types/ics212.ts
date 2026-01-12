/**
 * ICS-212 Type Definitions for Worker
 * 
 * These are local copies of types from the frontend to avoid
 * cross-directory imports that break in the worker runtime.
 */

// ICS-212 Inspection Item
export interface InspectionItem {
  itemNumber: number;
  description: string;
  status: 'pass' | 'fail' | 'n/a';
  comments?: string;
  isSafetyItem: boolean;
  reference?: string;
}

// Digital Signature
export interface DigitalSignature {
  imageData: string; // Base64 PNG
  signedAt: string; // ISO timestamp
  signedBy: string; // Person name
  ipAddress?: string;
  deviceId?: string;
}

// ICS-212 Form Data
export interface ICS212FormData {
  // Meta
  formId?: string;
  status?: 'draft' | 'inspector_signed' | 'submitted' | 'approved';
  
  // Header Fields (Section 1)
  incidentName: string;
  orderNo?: string;
  vehicleLicenseNo: string;
  agencyRegUnit: string;
  vehicleType: string;
  odometerReading: number;
  vehicleIdNo: string;
  selectedVehicleId?: string; // Track when a vehicle from Airtable is selected
  
  // Inspection Items (Section 2)
  inspectionItems: InspectionItem[];
  
  // Additional Comments (Section 3)
  additionalComments?: string;
  
  // Release Decision (Section 4)
  releaseStatus: 'hold' | 'release';
  
  // Inspector Signature (Section 5.1)
  inspectorDate: string; // ISO date
  inspectorTime: string; // HH:MM
  inspectorNamePrint: string;
  inspectorSignature?: DigitalSignature;
  
  // Operator Signature (Section 5.2)
  operatorDate?: string;
  operatorTime?: string;
  operatorNamePrint?: string;
  operatorSignature?: DigitalSignature;
  
  // System Metadata
  submittedAt?: string;
  createdBy?: string;
  organizationId?: string;
  version?: number;
}
