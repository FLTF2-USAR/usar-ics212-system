/**
 * ICS-212 WF Vehicle Safety Inspection Form - PDF Generation Module
 * 
 * NEW APPROACH: Loads official ICS-212 template PDF from R2 and overlays user data at precise coordinates
 * Similar to JotForm's PDF form filling - ensures pixel-perfect alignment
 * 
 * Template Location: R2 bucket 'usar-forms', key 'templates/ics_212_template.pdf'
 */

import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import type { ICS212FormData, InspectionItem, DigitalSignature } from '../types/ics212';

// PDF Constants - Letter size 8.5" x 11" @ 72 DPI
const PAGE_SIZE = { width: 612, height: 792 };

// Font Sizes for overlaying text
const FONTS = {
  data: 10,       // User data fields
  small: 8,       // Secondary text
  checkbox: 8,    // Checkbox marks
};

// Colors
const COLORS = {
  black: rgb(0, 0, 0),
  blue: rgb(0, 0, 0.8),
};

/**
 * R2 Bucket Interface
 */
interface R2Bucket {
  get(key: string): Promise<R2ObjectBody | null>;
}

interface R2ObjectBody {
  arrayBuffer(): Promise<ArrayBuffer>;
}

/**
 * PDF Coordinate Mapping - Precise positions aligned to official form template
 * Y-coordinates are measured from BOTTOM of page, X from LEFT
 * ADJUSTED: Data fields positioned BELOW labels to sit inside form boxes
 */
const FIELD_COORDS = {
  // Top section - Row 1 (data goes in boxes below "Incident Name" and "Order No." labels)
  incidentName: { x: 60, y: 696 },   // Adjusted down from 710
  orderNo: { x: 455, y: 696 },       // Adjusted down from 710
  
  // Top section - Row 2 (below "Vehicle License No." and "Agency Reg/Unit" labels)
  vehicleLicenseNo: { x: 60, y: 674 },  // Adjusted down from 688
  agency: { x: 285, y: 674 },           // Adjusted down from 688
  regUnit: { x: 455, y: 674 },          // Adjusted down from 688
  
  // Top section - Row 3 (below "Type", "Odometer Reading", "Veh. ID No." labels)
  vehicleType: { x: 60, y: 652 },        // Adjusted down from 666
  odometerReading: { x: 285, y: 652 },   // Adjusted down from 666
  vehicleIdNo: { x: 455, y: 652 },       // Adjusted down from 666
  
  // Inspection items - Pass/Fail checkboxes (17 items)
  // Each item has: passX, failX, commentX, and y coordinate
  // Adjusted to align checkbox 'X' marks within checkbox boxes
  inspectionItems: [
    { passX: 345, failX: 395, commentX: 445, y: 621 },  // 1. Gauges and lights
    { passX: 345, failX: 395, commentX: 445, y: 605 },  // 2. Seat belts
    { passX: 345, failX: 395, commentX: 445, y: 589 },  // 3. Glass and mirrors
    { passX: 345, failX: 395, commentX: 445, y: 573 },  // 4. Wipers and horn
    { passX: 345, failX: 395, commentX: 445, y: 557 },  // 5. Engine compartment
    { passX: 345, failX: 395, commentX: 445, y: 541 },  // 6. Fuel System
    { passX: 345, failX: 395, commentX: 445, y: 525 },  // 7. Steering
    { passX: 345, failX: 395, commentX: 445, y: 509 },  // 8. Brakes
    { passX: 345, failX: 395, commentX: 445, y: 493 },  // 9. Drive line U-joints
    { passX: 345, failX: 395, commentX: 445, y: 477 },  // 10. Springs and shocks
    { passX: 345, failX: 395, commentX: 445, y: 461 },  // 11. Exhaust system
    { passX: 345, failX: 395, commentX: 445, y: 445 },  // 12. Frame
    { passX: 345, failX: 395, commentX: 445, y: 429 },  // 13. Tire and wheels
    { passX: 345, failX: 395, commentX: 445, y: 413 },  // 14. Coupling devices / Emergency exit
    { passX: 345, failX: 395, commentX: 445, y: 397 },  // 15. Pump operation
    { passX: 345, failX: 395, commentX: 445, y: 381 },  // 16. Damage on incident
    { passX: 345, failX: 395, commentX: 445, y: 365 },  // 17. Other
  ],

  // Additional Comments section (starts below "Additional Comments:" label)
  additionalComments: { x: 60, y: 328, maxWidth: 500, lineHeight: 12 },

  // Bottom decision boxes - Adjusted for proper alignment within form boxes
  holdForRepairs: {
    checkbox: { x: 60, y: 237 },          // Adjusted for checkbox alignment
    date: { x: 95, y: 218 },              // Date field below checkbox
    time: { x: 185, y: 218 },             // Time field 
    inspectorName: { x: 95, y: 198 },     // Name (Print) field
    inspectorSignature: { x: 95, y: 168, width: 150, height: 25 },  // Signature box
  },

  release: {
    checkbox: { x: 345, y: 237 },         // Adjusted for checkbox alignment
    date: { x: 380, y: 218 },             // Date field below checkbox
    time: { x: 470, y: 218 },             // Time field
    operatorName: { x: 380, y: 198 },     // Name (Print) field
    operatorSignature: { x: 380, y: 168, width: 150, height: 25 },  // Signature box
  },
};

