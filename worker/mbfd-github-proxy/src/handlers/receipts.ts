/**
 * Receipts Handler
 * Handles creation and retrieval of hosted inspection receipts
 */

import { Env } from '../index';

export interface ReceiptItem {
  compartment?: string;
  itemName: string;
  status: 'present' | 'missing' | 'damaged';
  notes?: string;
}

export interface ReceiptPayload {
  inspector: string;
  apparatus: string;
  date: string; // ISO format
  items: ReceiptItem[];
  summary?: {
    totalItems?: number;
    issuesFound?: number;
  };
}

/**
 * Generate a UUID v4 using Web Crypto API
 */
function generateUUID(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant

  const hex = Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return `${hex.substr(0, 8)}-${hex.substr(8, 4)}-${hex.substr(12, 4)}-${hex.substr(16, 4)}-${hex.substr(20, 12)}`;
}

/**
 * Escape HTML to prevent XSS attacks
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Build HTML receipt from payload
 */
function buildReceiptHTML(id: string, payload: ReceiptPayload): string {
  const { inspector, apparatus, date, items, summary } = payload;
  const dateFormatted = new Date(date).toLocaleString('en-US', {
    dateStyle: 'full',
    timeStyle: 'short',
  });

  const totalItems = summary?.totalItems ?? items.length;
  const issuesFound = summary?.issuesFound ?? items.filter(i => i.status !== 'present').length;

  const itemsHTML = items.map(item => {
    const statusEmoji = item.status === 'present' ? '✅' : item.status === 'missing' ? '❌' : '⚠️';
    const statusColor = item.status === 'present' ? '#10b981' : item.status === 'missing' ? '#ef4444' : '#f59e0b';
    const statusText = item.status === 'present' ? 'Present' : item.status === 'missing' ? 'Missing' : 'Damaged';

    return `
      <tr>
        <td class="px-4 py-3 text-sm text-gray-900">${escapeHtml(item.compartment || 'N/A')}</td>
        <td class="px-4 py-3 text-sm text-gray-900">${escapeHtml(item.itemName)}</td>
        <td class="px-4 py-3 text-sm">
          <span style="color: ${statusColor}; font-weight: 600;">
            ${statusEmoji} ${statusText}
          </span>
        </td>
        <td class="px-4 py-3 text-sm text-gray-600">${escapeHtml(item.notes || '-')}</td>
      </tr>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MBFD Inspection Receipt #${escapeHtml(id.substr(0, 8))}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background: #f9fafb;
      padding: 2rem 1rem;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
      color: white;
      padding: 2rem;
      text-align: center;
    }
    .header h1 {
      font-size: 1.875rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }
    .header p {
      font-size: 1rem;
      opacity: 0.9;
    }
    .content {
      padding: 2rem;
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    .info-item {
      padding: 1rem;
      background: #f3f4f6;
      border-radius: 8px;
    }
    .info-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.25rem;
    }
    .info-value {
      font-size: 1.125rem;
      font-weight: 600;
      color: #111827;
    }
    .summary {
      background: #eff6ff;
      border-left: 4px solid #3b82f6;
      padding: 1.5rem;
      margin-bottom: 2rem;
      border-radius: 8px;
    }
    .summary h2 {
      font-size: 1.25rem;
      font-weight: 700;
      color: #1e40af;
      margin-bottom: 1rem;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }
    .summary-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .summary-label {
      font-weight: 500;
      color: #374151;
    }
    .summary-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1f2937;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 2rem;
    }
    th {
      background: #f9fafb;
      padding: 0.75rem 1rem;
      text-align: left;
      font-size: 0.75rem;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 2px solid #e5e7eb;
    }
    td {
      padding: 1rem;
      border-bottom: 1px solid #e5e7eb;
    }
    tr:last-child td {
      border-bottom: none;
    }
    tr:hover {
      background: #f9fafb;
    }
    details {
      margin-top: 2rem;
      padding: 1rem;
      background: #f9fafb;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
    }
    summary {
      cursor: pointer;
      font-weight: 600;
      color: #374151;
      padding: 0.5rem;
      user-select: none;
    }
    summary:hover {
      color: #1f2937;
    }
    pre {
      margin-top: 1rem;
      padding: 1rem;
      background: #1f2937;
      color: #f3f4f6;
      border-radius: 6px;
      overflow-x: auto;
      font-size: 0.875rem;
      line-height: 1.5;
    }
    .footer {
      text-align: center;
      padding: 1.5rem;
      color: #6b7280;
      font-size: 0.875rem;
      border-top: 1px solid #e5e7eb;
    }
    @media print {
      body { background: white; padding: 0; }
      .container { box-shadow: none; border-radius: 0; }
      details { display: none; }
      .no-print { display: none; }
      @page { margin: 1cm; }
    }
    @media (max-width: 640px) {
      .info-grid { grid-template-columns: 1fr; }
      .summary-grid { grid-template-columns: 1fr; }
      table { font-size: 0.875rem; }
      th, td { padding: 0.5rem; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚒 MBFD Checkout System</h1>
      <p>Inspection Receipt</p>
    </div>
    
    <div class="content">
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">Apparatus</div>
          <div class="info-value">${escapeHtml(apparatus)}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Inspector</div>
          <div class="info-value">${escapeHtml(inspector)}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Date & Time</div>
          <div class="info-value">${dateFormatted}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Receipt ID</div>
          <div class="info-value">#${escapeHtml(id.substr(0, 8))}</div>
        </div>
      </div>

      <div class="summary">
        <h2>📊 Summary</h2>
        <div class="summary-grid">
          <div class="summary-item">
            <span class="summary-label">Items Checked</span>
            <span class="summary-value">${totalItems}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Issues Found</span>
            <span class="summary-value" style="color: ${issuesFound > 0 ? '#dc2626' : '#10b981'}">${issuesFound}</span>
          </div>
        </div>
      </div>

      <h2 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 1rem;">Inspection Details</h2>
      <div style="overflow-x: auto;">
        <table>
          <thead>
            <tr>
              <th>Compartment</th>
              <th>Item</th>
              <th>Status</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
          </tbody>
        </table>
      </div>

      <details class="no-print">
        <summary>📋 View Raw Data (JSON)</summary>
        <pre>${escapeHtml(JSON.stringify(payload, null, 2))}</pre>
      </details>
    </div>

    <div class="footer">
      <p>This receipt was automatically generated by the MBFD Checkout System</p>
      <p style="margin-top: 0.5rem; font-size: 0.75rem;">Receipt ID: ${escapeHtml(id)}</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Handle POST /api/receipts - Create a new hosted receipt
 */
export async function handleCreateReceipt(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    // Verify admin password if provided (optional for regular users)
    const password = request.headers.get('X-Admin-Password');
    if (password && password !== env.ADMIN_PASSWORD) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', message: 'Invalid admin password' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Parse payload
    const payload: ReceiptPayload = await request.json();

    // Validate required fields
    if (!payload.inspector || !payload.apparatus || !payload.date || !Array.isArray(payload.items)) {
      return new Response(
        JSON.stringify({ error: 'Invalid payload', message: 'Missing required fields' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Generate UUID
    const id = generateUUID();

    // Build HTML receipt
    const html = buildReceiptHTML(id, payload);

    // Calculate TTL (default 90 days)
    const ttlDays = Number(env.RECEIPT_TTL_DAYS || 90);
    const expirationTtl = ttlDays * 24 * 60 * 60; // Convert days to seconds

    // Store in KV with expiration
    await env.MBFD_CONFIG.put(`receipt:${id}`, html, { expirationTtl });

    // Construct URL
    const origin = env.MBFD_HOSTNAME || new URL(request.url).origin;
    const url = `${origin}/receipts/${id}`;

    console.log(`Created receipt ${id} with TTL ${ttlDays} days`);

    return new Response(
      JSON.stringify({
        ok: true,
        id,
        url,
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  } catch (error) {
    console.error('Error creating receipt:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
}

/**
 * Handle GET /receipts/:id - Retrieve a hosted receipt
 */
export async function handleGetReceipt(request: Request, env: Env, id: string): Promise<Response> {
  try {
    // Validate UUID format (basic check)
    if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(id)) {
      return new Response('Invalid receipt ID', { status: 400 });
    }

    // Fetch from KV
    const html = await env.MBFD_CONFIG.get(`receipt:${id}`);

    if (!html) {
      return new Response('Receipt not found or expired', { status: 404 });
    }

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Error retrieving receipt:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
