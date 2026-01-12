/**
 * ICS-212 WF Vehicle Safety Inspection Form - PDF Generation Module
 *
 * Generates EXACT REPLICA of official ICS-212 Wildfire edition government form
 * - Table-based layout matching official NFES 001251 specification
 * - Light blue cell backgrounds for data entry fields
 * - Embedded digital signatures
 * - Government-compliant formatting for submission
 *
 * Target: 100% visual fidelity to official form
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { ICS212FormData, InspectionItem, DigitalSignature } from '../types/ics212';

// PDF Constants - Official ICS-212 WF Layout Specifications
const PAGE_SIZE = { width: 612, height: 792 }; // 8.5" x 11" @ 72 DPI
const MARGINS = { top: 50, bottom: 36, left: 50, right: 50 }; 
const CONTENT_WIDTH = PAGE_SIZE.width - MARGINS.left - MARGINS.right; // 512pt

// Font Sizes - Matching Official Form
const FONTS = {
  title: 14,
  subtitle: 10,
  label: 9,
  data: 9,
  small: 8,
  tiny: 7,
};

// Colors - Matching Official Form
const COLORS = {
  black: rgb(0, 0, 0),
  darkGray: rgb(0.3, 0.3, 0.3),
  lightBlue: rgb(0.85, 0.88, 0.95), // Light blue cell background
  white: rgb(1, 1, 1),
  borderGray: rgb(0, 0, 0),
};

/**
 * PDF Generation Options
 */
