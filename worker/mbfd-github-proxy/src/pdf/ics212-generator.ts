/**
 * ICS-212 WF Vehicle Safety Inspection Form - PDF Generation Module
 * 
 * DYNAMIC APPROACH: Loads field coordinates from D1 database (pdf_field_configs table)
 * Falls back to hardcoded coordinates if database is unavailable
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
 * D1 Database Interface
 */
interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

interface D1PreparedStatement {
  bind(...values: any[]): D1PreparedStatement;
  all(): Promise<D1Result>;
}

interface D1Result {
  results: any[];
  success: boolean;
  error?: string;
}

/**
 * Field Configuration from D1
 */
interface FieldConfig {
  field_key: string;
  x_pct: number;
  y_pct: number;
  width_pct: number;
  height_pct: number;
  field_type?: string;
  font_size?: number;
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
 * FALLBACK: Hardcoded coordinates (used if D1 is unavailable)
 * These are the original grid-verified coordinates
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
 * Fetch dynamic field configurations from D1 database
 */
async function fetchFieldConfigs(db: D1Database, formType: string = 'ics212'): Promise<Map<string, FieldConfig>> {
  try {
    console.log(`Fetching field configs from D1 for form type: ${formType}`);
    
    const result = await db
      .prepare('SELECT * FROM pdf_field_configs WHERE form_type = ?')
      .bind(formType)
      .all();

    if (!result.success || !result.results || result.results.length === 0) {
      console.warn('No field configs found in D1, using fallback coordinates');
      return new Map();
    }

    const configMap = new Map<string, FieldConfig>();
    for (const row of result.results) {
      configMap.set(row.field_key, {
        field_key: row.field_key,
        x_pct: row.x_pct,
        y_pct: row.y_pct,
        width_pct: row.width_pct,
        height_pct: row.height_pct,
        field_type: row.field_type,
        font_size: row.font_size,
      });
    }

    console.log(`Loaded ${configMap.size} field configs from D1`);
    return configMap;
  } catch (error) {
    console.error('Error fetching field configs from D1:', error);
    return new Map();
  }
}

/**
 * Convert percentage-based coordinates to PDF points
 * Handles the Y-axis flip (web coords are top-down, PDF coords are bottom-up)
 */
function percentToPdfCoords(
  x_pct: number,
  y_pct: number,
  width_pct: number = 0,
  height_pct: number = 0
): { x: number; y: number; width: number; height: number } {
  const x = x_pct * PAGE_SIZE.width;
  const width = width_pct * PAGE_SIZE.width;
  const height = height_pct * PAGE_SIZE.height;
  
  // Y-axis flip: PDF origin is bottom-left, web origin is top-left
  // Formula: pdf_y = PAGE_HEIGHT - (y_pct * PAGE_HEIGHT) - height
  const y = PAGE_SIZE.height - (y_pct * PAGE_SIZE.height) - height;
  
  return { x, y, width, height };
}

/**
 * Get field coordinates - tries D1 first, falls back to hardcoded
 */
function getFieldCoords(
  fieldKey: string,
  configMap: Map<string, FieldConfig>,
  fallback: any
): { x: number; y: number } {
  const config = configMap.get(fieldKey);
  if (config) {
    const coords = percentToPdfCoords(config.x_pct, config.y_pct, config.width_pct, config.height_pct);
    return { x: coords.x, y: coords.y };
  }
  
  // Fallback to hardcoded coordinates
  return fallback || { x: 0, y: 0 };
}

/**
 * PDF Generation Options
 */
export interface PDFGenerationOptions {
  formData: ICS212FormData;
  includeSignatures: boolean;
  watermark?: string;
  r2Bucket: R2Bucket;  // R2 bucket for fetching template
  db: D1Database;      // D1 database for fetching field configs
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
    
    // Fetch dynamic field configurations from D1
    const fieldConfigMap = await fetchFieldConfigs(options.db, 'ics212');
    console.log(`Using ${fieldConfigMap.size > 0 ? 'dynamic' : 'fallback'} field coordinates`);
    
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
    
