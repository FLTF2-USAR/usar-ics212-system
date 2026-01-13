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
  debug: 6,       // Debug labels
};

// Colors
const COLORS = {
  black: rgb(0, 0, 0),
  blue: rgb(0, 0, 0.8),
  debugRed: rgb(1, 0, 0),
  gridGray: rgb(0.8, 0.8, 0.8),
  gridLabelGray: rgb(0.5, 0.5, 0.5),
};

// Debug mode - set to true to show coordinate boxes and grid
const DEBUG_MODE = true;  // ENABLED for alignment verification
const GRID_MODE = true;   // ENABLED to show coordinate grid

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
 * Draw a coordinate grid overlay for precise alignment debugging
 * Grid lines every 50 points with labeled coordinates
 */
function drawCoordinateGrid(page: any, width: number, height: number): void {
  if (!GRID_MODE) return;
  
  const normalFont = page.doc.embedStandardFont ? StandardFonts.Helvetica : null;
  
  // Draw vertical lines every 50 points
  for (let x = 0; x < width; x += 50) {
    page.drawLine({
      start: { x, y: 0 },
      end: { x, y: height },
      color: COLORS.gridGray,
      thickness: 0.5,
    });
    
    // Label at bottom
    page.drawText(`${x}`, {
      x: x + 2,
      y: 10,
      size: 6,
      color: COLORS.gridLabelGray,
    });
  }
  
  // Draw horizontal lines every 50 points
  for (let y = 0; y < height; y += 50) {
    page.drawLine({
      start: { x: 0, y },
      end: { x: width, y },
      color: COLORS.gridGray,
      thickness: 0.5,
    });
    
    // Label at left
    page.drawText(`${y}`, {
      x: 5,
      y: y + 2,
      size: 6,
      color: COLORS.gridLabelGray,
    });
  }
}

/**
 * PDF Coordinate Mapping - Precise positions aligned to official form template
 * Y-coordinates are measured from BOTTOM of page (PDF standard), X from LEFT
 * To move DOWN: DECREASE Y value
 * To move UP: INCREASE Y value
 * To move RIGHT: INCREASE X value
 * To move LEFT: DECREASE X value
 * 
 * ITERATION 9: EXACT GRID-LINE COORDINATES FROM USER TESTING
 * User verified each field against grid overlay and provided exact coordinates:
 * - Vehicle Type: X=650, Y=100
 * - Odometer: X=650, Y=350
 * - Vehicle ID: X=650, Y=500
 * - Reg/Unit: X=675, Y=500 (between 650-700 on grid)
 * - First checkbox (Pass): X=600, Y=250-300 range
 * - Inspector Date: X=175, Y=100
 * - Inspector Time: X=175, Y=250
 * - Operator Date: X=175, Y=350
 * - Operator Time: X=175, Y=500
 * - Inspector Name: X=145, Y=200
 * - Operator Name: X=145, Y=450
 * - Inspector Signature: X=125, Y=200
 * - Operator Signature: X=125, Y=450
 */