export interface PDFGenerationOptions {
  formData: ICS212FormData;
  includeSignatures: boolean;
  watermark?: string;
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
 * Main PDF Generation Function
 */
export async function generateICS212PDF(
  options: PDFGenerationOptions
): Promise<PDFGenerationResult> {
  const startTime = Date.now();
  
  try {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([PAGE_SIZE.width, PAGE_SIZE.height]);
    
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const normalFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    
    let currentY = PAGE_SIZE.height - MARGINS.top;
    
    // Render form sections matching official layout
    currentY = renderTitle(page, normalFont, boldFont, currentY);
    currentY = renderTopTable(page, normalFont, boldFont, options.formData, currentY);
    currentY = renderInspectionTable(page, normalFont, boldFont, options.formData, currentY);
    currentY = renderAdditionalComments(page, normalFont, boldFont, options.formData, currentY);
    currentY = await renderBottomDecisionBoxes(page, normalFont, boldFont, options.formData, pdfDoc, currentY);
    renderFooter(page, normalFont);
    
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
 * Render Title - "Incident Demobilization Vehicle Safety Inspection (ICS 212 WF)"
 */
function renderTitle(
  page: any,
  normalFont: any,
  boldFont: any,
  startY: number
): number {
  const { width } = page.getSize();
  let y = startY;
  
  // Main title - centered and bold
  const titleText = 'Incident Demobilization Vehicle Safety Inspection (ICS 212 WF)';
  const titleWidth = boldFont.widthOfTextAtSize(titleText, FONTS.title);
  
  page.drawText(titleText, {
    x: (width - titleWidth) / 2,
    y: y,
    size: FONTS.title,
    font: boldFont,
    color: COLORS.black,
  });
  
  y -= 18;
  
  // Subtitle - centered
  const subtitleText = 'Vehicle Operator: Complete items above double lines prior to inspection';
  const subtitleWidth = normalFont.widthOfTextAtSize(subtitleText, FONTS.subtitle);
  
  page.drawText(subtitleText, {
    x: (width - subtitleWidth) / 2,
    y: y,
    size: FONTS.subtitle,
    font: boldFont,
    color: COLORS.black,
  });
  
  return y - 15;
}

/**
 * Render Top Table - 3 rows with incident and vehicle info
 */
function renderTopTable(
  page: any,
  normalFont: any,
  boldFont: any,
  formData: ICS212FormData,
  startY: number
): number {
  let y = startY;
  
  const tableWidth = CONTENT_WIDTH;
  const cellHeight = 20;
  
  // Calculate column widths
  const col1Width = tableWidth * 0.45;
  const col2Width = tableWidth * 0.25;
  const col3Width = tableWidth * 0.30;
  
  // Row 1: Incident Name (spans 2 cols) | Order No.
  drawTableCell(page, normalFont, boldFont, MARGINS.left, y, col1Width + col2Width, cellHeight, 
    'Incident Name', formData.incidentName || '', true);
  drawTableCell(page, normalFont, boldFont, MARGINS.left + col1Width + col2Width, y, col3Width, cellHeight,
    'Order No.', formData.orderNo || '', true);
  
  y -= cellHeight;
  
  // Row 2: Vehicle License No. | Agency | Reg/Unit
  drawTableCell(page, normalFont, boldFont, MARGINS.left, y, col1Width, cellHeight,
    'Vehicle License No.', formData.vehicleLicenseNo || '', true);
  drawTableCell(page, normalFont, boldFont, MARGINS.left + col1Width, y, col2Width, cellHeight,
    'Agency', formData.agencyRegUnit?.split('/')[0] || '', true);
  drawTableCell(page, normalFont, boldFont, MARGINS.left + col1Width + col2Width, y, col3Width, cellHeight,
    'Reg/Unit', formData.agencyRegUnit?.split('/')[1] || '', true);
  
  y -= cellHeight;
  
  // Row 3: Type (Eng., Bus., Sedan) | Odometer Reading | Veh. ID No.
  drawTableCell(page, normalFont, boldFont, MARGINS.left, y, col1Width, cellHeight,
    'Type (Eng., Bus., Sedan)', formData.vehicleType || '', true);
  drawTableCell(page, normalFont, boldFont, MARGINS.left + col1Width, y, col2Width, cellHeight,
    'Odometer Reading', formData.odometerReading?.toString() || '', true);
  drawTableCell(page, normalFont, boldFont, MARGINS.left + col1Width + col2Width, y, col3Width, cellHeight,
    'Veh. ID No.', formData.vehicleIdNo || '', true);
  
  return y - 10;
}

/**
 * Render Inspection Items Table with 17 items
 */
function renderInspectionTable(
  page: any,
  normalFont: any,
  boldFont: any,
  formData: ICS212FormData,
  startY: number
): number {
  let y = startY;
  
  const tableWidth = CONTENT_WIDTH;
  const rowHeight = 16;
  
  // Column widths
  const itemColWidth = tableWidth * 0.55;
  const checkboxColWidth = (tableWidth * 0.15);
  const commentColWidth = tableWidth * 0.30;
  
  // Header row - no background
  page.drawRectangle({
    x: MARGINS.left,
    y: y - rowHeight,
    width: tableWidth,
    height: rowHeight,
    borderColor: COLORS.borderGray,
    borderWidth: 1,
  });
  
  // Draw vertical lines for header
  page.drawLine({
    start: { x: MARGINS.left + itemColWidth, y: y },
    end: { x: MARGINS.left + itemColWidth, y: y - rowHeight },
    thickness: 1,
    color: COLORS.borderGray,
  });
  
  page.drawLine({
    start: { x: MARGINS.left + itemColWidth + checkboxColWidth, y: y },
    end: { x: MARGINS.left + itemColWidth + checkboxColWidth, y: y - rowHeight },
    thickness: 1,
    color: COLORS.borderGray,
  });
  
  page.drawLine({
    start: { x: MARGINS.left + itemColWidth + checkboxColWidth * 2, y: y },
    end: { x: MARGINS.left + itemColWidth + checkboxColWidth * 2, y: y - rowHeight },
    thickness: 1,
    color: COLORS.borderGray,
  });
  
  // Header text
  page.drawText('Inspection Items', {
    x: MARGINS.left + 3,
    y: y - 11,
    size: FONTS.label,
    font: boldFont,
    color: COLORS.black,
  });
  
  page.drawText('Pass', {
    x: MARGINS.left + itemColWidth + 20,
    y: y - 11,
    size: FONTS.label,
    font: boldFont,
    color: COLORS.black,
  });
  
  page.drawText('Fail', {
    x: MARGINS.left + itemColWidth + checkboxColWidth + 25,
    y: y - 11,
    size: FONTS.label,
    font: boldFont,
    color: COLORS.black,
  });
  
  page.drawText('Comments', {
    x: MARGINS.left + itemColWidth + checkboxColWidth * 2 + 35,
    y: y - 11,
    size: FONTS.label,
    font: boldFont,
    color: COLORS.black,
  });
  
  y -= rowHeight;
  
  // Official 17 inspection items
  const officialItems = [
    '1. Gauges and lights.   See back*',
    '2. Seat belts.   See back*',
    '3. Glass and mirrors.   See back*',
    '4. Wipers and horn.   See back*',
    '5. Engine compartment.   See back*',
    '6. Fuel System.   See back*',
    '7. Steering.   See back*',
    '8. Brakes.   See back*',
    '9. Drive line U-joints.   Check play',
    '10.   Springs and shocks.   See back*',
    '11.   Exhaust system.   See back*',
    '12.   Frame.   See back*',
    '13.   Tire and wheels.   See back*',
    '14.   Coupling devices.',
    '       Emergency exit (buses)',
    '15.   Pump operation',
    '16.   Damage on incident',
    '17.   Other',
  ];
  
  // Render each inspection item row
  for (let i = 0; i < 17; i++) {
    const item = formData.inspectionItems[i];
    const itemText = officialItems[i];
    
    // Draw row background (light blue)
    page.drawRectangle({
      x: MARGINS.left,
      y: y - rowHeight,
      width: tableWidth,
      height: rowHeight,
      color: COLORS.lightBlue,
      borderColor: COLORS.borderGray,
      borderWidth: 1,
    });
    
    // Draw vertical dividers
    page.drawLine({
      start: { x: MARGINS.left + itemColWidth, y: y },
      end: { x: MARGINS.left + itemColWidth, y: y - rowHeight },
      thickness: 1,
      color: COLORS.borderGray,
    });
    
    page.drawLine({
      start: { x: MARGINS.left + itemColWidth + checkboxColWidth, y: y },
      end: { x: MARGINS.left + itemColWidth + checkboxColWidth, y: y - rowHeight },
      thickness: 1,
      color: COLORS.borderGray,
    });
    
    page.drawLine({
      start: { x: MARGINS.left + itemColWidth + checkboxColWidth * 2, y: y },
      end: { x: MARGINS.left + itemColWidth + checkboxColWidth * 2, y: y - rowHeight },
      thickness: 1,
      color: COLORS.borderGray,
    });
    
    // Item text
    page.drawText(itemText, {
      x: MARGINS.left + 3,
      y: y - 11,
      size: FONTS.small,
      font: normalFont,
      color: COLORS.black,
    });
    
    // Draw checkboxes and marks
    const checkSize = 8;
    const passCheckX = MARGINS.left + itemColWidth + 30;
    const failCheckX = MARGINS.left + itemColWidth + checkboxColWidth + 30;
    const checkY = y - 12;
    
    // Pass checkbox
    page.drawRectangle({
      x: passCheckX,
      y: checkY,
      width: checkSize,
      height: checkSize,
      borderColor: COLORS.black,
      borderWidth: 0.5,
      color: COLORS.white,
    });
    
    if (item && item.status === 'pass') {
      page.drawText('X', {
        x: passCheckX + 1.5,
        y: checkY + 1,
        size: FONTS.small,
        font: boldFont,
        color: COLORS.black,
      });
    }
    
    // Fail checkbox
    page.drawRectangle({
      x: failCheckX,
      y: checkY,
      width: checkSize,
      height: checkSize,
      borderColor: COLORS.black,
      borderWidth: 0.5,
      color: COLORS.white,
    });
    
    if (item && item.status === 'fail') {
      page.drawText('X', {
        x: failCheckX + 1.5,
        y: checkY + 1,
        size: FONTS.small,
        font: boldFont,
        color: COLORS.black,
      });
    }
    
    // Comments (if any)
    if (item && item.comments) {
      const commentText = item.comments.substring(0, 25); // Limit length
      page.drawText(commentText, {
        x: MARGINS.left + itemColWidth + checkboxColWidth * 2 + 3,
        y: y - 11,
        size: FONTS.tiny,
        font: normalFont,
        color: COLORS.black,
      });
    }
    
    y -= rowHeight;
  }
  
  // Safety item footnote
  page.drawText('*Safety Item – Do Not Release Until Repaired', {
    x: MARGINS.left,
    y: y - 10,
    size: FONTS.small,
    font: normalFont,
    color: COLORS.black,
  });
  
  return y - 15;
}

/**
 * Render Additional Comments section with lined paper effect
 */
function renderAdditionalComments(
  page: any,
  normalFont: any,
  boldFont: any,
  formData: ICS212FormData,
  startY: number
): number {
  let y = startY;
  
  // Header
  page.drawText('Additional Comments:', {
    x: MARGINS.left,
    y: y,
    size: FONTS.label,
    font: boldFont,
    color: COLORS.black,
  });
  
  y -= 15;
  
  // Draw comment box with lines
  const boxHeight = 70;
  const lineSpacing = 12;
  
  // Background
  page.drawRectangle({
    x: MARGINS.left,
    y: y - boxHeight,
    width: CONTENT_WIDTH,
    height: boxHeight,
    color: COLORS.lightBlue,
    borderColor: COLORS.borderGray,
    borderWidth: 1,
  });
  
  // Horizontal lines for writing
  for (let i = 0; i < 5; i++) {
    const lineY = y - 10 - (i * lineSpacing);
    page.drawLine({
      start: { x: MARGINS.left + 5, y: lineY },
      end: { x: MARGINS.left + CONTENT_WIDTH - 5, y: lineY },
      thickness: 0.3,
      color: COLORS.darkGray,
    });
  }
  
  // Render comments if present
  if (formData.additionalComments) {
    const lines = formData.additionalComments.split('\n');
    let commentY = y - 8;
    
    lines.slice(0, 5).forEach((line) => {
      page.drawText(line.substring(0, 80), {
        x: MARGINS.left + 5,
        y: commentY,
        size: FONTS.small,
        font: normalFont,
        color: COLORS.black,
      });
      commentY -= lineSpacing;
    });
  }
  
  return y - boxHeight - 15;
}

/**
 * Render bottom decision boxes - HOLD FOR REPAIRS / RELEASE
 */
async function renderBottomDecisionBoxes(
  page: any,
  normalFont: any,
  boldFont: any,
  formData: ICS212FormData,
  pdfDoc: any,
  startY: number
): Promise<number> {
  let y = startY;
  
  const boxWidth = (CONTENT_WIDTH - 10) / 2;
  const boxHeight = 80;
  
  // HOLD FOR REPAIRS box (left side)
  page.drawRectangle({
    x: MARGINS.left,
    y: y - boxHeight,
    width: boxWidth,
    height: boxHeight,
    borderColor: COLORS.borderGray,
    borderWidth: 2,
  });
  
  // Checkbox for HOLD
  const holdCheckSize = 10;
  page.drawRectangle({
    x: MARGINS.left + 5,
    y: y - 15,
    width: holdCheckSize,
    height: holdCheckSize,
    borderColor: COLORS.black,
    borderWidth: 1,
    color: COLORS.white,
  });
  
  if (formData.releaseStatus === 'hold') {
    page.drawText('X', {
      x: MARGINS.left + 7,
      y: y - 13,
      size: FONTS.label,
      font: boldFont,
      color: COLORS.black,
    });
  }
  
  page.drawText('HOLD FOR REPAIRS', {
    x: MARGINS.left + 20,
    y: y - 13,
    size: FONTS.label,
    font: boldFont,
    color: COLORS.black,
  });
  
  // Date, Time line
  page.drawText('Date', {
    x: MARGINS.left + 5,
    y: y - 30,
    size: FONTS.small,
    font: normalFont,
    color: COLORS.black,
  });
  
  page.drawLine({
    start: { x: MARGINS.left + 30, y: y - 30 },
    end: { x: MARGINS.left + 100, y: y - 30 },
    thickness: 0.5,
    color: COLORS.black,
  });
  
  page.drawText(new Date(formData.inspectorDate).toLocaleDateString(), {
    x: MARGINS.left + 35,
    y: y - 28,
    size: FONTS.small,
    font: normalFont,
    color: COLORS.black,
  });
  
  page.drawText('Time', {
    x: MARGINS.left + 110,
    y: y - 30,
    size: FONTS.small,
    font: normalFont,
    color: COLORS.black,
  });
  
  page.drawLine({
    start: { x: MARGINS.left + 135, y: y - 30 },
    end: { x: MARGINS.left + boxWidth - 5, y: y - 30 },
    thickness: 0.5,
    color: COLORS.black,
  });
  
  page.drawText(formData.inspectorTime || '', {
    x: MARGINS.left + 140,
    y: y - 28,
    size: FONTS.small,
    font: normalFont,
    color: COLORS.black,
  });
  
  // Inspector name line
  page.drawText('Inspector name (Print)', {
    x: MARGINS.left + 5,
    y: y - 45,
    size: FONTS.small,
    font: normalFont,
    color: COLORS.black,
  });
  
  page.drawLine({
    start: { x: MARGINS.left + 5, y: y - 55 },
    end: { x: MARGINS.left + boxWidth - 5, y: y - 55 },
    thickness: 0.5,
    color: COLORS.black,
  });
  
  page.drawText(formData.inspectorNamePrint || '', {
    x: MARGINS.left + 10,
    y: y - 53,
    size: FONTS.small,
    font: normalFont,
    color: COLORS.black,
  });
  
  // Inspector signature line
  page.drawText('Inspector Signature', {
    x: MARGINS.left + 5,
    y: y - 60,
    size: FONTS.small,
    font: normalFont,
    color: COLORS.black,
  });
  
  page.drawLine({
    start: { x: MARGINS.left + 5, y: y - 75 },
    end: { x: MARGINS.left + boxWidth - 5, y: y - 75 },
    thickness: 0.5,
    color: COLORS.black,
  });
  
  // Draw inspector signature if present
  if (formData.inspectorSignature?.imageData) {
    try {
      const base64Data = formData.inspectorSignature.imageData.replace(/^data:image\/png;base64,/, '');
      const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      const signatureImage = await pdfDoc.embedPng(imageBytes);
      
      page.drawImage(signatureImage, {
        x: MARGINS.left + 10,
        y: y - 73,
        width: 100,
        height: 18,
      });
    } catch (error) {
      // Signature embedding failed - skip
    }
  }
  
  // RELEASE box (right side)
  const releaseX = MARGINS.left + boxWidth + 10;
  
  page.drawRectangle({
    x: releaseX,
    y: y - boxHeight,
    width: boxWidth,
    height: boxHeight,
    borderColor: COLORS.borderGray,
    borderWidth: 2,
  });
  
  // Checkbox for RELEASE
  page.drawRectangle({
    x: releaseX + 5,
    y: y - 15,
    width: holdCheckSize,
    height: holdCheckSize,
    borderColor: COLORS.black,
    borderWidth: 1,
    color: COLORS.white,
  });
  
  if (formData.releaseStatus === 'release') {
    page.drawText('X', {
      x: releaseX + 7,
      y: y - 13,
      size: FONTS.label,
      font: boldFont,
      color: COLORS.black,
    });
  }
  
  page.drawText('RELEASE', {
    x: releaseX + 20,
    y: y - 13,
    size: FONTS.label,
    font: boldFont,
    color: COLORS.black,
  });
  
  // Date, Time line
  page.drawText('Date', {
    x: releaseX + 5,
    y: y - 30,
    size: FONTS.small,
    font: normalFont,
    color: COLORS.black,
  });
  
  page.drawLine({
    start: { x: releaseX + 30, y: y - 30 },
    end: { x: releaseX + 100, y: y - 30 },
    thickness: 0.5,
    color: COLORS.black,
  });
  
  page.drawText(formData.operatorDate ? new Date(formData.operatorDate).toLocaleDateString() : '', {
    x: releaseX + 35,
    y: y - 28,
    size: FONTS.small,
    font: normalFont,
    color: COLORS.black,
  });
  
  page.drawText('Time', {
    x: releaseX + 110,
    y: y - 30,
    size: FONTS.small,
    font: normalFont,
    color: COLORS.black,
  });
  
  page.drawLine({
    start: { x: releaseX + 135, y: y - 30 },
    end: { x: releaseX + boxWidth - 5, y: y - 30 },
    thickness: 0.5,
    color: COLORS.black,
  });
  
  page.drawText(formData.operatorTime || '', {
    x: releaseX + 140,
    y: y - 28,
    size: FONTS.small,
    font: normalFont,
    color: COLORS.black,
  });
  
  // Operator name line
  page.drawText('Operator Name (Print)', {
    x: releaseX + 5,
    y: y - 45,
    size: FONTS.small,
    font: normalFont,
    color: COLORS.black,
  });
  
  page.drawLine({
    start: { x: releaseX + 5, y: y - 55 },
    end: { x: releaseX + boxWidth - 5, y: y - 55 },
    thickness: 0.5,
    color: COLORS.black,
  });
  
  page.drawText(formData.operatorNamePrint || '', {
    x: releaseX + 10,
    y: y - 53,
    size: FONTS.small,
    font: normalFont,
    color: COLORS.black,
  });
  
  // Operator signature line
  page.drawText('Operator Signature', {
    x: releaseX + 5,
    y: y - 60,
    size: FONTS.small,
    font: normalFont,
    color: COLORS.black,
  });
  
  page.drawLine({
    start: { x: releaseX + 5, y: y - 75 },
    end: { x: releaseX + boxWidth - 5, y: y - 75 },
    thickness: 0.5,
    color: COLORS.black,
  });
  
  // Draw operator signature if present
  if (formData.operatorSignature?.imageData) {
    try {
      const base64Data = formData.operatorSignature.imageData.replace(/^data:image\/png;base64,/, '');
      const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      const signatureImage = await pdfDoc.embedPng(imageBytes);
      
      page.drawImage(signatureImage, {
        x: releaseX + 10,
        y: y - 73,
        width: 100,
        height: 18,
      });
    } catch (error) {
      // Signature embedding failed - skip
    }
  }
  
  return y - boxHeight - 10;
}

/**
 * Render footer with distribution info and form identifiers
 */
function renderFooter(page: any, normalFont: any): void {
  const footerY = MARGINS.bottom + 20;
  
  // Distribution line 1
  page.drawText('This form may be photocopied, but three copies must be completed.', {
    x: MARGINS.left,
    y: footerY + 10,
    size: FONTS.tiny,
    font: normalFont,
    color: COLORS.black,
  });
  
  // Distribution line 2
  page.drawText('Distribution: Original to inspector, copy to vehicle operator, copy to Incident Document Unit', {
    x: MARGINS.left,
    y: footerY,
    size: FONTS.tiny,
    font: normalFont,
    color: COLORS.black,
  });
  
  // Bottom left: ICS 212 WF (1/14)
  page.drawText('ICS 212 WF (1/14)', {
    x: MARGINS.left,
    y: MARGINS.bottom,
    size: FONTS.small,
    font: normalFont,
    color: COLORS.black,
  });
  
  // Bottom right: NFES 001251
  page.drawText('NFES 001251', {
    x: PAGE_SIZE.width - MARGINS.right - normalFont.widthOfTextAtSize('NFES 001251', FONTS.small),
    y: MARGINS.bottom,
    size: FONTS.small,
    font: normalFont,
    color: COLORS.black,
  });
}

/**
 * Helper: Draw a table cell with label and value
 */
function drawTableCell(
  page: any,
  normalFont: any,
  boldFont: any,
  x: number,
  y: number,
  width: number,
  height: number,
  label: string,
  value: string,
  hasBackground: boolean
): void {
  // Draw cell background (light blue)
  if (hasBackground) {
    page.drawRectangle({
      x: x,
      y: y - height,
      width: width,
      height: height,
      color: COLORS.lightBlue,
      borderColor: COLORS.borderGray,
      borderWidth: 1,
    });
  } else {
    page.drawRectangle({
      x: x,
      y: y - height,
      width: width,
      height: height,
      borderColor: COLORS.borderGray,
      borderWidth: 1,
    });
  }
  
  // Draw label
  page.drawText(label, {
    x: x + 3,
    y: y - 10,
    size: FONTS.small,
    font: normalFont,
    color: COLORS.black,
  });
  
  // Draw value (if present)
  if (value) {
    page.drawText(value, {
      x: x + 3,
      y: y - height + 4,
      size: FONTS.data,
      font: boldFont,
      color: COLORS.black,
    });
  }
}