    // Overlay user data onto template with dynamic coordinates
    await overlayFormData(page, normalFont, boldFont, options.formData, pdfDoc, fieldConfigMap);
    
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
  pdfDoc: any,
  fieldConfigMap: Map<string, FieldConfig>
): Promise<void> {
  // Draw coordinate grid first (if enabled)
  const { width, height } = page.getSize();
  drawCoordinateGrid(page, width, height);
  
  // Top section fields - use dynamic coords or fallback
  overlayTextField(page, normalFont, getFieldCoords('incidentName', fieldConfigMap, FIELD_COORDS.incidentName), formData.incidentName);
  overlayTextField(page, normalFont, getFieldCoords('orderNo', fieldConfigMap, FIELD_COORDS.orderNo), formData.orderNo);
  overlayTextField(page, normalFont, getFieldCoords('vehicleLicenseNo', fieldConfigMap, FIELD_COORDS.vehicleLicenseNo), formData.vehicleLicenseNo);

  // Split agency/reg unit
  const agencyParts = formData.agencyRegUnit?.split('/') || ['', ''];
  overlayTextField(page, normalFont, getFieldCoords('agency', fieldConfigMap, FIELD_COORDS.agency), agencyParts[0]);

  // Initialize the try...catch block with 'undefined' for 'agencyParts[1]'
  let regUnitText: string | undefined = 'undefined';
  try {
    regUnitText = agencyParts[1];
  } catch (e) {
    console.log(`Error getting agencyParts[1]: ${e}`);
  }
  overlayTextField(page, normalFont, getFieldCoords('regUnit', fieldConfigMap, FIELD_COORDS.regUnit), regUnitText);

  
  overlayTextField(page, normalFont, getFieldCoords('vehicleType', fieldConfigMap, FIELD_COORDS.vehicleType), formData.vehicleType);
  
  // Odometer & Vehicle ID - Use smaller font (8pt instead of 10pt)
  overlayTextFieldSmall(page, normalFont, getFieldCoords('odometerReading', fieldConfigMap, FIELD_COORDS.odometerReading), formData.odometerReading?.toString());
  overlayTextFieldSmall(page, normalFont, getFieldCoords('vehicleIdNo', fieldConfigMap, FIELD_COORDS.vehicleIdNo), formData.vehicleIdNo);
  
  // Inspection items - checkboxes and comments with dynamic coords
  overlayInspectionItems(page, normalFont, boldFont, formData.inspectionItems, fieldConfigMap);
  
  // Additional comments
  overlayComments(page, normalFont, formData.additionalComments, fieldConfigMap);
  
  // Bottom decision boxes with dynamic coords
  await overlayDecisionBoxes(page, normalFont, boldFont, formData, pdfDoc, fieldConfigMap);
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
  items: InspectionItem[],
  fieldConfigMap: Map<string, FieldConfig>
): void {
  for (let i = 0; i < Math.min(items.length, 17); i++) {
    const item = items[i];
    
    // Get dynamic coordinates or fallback
    const passConfig = fieldConfigMap.get(`inspection_${i}_pass`);
    const failConfig = fieldConfigMap.get(`inspection_${i}_fail`);
    const commentConfig = fieldConfigMap.get(`inspection_${i}_comment`);
    
    const fallbackCoords = FIELD_COORDS.inspectionItems[i] || { passX: 600, failX: 395, commentX: 445, y: 275 - (i * 17) };
    
    const passCoords = passConfig
      ? percentToPdfCoords(passConfig.x_pct, passConfig.y_pct, passConfig.width_pct, passConfig.height_pct)
      : { x: fallbackCoords.passX, y: fallbackCoords.y, width: 0, height: 0 };
    
    const failCoords = failConfig
      ? percentToPdfCoords(failConfig.x_pct, failConfig.y_pct, failConfig.width_pct, failConfig.height_pct)
      : { x: fallbackCoords.failX, y: fallbackCoords.y, width: 0, height: 0 };
    
    const commentCoords = commentConfig
      ? percentToPdfCoords(commentConfig.x_pct, commentConfig.y_pct, commentConfig.width_pct, commentConfig.height_pct)
      : { x: fallbackCoords.commentX, y: fallbackCoords.y, width: 0, height: 0 };
    
    if (!item) continue;
    
    // Draw Pass checkbox 'X'
    if (item.status === 'pass') {
      drawDebugBox(page, passCoords.x, passCoords.y, 10, 10);
      
      page.drawText('X', {
        x: passCoords.x,
        y: passCoords.y,
        size: FONTS.checkbox,
        font: boldFont,
        color: COLORS.black,
      });
    }
    
    // Draw Fail checkbox 'X'
    if (item.status === 'fail') {
      drawDebugBox(page, failCoords.x, failCoords.y, 10, 10);
      
      page.drawText('X', {
        x: failCoords.x,
        y: failCoords.y,
        size: FONTS.checkbox,
        font: boldFont,
        color: COLORS.black,
      });
    }
    
    // Draw comments if present
    if (item.comments) {
      const commentText = item.comments.substring(0, 20); // Limit length to fit
      page.drawText(commentText, {
        x: commentCoords.x,
        y: commentCoords.y,
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
  comments: string | undefined,
  fieldConfigMap: Map<string, FieldConfig>
): void {
  if (!comments) return;
  
  // Get dynamic coordinates or fallback
  const config = fieldConfigMap.get('additionalComments');
  const coords = config
    ? percentToPdfCoords(config.x_pct, config.y_pct, config.width_pct, config.height_pct)
    : FIELD_COORDS.additionalComments;
  
  const lines = comments.split('\n');
  let y = coords.y;
  const lineHeight = ('lineHeight' in coords ? coords.lineHeight : 12) || 12;
  
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
    y -= lineHeight;
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
  pdfDoc: any,
  fieldConfigMap: Map<string, FieldConfig>
): Promise<void> {
  // Get dynamic coordinates or fallback for HOLD FOR REPAIRS
  const holdCheckboxCoords = getFieldCoords('hold_checkbox', fieldConfigMap, FIELD_COORDS.holdForRepairs.checkbox);
  const inspectorDateCoords = getFieldCoords('inspector_date', fieldConfigMap, FIELD_COORDS.holdForRepairs.date);
  const inspectorTimeCoords = getFieldCoords('inspector_time', fieldConfigMap, FIELD_COORDS.holdForRepairs.time);
  const inspectorNameCoords = getFieldCoords('inspector_name', fieldConfigMap, FIELD_COORDS.holdForRepairs.inspectorName);
  const inspectorSigConfig = fieldConfigMap.get('inspector_signature');
  const inspectorSigCoords = inspectorSigConfig
    ? percentToPdfCoords(inspectorSigConfig.x_pct, inspectorSigConfig.y_pct, inspectorSigConfig.width_pct, inspectorSigConfig.height_pct)
    : FIELD_COORDS.holdForRepairs.inspectorSignature;
  
  // Get dynamic coordinates or fallback for RELEASE
  const releaseCheckboxCoords = getFieldCoords('release_checkbox', fieldConfigMap, FIELD_COORDS.releaseForUse.checkbox);
  const operatorDateCoords = getFieldCoords('operator_date', fieldConfigMap, FIELD_COORDS.releaseForUse.date);
  const operatorTimeCoords = getFieldCoords('operator_time', fieldConfigMap, FIELD_COORDS.releaseForUse.time);
  const operatorNameCoords = getFieldCoords('operator_name', fieldConfigMap, FIELD_COORDS.releaseForUse.operatorName);
  const operatorSigConfig = fieldConfigMap.get('operator_signature');
  const operatorSigCoords = operatorSigConfig
    ? percentToPdfCoords(operatorSigConfig.x_pct, operatorSigConfig.y_pct, operatorSigConfig.width_pct, operatorSigConfig.height_pct)
    : FIELD_COORDS.releaseForUse.operatorSignature;
  
  // HOLD FOR REPAIRS checkbox
  if (formData.releaseStatus === 'hold') {
    page.drawText('X', {
      x: holdCheckboxCoords.x,
      y: holdCheckboxCoords.y,
      size: FONTS.data,
      font: boldFont,
      color: COLORS.black,
    });
  }
  
  // HOLD FOR REPAIRS - Date, Time, Name
  if (formData.inspectorDate) {
    page.drawText(new Date(formData.inspectorDate).toLocaleDateString(), {
      x: inspectorDateCoords.x,
      y: inspectorDateCoords.y,
      size: FONTS.small,
      font: normalFont,
      color: COLORS.black,
    });
  }
  
  if (formData.inspectorTime) {
    page.drawText(formData.inspectorTime, {
      x: inspectorTimeCoords.x,
      y: inspectorTimeCoords.y,
      size: FONTS.small,
      font: normalFont,
      color: COLORS.black,
    });
  }
  
  if (formData.inspectorNamePrint) {
    page.drawText(formData.inspectorNamePrint, {
      x: inspectorNameCoords.x,
      y: inspectorNameCoords.y,
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
      inspectorSigCoords
    );
  }
  
  // RELEASE checkbox
  if (formData.releaseStatus === 'release') {
    page.drawText('X', {
      x: releaseCheckboxCoords.x,
      y: releaseCheckboxCoords.y,
      size: FONTS.data,
      font: boldFont,
      color: COLORS.black,
    });
  }
  
  // RELEASE - Date, Time, Name
  if (formData.operatorDate) {
    page.drawText(new Date(formData.operatorDate).toLocaleDateString(), {
      x: operatorDateCoords.x,
      y: operatorDateCoords.y,
      size: FONTS.small,
      font: normalFont,
      color: COLORS.black,
    });
  }
  
  if (formData.operatorTime) {
    page.drawText(formData.operatorTime, {
      x: operatorTimeCoords.x,
      y: operatorTimeCoords.y,
      size: FONTS.small,
      font: normalFont,
      color: COLORS.black,
    });
  }
  
  if (formData.operatorNamePrint) {
    page.drawText(formData.operatorNamePrint, {
      x: operatorNameCoords.x,
      y: operatorNameCoords.y,
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
      operatorSigCoords
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