/**
 * PDF Generation Options
 */
export interface PDFGenerationOptions {
  formData: ICS212FormData;
  includeSignatures: boolean;
  watermark?: string;
  r2Bucket: R2Bucket;  // R2 bucket for fetching template
}

/**
 * PDF Generation Result
 */
export interface PDFGenerationResult {
  buffer: ArrayBuffer;
  filename: string;
  size: number;
  generatedAt: string;
}

/**
 * Main PDF Generation Function - Loads template and overlays user data
 */
export async function generateICS212PDF(
  options: PDFGenerationOptions
): Promise<PDFGenerationResult> {
  const startTime = Date.now();
  
  try {
    console.log('Fetching ICS-212 template from R2...');
    
    // Fetch template PDF from R2
    const templateObject = await options.r2Bucket.get('templates/ics_212_template.pdf');
    if (!templateObject) {
      throw new Error('Template PDF not found in R2 bucket');
    }
    
    const templateBytes = await templateObject.arrayBuffer();
    console.log(`Template loaded: ${(templateBytes.byteLength / 1024).toFixed(2)}KB`);
    
    // Load the template PDF
    const pdfDoc = await PDFDocument.load(templateBytes);
    const pages = pdfDoc.getPages();
    const page = pages[0];
    const { width, height } = page.getSize();
    
    console.log(`PDF dimensions: ${width}x${height}`);
    
    // Embed fonts
    const normalFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    // Overlay user data onto template
    await overlayFormData(page, normalFont, boldFont, options.formData, pdfDoc);
    
    // Save modified PDF
    const pdfBytes = await pdfDoc.save();
    const buffer = pdfBytes.buffer as ArrayBuffer;
    
    const generationTime = Date.now() - startTime;
    console.log(`PDF generated in ${generationTime}ms, size: ${(buffer.byteLength / 1024).toFixed(2)}KB`);
    
    return {
      buffer,
      filename: `ICS212-${options.formData.vehicleIdNo}-${Date.now()}.pdf`,
      size: buffer.byteLength,
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('PDF generation failed:', error);
    throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Overlay all form data onto the template PDF at precise coordinates
 */
async function overlayFormData(
  page: any,
  normalFont: any,
  boldFont: any,
  formData: ICS212FormData,
  pdfDoc: any
): Promise<void> {
  // Top section fields
  overlayTextField(page, normalFont, FIELD_COORDS.incidentName, formData.incidentName);
  overlayTextField(page, normalFont, FIELD_COORDS.orderNo, formData.orderNo);
  overlayTextField(page, normalFont, FIELD_COORDS.vehicleLicenseNo, formData.vehicleLicenseNo);
  
  // Split agency/reg unit
  const agencyParts = formData.agencyRegUnit?.split('/') || ['', ''];
  overlayTextField(page, normalFont, FIELD_COORDS.agency, agencyParts[0]);
  overlayTextField(page, normalFont, FIELD_COORDS.regUnit, agencyParts[1]);
  
  overlayTextField(page, normalFont, FIELD_COORDS.vehicleType, formData.vehicleType);
  overlayTextField(page, normalFont, FIELD_COORDS.odometerReading, formData.odometerReading?.toString());
  overlayTextField(page, normalFont, FIELD_COORDS.vehicleIdNo, formData.vehicleIdNo);
  
  // Inspection items - checkboxes and comments
  overlayInspectionItems(page, normalFont, boldFont, formData.inspectionItems);
  
  // Additional comments
  overlayComments(page, normalFont, formData.additionalComments);
  
  // Bottom decision boxes
  await overlayDecisionBoxes(page, normalFont, boldFont, formData, pdfDoc);
}

/**
 * Overlay a text field at specified coordinates
 */
function overlayTextField(
  page: any,
  font: any,
  coords: { x: number; y: number },
  value: string | undefined
): void {
  if (!value) return;
  
  page.drawText(value, {
    x: coords.x,
    y: coords.y,
    size: FONTS.data,
    font: font,
    color: COLORS.black,
  });
}

/**
 * Overlay inspection items with Pass/Fail checkboxes and comments
 */
function overlayInspectionItems(
  page: any,
  normalFont: any,
  boldFont: any,
  items: InspectionItem[]
): void {
  for (let i = 0; i < Math.min(items.length, 17); i++) {
    const item = items[i];
    const coords = FIELD_COORDS.inspectionItems[i];
    
    if (!item || !coords) continue;
    
    // Draw Pass checkbox 'X'
    if (item.status === 'pass') {
      page.drawText('X', {
        x: coords.passX,
        y: coords.y,
        size: FONTS.checkbox,
        font: boldFont,
        color: COLORS.black,
      });
    }
    
    // Draw Fail checkbox 'X'
    if (item.status === 'fail') {
      page.drawText('X', {
        x: coords.failX,
        y: coords.y,
        size: FONTS.checkbox,
        font: boldFont,
        color: COLORS.black,
      });
    }
    
    // Draw comments if present
    if (item.comments) {
      const commentText = item.comments.substring(0, 20); // Limit length to fit
      page.drawText(commentText, {
        x: coords.commentX,
        y: coords.y,
        size: FONTS.small,
        font: normalFont,
        color: COLORS.black,
      });
    }
  }
}

/**
 * Overlay additional comments with line wrapping
 */
function overlayComments(
  page: any,
  font: any,
  comments: string | undefined
): void {
  if (!comments) return;
  
  const coords = FIELD_COORDS.additionalComments;
  const lines = comments.split('\n');
  let y = coords.y;
  
  for (const line of lines.slice(0, 5)) {  // Max 5 lines
    if (line.trim()) {
      page.drawText(line.substring(0, 80), {  // Max 80 chars per line
        x: coords.x,
        y: y,
        size: FONTS.small,
        font: font,
        color: COLORS.black,
      });
    }
    y -= coords.lineHeight;
  }
}

/**
 * Overlay decision boxes (HOLD FOR REPAIRS / RELEASE) with checkboxes and signatures
 */
async function overlayDecisionBoxes(
  page: any,
  normalFont: any,
  boldFont: any,
  formData: ICS212FormData,
  pdfDoc: any
): Promise<void> {
  // HOLD FOR REPAIRS checkbox
  if (formData.releaseStatus === 'hold') {
    page.drawText('X', {
      x: FIELD_COORDS.holdForRepairs.checkbox.x,
      y: FIELD_COORDS.holdForRepairs.checkbox.y,
      size: FONTS.data,
      font: boldFont,
      color: COLORS.black,
    });
  }
  
  // HOLD FOR REPAIRS - Date, Time, Name
  if (formData.inspectorDate) {
    page.drawText(new Date(formData.inspectorDate).toLocaleDateString(), {
      x: FIELD_COORDS.holdForRepairs.date.x,
      y: FIELD_COORDS.holdForRepairs.date.y,
      size: FONTS.small,
      font: normalFont,
      color: COLORS.black,
    });
  }
  
  if (formData.inspectorTime) {
    page.drawText(formData.inspectorTime, {
      x: FIELD_COORDS.holdForRepairs.time.x,
      y: FIELD_COORDS.holdForRepairs.time.y,
      size: FONTS.small,
      font: normalFont,
      color: COLORS.black,
    });
  }
  
  if (formData.inspectorNamePrint) {
    page.drawText(formData.inspectorNamePrint, {
      x: FIELD_COORDS.holdForRepairs.inspectorName.x,
      y: FIELD_COORDS.holdForRepairs.inspectorName.y,
      size: FONTS.small,
      font: normalFont,
      color: COLORS.black,
    });
  }
  
  // Inspector signature image
  if (formData.inspectorSignature?.imageData) {
    await drawSignature(
      page,
      pdfDoc,
      formData.inspectorSignature,
      FIELD_COORDS.holdForRepairs.inspectorSignature
    );
  }
  
  // RELEASE checkbox
  if (formData.releaseStatus === 'release') {
    page.drawText('X', {
      x: FIELD_COORDS.release.checkbox.x,
      y: FIELD_COORDS.release.checkbox.y,
      size: FONTS.data,
      font: boldFont,
      color: COLORS.black,
    });
  }
  
  // RELEASE - Date, Time, Name
  if (formData.operatorDate) {
    page.drawText(new Date(formData.operatorDate).toLocaleDateString(), {
      x: FIELD_COORDS.release.date.x,
      y: FIELD_COORDS.release.date.y,
      size: FONTS.small,
      font: normalFont,
      color: COLORS.black,
    });
  }
  
  if (formData.operatorTime) {
    page.drawText(formData.operatorTime, {
      x: FIELD_COORDS.release.time.x,
      y: FIELD_COORDS.release.time.y,
      size: FONTS.small,
      font: normalFont,
      color: COLORS.black,
    });
  }
  
  if (formData.operatorNamePrint) {
    page.drawText(formData.operatorNamePrint, {
      x: FIELD_COORDS.release.operatorName.x,
      y: FIELD_COORDS.release.operatorName.y,
      size: FONTS.small,
      font: normalFont,
      color: COLORS.black,
    });
  }
  
  // Operator signature image
  if (formData.operatorSignature?.imageData) {
    await drawSignature(
      page,
      pdfDoc,
      formData.operatorSignature,
      FIELD_COORDS.release.operatorSignature
    );
  }
}

/**
 * Draw signature image at specified coordinates
 */
async function drawSignature(
  page: any,
  pdfDoc: any,
  signature: DigitalSignature,
  coords: { x: number; y: number; width: number; height: number }
): Promise<void> {
  try {
    const base64Data = signature.imageData.replace(/^data:image\/png;base64,/, '');
    const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    const signatureImage = await pdfDoc.embedPng(imageBytes);
    
    page.drawImage(signatureImage, {
      x: coords.x,
      y: coords.y,
      width: coords.width,
      height: coords.height,
    });
  } catch (error) {
    console.error('Failed to embed signature:', error);
    // Skip signature if embedding fails
  }
}
