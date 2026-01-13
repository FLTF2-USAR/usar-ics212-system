/**
 * PDF Field Configuration Handler
 * 
 * Manages dynamic PDF field coordinate mappings for the Visual Field Mapper.
 * Allows admin users to visually configure PDF form field placements.
 */

import type { Env } from '../index';

interface PDFFieldConfig {
  id?: number;
  form_type: string;
  field_key: string;
  page_number: number;
  x_pct: number;
  y_pct: number;
  width_pct?: number;
  height_pct?: number;
  field_type?: string;
  font_size?: number;
}

/**
 * GET /api/admin/pdf-config/:formType
 * Retrieve all field configurations for a specific form type
 */
export async function handleGetPDFConfig(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
  formType: string
): Promise<Response> {
  try {
    // Check if D1 database is available
    const db = env.DB || env.SUPPLY_DB;
    if (!db) {
      return new Response(
        JSON.stringify({ error: 'Database not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Query all field configurations for this form type
    const result = await db
      .prepare('SELECT * FROM pdf_field_configs WHERE form_type = ? ORDER BY field_key')
      .bind(formType)
      .all();

    return new Response(
      JSON.stringify({
        success: true,
        formType,
        fields: result.results || [],
        count: result.results?.length || 0
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching PDF config:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch PDF configuration',
        message: error instanceof Error ? error.message : String(error)
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * POST /api/admin/pdf-config/:formType
 * Update field configurations for a specific form type (upsert operation)
 */
export async function handleUpdatePDFConfig(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
  formType: string
): Promise<Response> {
  try {
    // Check if D1 database is available
    const db = env.DB || env.SUPPLY_DB;
    if (!db) {
      return new Response(
        JSON.stringify({ error: 'Database not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body = await request.json() as { fields: PDFFieldConfig[] };
    if (!body.fields || !Array.isArray(body.fields)) {
      return new Response(
        JSON.stringify({ error: 'Invalid request body: fields array required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate and sanitize input
    for (const field of body.fields) {
      // Ensure x_pct and y_pct are within valid bounds (0.0 to 2.0, allowing some off-canvas positioning)
      if (field.x_pct < 0 || field.x_pct > 2.0) {
        return new Response(
          JSON.stringify({ 
            error: `Invalid x_pct for field ${field.field_key}: must be between 0.0 and 2.0` 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (field.y_pct < 0 || field.y_pct > 2.0) {
        return new Response(
          JSON.stringify({ 
            error: `Invalid y_pct for field ${field.field_key}: must be between 0.0 and 2.0` 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Begin transaction by processing each field as an upsert
    let updatedCount = 0;
    for (const field of body.fields) {
      const result = await db
        .prepare(`
          INSERT INTO pdf_field_configs (
            form_type, field_key, page_number, x_pct, y_pct, width_pct, height_pct, field_type, font_size, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(form_type, field_key, page_number) 
          DO UPDATE SET 
            x_pct = excluded.x_pct,
            y_pct = excluded.y_pct,
            width_pct = excluded.width_pct,
            height_pct = excluded.height_pct,
            field_type = excluded.field_type,
            font_size = excluded.font_size,
            updated_at = CURRENT_TIMESTAMP
        `)
        .bind(
          formType,
          field.field_key,
          field.page_number || 1,
          field.x_pct,
          field.y_pct,
          field.width_pct || null,
          field.height_pct || null,
          field.field_type || 'text',
          field.font_size || 10
        )
        .run();

      if (result.success) {
        updatedCount++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        formType,
        message: `Updated ${updatedCount} field configurations`,
        updatedCount
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error updating PDF config:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to update PDF configuration',
        message: error instanceof Error ? error.message : String(error)
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * DELETE /api/admin/pdf-config/:formType/reset
 * Reset all field configurations to defaults (re-run seed data)
 */
export async function handleResetPDFConfig(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
  formType: string
): Promise<Response> {
  try {
    const db = env.DB || env.SUPPLY_DB;
    if (!db) {
      return new Response(
        JSON.stringify({ error: 'Database not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Delete all configs for this form type
    const result = await db
      .prepare('DELETE FROM pdf_field_configs WHERE form_type = ?')
      .bind(formType)
      .run();

    return new Response(
      JSON.stringify({
        success: true,
        formType,
        message: `Reset ${formType} config. Re-run migration to restore defaults.`,
        deletedCount: result.meta?.changes || 0
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error resetting PDF config:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to reset PDF configuration',
        message: error instanceof Error ? error.message : String(error)
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
