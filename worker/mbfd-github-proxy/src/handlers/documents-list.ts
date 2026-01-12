/**
 * Documents List Handler
 * 
 * Lists all stored PDFs from R2 bucket
 * Returns file metadata including name, size, upload date, and download URLs
 */

import { Context } from 'hono';

export async function handleDocumentsList(c: Context) {
  console.log('[DOCUMENTS] Listing all PDFs from R2');
  
  try {
    const r2 = c.env.USAR_FORMS;
    
    if (!r2) {
      throw new Error('R2 bucket not configured');
    }
    
    const documents: any[] = [];
    
    // List all objects from R2 bucket
    // R2 list() returns max 1000 objects by default
    const listed = await r2.list({ prefix: '' });
    
    console.log(`[DOCUMENTS] Found ${listed.objects.length} total objects in R2`);
    
    // Filter only PDFs (ignore templates folder)
    for (const object of listed.objects) {
      // Skip template files
      if (object.key.startsWith('templates/')) {
        continue;
      }
      
      // Only include PDF files
      if (!object.key.endsWith('.pdf')) {
        continue;
      }
      
      // Extract metadata from filename
      // Format: ICS212-{vehicleId}-{timestamp}.pdf or ICS218-{id}-{timestamp}.pdf
      const filename = object.key;
      const parts = filename.replace('.pdf', '').split('-');
      const formType = parts[0]; // ICS212 or ICS218
      const uploadedAt = object.uploaded?.toISOString() || new Date(parseInt(parts[parts.length - 1])).toISOString();
      
      documents.push({
        id: object.key,
        filename: filename,
        formType: formType,
        size: object.size,
        uploadedAt: uploadedAt,
        downloadUrl: `/api/documents/download/${encodeURIComponent(object.key)}`,
        key: object.key
      });
    }
    
    // Sort by upload date (newest first)
    documents.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
    
    console.log(`[DOCUMENTS] Returning ${documents.length} PDF documents`);
    
    return c.json({
      success: true,
      documents,
      total: documents.length
    });
    
  } catch (error) {
    console.error('[DOCUMENTS] Error listing documents:', error);
    return c.json({
      success: false,
      error: 'Failed to list documents',
      message: error instanceof Error ? error.message : String(error)
    }, 500);
  }
}

/**
 * Download Document Handler
 * 
 * Downloads a specific PDF from R2
 */
export async function handleDocumentDownload(c: Context) {
  const key = c.req.param('key');
  
  if (!key) {
    return c.json({ error: 'Document key required' }, 400);
  }
  
  console.log(`[DOCUMENTS] Downloading document: ${key}`);
  
  try {
    const r2 = c.env.USAR_FORMS;
    
    if (!r2) {
      throw new Error('R2 bucket not configured');
    }
    
    const object = await r2.get(key);
    
    if (!object) {
      return c.json({ error: 'Document not found' }, 404);
    }
    
    const arrayBuffer = await object.arrayBuffer();
    
    return new Response(arrayBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${key.split('/').pop()}"`,
        'Content-Length': arrayBuffer.byteLength.toString(),
      },
    });
    
  } catch (error) {
    console.error('[DOCUMENTS] Error downloading document:', error);
    return c.json({
      error: 'Failed to download document',
      message: error instanceof Error ? error.message : String(error)
    }, 500);
  }
}

/**
 * Delete Document Handler
 * 
 * Deletes a specific PDF from R2
 */
export async function handleDocumentDelete(c: Context) {
  const key = c.req.param('key');
  
  if (!key) {
    return c.json({ error: 'Document key required' }, 400);
  }
  
  // Prevent deletion of templates
  if (key.startsWith('templates/')) {
    return c.json({ error: 'Cannot delete template files' }, 403);
  }
  
  console.log(`[DOCUMENTS] Deleting document: ${key}`);
  
  try {
    const r2 = c.env.USAR_FORMS;
    
    if (!r2) {
      throw new Error('R2 bucket not configured');
    }
    
    await r2.delete(key);
    
    console.log(`[DOCUMENTS] Successfully deleted: ${key}`);
    
    return c.json({
      success: true,
      message: 'Document deleted successfully'
    });
    
  } catch (error) {
    console.error('[DOCUMENTS] Error deleting document:', error);
    return c.json({
      error: 'Failed to delete document',
      message: error instanceof Error ? error.message : String(error)
    }, 500);
  }
}