const FIELD_COORDS = {
  // Header section - Perfect (no changes)
  incidentName: { x: 60, y: 696 },
  orderNo: { x: 455, y: 696 },
  
  // Top section - Row 2 (below "Vehicle License No." and "Agency Reg/Unit" labels)
  vehicleLicenseNo: { x: 60, y: 674 },
  agency: { x: 285, y: 674 },  // Keep this field
  
  // ITERATION 9: Reg/Unit - EXACT grid coordinate
  regUnit: { x: 675, y: 500 },  // Between 650-700 on grid, Y=500 from bottom
  
  // ITERATION 9: Vehicle Type - EXACT grid coordinate  
  vehicleType: { x: 650, y: 100 },  // X=650 line from left, Y=100 from bottom
  
  // ITERATION 9: Odometer & Vehicle ID - EXACT grid coordinates
  odometerReading: { x: 650, y: 350 },  // X=650 line, Y=350 from bottom
  vehicleIdNo: { x: 650, y: 500 },      // X=650 line, Y=500 from bottom
  
  // ITERATION 9: Checkboxes - First checkbox at EXACT grid intersection
  // User spec: "FIRST X...EXACTLY AT THE 600 LINE FROM THE LEFT AND BETWEEN THE 250 AND 300 LINE FROM THE BOTTOM"
  inspectionItems: [
    { passX: 600, failX: 395, commentX: 445, y: 275 },  // First: X=600, Y=275 (midpoint 250-300)
    { passX: 600, failX: 395, commentX: 445, y: 258 },
    { passX: 600, failX: 395, commentX: 445, y: 241 },
    { passX: 600, failX: 395, commentX: 445, y: 224 },
    { passX: 600, failX: 395, commentX: 445, y: 207 },
    { passX: 600, failX: 395, commentX: 445, y: 190 },
    { passX: 600, failX: 395, commentX: 445, y: 173 },
    { passX: 600, failX: 395, commentX: 445, y: 156 },
    { passX: 600, failX: 395, commentX: 445, y: 139 },
    { passX: 600, failX: 395, commentX: 445, y: 122 },
    { passX: 600, failX: 395, commentX: 445, y: 105 },
    { passX: 600, failX: 395, commentX: 445, y: 88 },
    { passX: 600, failX: 395, commentX: 445, y: 71 },
    { passX: 600, failX: 395, commentX: 445, y: 54 },
    { passX: 600, failX: 395, commentX: 445, y: 37 },
    { passX: 600, failX: 395, commentX: 445, y: 20 },
    { passX: 600, failX: 395, commentX: 445, y: 3 },
  ],

  // Additional Comments section (starts below "Additional Comments:" label)
  additionalComments: { x: 60, y: 328, maxWidth: 500, lineHeight: 12 },

  // ITERATION 9: Footer - EXACT grid coordinates from user testing
  holdForRepairs: {
    checkbox: { x: 60, y: 135 },        // Keep existing checkbox position
    date: { x: 175, y: 100 },           // X=175 line, Y=100 from bottom
    time: { x: 175, y: 250 },           // X=175 line, Y=250 from bottom
    inspectorName: { x: 145, y: 200 },  // X=145 line, Y=200 from bottom
    inspectorSignature: { x: 125, y: 200, width: 150, height: 25 },  // X=125, Y=200
  },

  releaseForUse: {
    checkbox: { x: 305, y: 135 },       // Keep existing checkbox position
    date: { x: 175, y: 350 },           // X=175 line, Y=350 from bottom
    time: { x: 175, y: 500 },           // X=175 line, Y=500 from bottom
    operatorName: { x: 145, y: 450 },   // X=145 line, Y=450 from bottom
    operatorSignature: { x: 125, y: 450, width: 150, height: 25 },  // X=125, Y=450
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
 * Debug helper: Draw a red bounding box around target coordinates
 */
function drawDebugBox(
  page: any,
  x: number,
  y: number,
  width: number = 50,
  height: number = 10,
  label?: string
): void {
  if (!DEBUG_MODE) return;
  
  page.drawRectangle({
    x,
    y,
    width,
    height,
    borderColor: COLORS.debugRed,
    borderWidth: 1,
  });
  
  if (label) {
    page.drawText(label, {
      x: x + 2,
      y: y - 8,
      size: FONTS.debug,
      color: COLORS.debugRed,
    });
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
  // Draw coordinate grid first (if enabled)
  const { width, height } = page.getSize();
  drawCoordinateGrid(page, width, height);
  
  // Top section fields
  overlayTextField(page, normalFont, FIELD_COORDS.incidentName, formData.incidentName);
  overlayTextField(page, normalFont, FIELD_COORDS.orderNo, formData.orderNo);
  overlayTextField(page, normalFont, FIELD_COORDS.vehicleLicenseNo, formData.vehicleLicenseNo);

  // Split agency/reg unit
  const agencyParts = formData.agencyRegUnit?.split('/') || ['', ''];
  overlayTextField(page, normalFont, FIELD_COORDS.agency, agencyParts[0]);

  // Initialize the try...catch block with 'undefined' for 'agencyParts[1]'
  let regUnitText: string | undefined = 'undefined';
  try {
    regUnitText = agencyParts[1];
  } catch (e) {
    console.log(`Error getting agencyParts[1]: ${e}`);
  }
  overlayTextField(page, normalFont, FIELD_COORDS.regUnit, regUnitText);

  
  overlayTextField(page, normalFont, FIELD_COORDS.vehicleType, formData.vehicleType);
  
  // Odometer & Vehicle ID - Use smaller font (8pt instead of 10pt)
  overlayTextFieldSmall(page, normalFont, FIELD_COORDS.odometerReading, formData.odometerReading?.toString());
  overlayTextFieldSmall(page, normalFont, FIELD_COORDS.vehicleIdNo, formData.vehicleIdNo);
  
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
  
  drawDebugBox(page, coords.x, coords.y, 100, 12);
  
  page.drawText(value, {
    x: coords.x,
    y: coords.y,
    size: FONTS.data,
    font: font,
    color: COLORS.black,
  });
}

/**
 * Overlay a text field with smaller font (for header Vehicle ID & Odometer)
 */
function overlayTextFieldSmall(
  page: any,
  font: any,
  coords: { x: number; y: number },
  value: string | undefined
): void {
  if (!value) return;
  
  drawDebugBox(page, coords.x, coords.y, 80, 10);
  
  page.drawText(value, {
    x: coords.x,
    y: coords.y,
    size: FONTS.small,  // 8pt font
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
      drawDebugBox(page, coords.passX, coords.y, 10, 10);
      
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
      drawDebugBox(page, coords.failX, coords.y, 10, 10);
      
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
      x: FIELD_COORDS.releaseForUse.checkbox.x,
      y: FIELD_COORDS.releaseForUse.checkbox.y,
      size: FONTS.data,
      font: boldFont,
      color: COLORS.black,
    });
  }
  
  // RELEASE - Date, Time, Name
  if (formData.operatorDate) {
    page.drawText(new Date(formData.operatorDate).toLocaleDateString(), {
      x: FIELD_COORDS.releaseForUse.date.x,
      y: FIELD_COORDS.releaseForUse.date.y,
      size: FONTS.small,
      font: normalFont,
      color: COLORS.black,
    });
  }
  
  if (formData.operatorTime) {
    page.drawText(formData.operatorTime, {
      x: FIELD_COORDS.releaseForUse.time.x,
      y: FIELD_COORDS.releaseForUse.time.y,
      size: FONTS.small,
      font: normalFont,
      color: COLORS.black,
    });
  }
  
  if (formData.operatorNamePrint) {
    page.drawText(formData.operatorNamePrint, {
      x: FIELD_COORDS.releaseForUse.operatorName.x,
      y: FIELD_COORDS.releaseForUse.operatorName.y,
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
      FIELD_COORDS.releaseForUse.operatorSignature
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
