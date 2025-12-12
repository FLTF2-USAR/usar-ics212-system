# Inventory Integration Setup Guide

## Overview
This document provides step-by-step instructions for setting up the Google Sheets inventory integration with the MBFD Checkout System.

## Prerequisites
- Google account (mbfdinventory@gmail.com)
- Access to the Google Sheet: https://docs.google.com/spreadsheets/d/1JxNIMMQwcUyMagshBTiff1D72Z4FDrQ6amrJV4EgPLs/edit
- Cloudflare account with Workers access
- GitHub repository access

## Architecture Overview

The integration uses:
1. **Cloudflare Worker** - Secure backend API that proxies requests to Google Sheets
2. **Google Service Account** - Server-to-server authentication (no client secrets exposed)
3. **Cloudflare D1** - SQL database for task management
4. **Cloudflare KV** - Caching for Google API tokens and config
5. **React Frontend** - Admin dashboard UI components

## Part 1: Google Service Account Setup

### Step 1: Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with mbfdinventory@gmail.com
3. Click "Select a Project" > "New Project"
4. Name it "MBFD Inventory Integration"
5. Click "Create"

### Step 2: Enable Google Sheets API
1. In the project, go to "APIs & Services" > "Library"
2. Search for "Google Sheets API"
3. Click on it and click "Enable"

### Step 3: Create Service Account
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "Service Account"
3. Name: `mbfd-sheets-service`
4. Description: `Service account for MBFD inventory management`
5. Click "Create and Continue"
6. Grant role: "Editor" (or create custom role with Sheets access only)
7. Click "Done"

### Step 4: Generate Service Account Key
1. In Credentials page, click on the service account email
2. Go to "Keys" tab
3. Click "Add Key" > "Create New Key"
4. Choose "JSON"
5. Click "Create" - this will download a JSON file
6. **IMPORTANT**: Keep this file secure! It contains the private key.

### Step 5: Share Google Sheet with Service Account
1. Open the JSON file you downloaded
2. Find the `client_email` field (looks like `mbfd-sheets-service@project-name.iam.gserviceaccount.com`)
3. Open your Google Sheet: https://docs.google.com/spreadsheets/d/1JxNIMMQwcUyMagshBTiff1D72Z4FDrQ6amrJV4EgPLs/edit
4. Click "Share" button
5. Paste the service account email
6. Give it "Editor" permissions
7. Uncheck "Notify people"
8. Click "Share"

## Part 2: Cloudflare Worker Configuration

### Step 1: Set Environment Variables

Set the following secrets in Cloudflare Worker:

```bash
# Navigate to worker directory
cd worker/mbfd-github-proxy

# Set the service account JSON (paste entire contents of downloaded JSON file)
echo 'YOUR_SERVICE_ACCOUNT_JSON_HERE' | npx wrangler secret put GOOGLE_SA_KEY

# Set the Google Sheet ID
npx wrangler secret put GOOGLE_SHEET_ID
# When prompted, enter: 1JxNIMMQwcUyMagshBTiff1D72Z4FDrQ6amrJV4EgPLs
```

**Note**: The existing secrets (GITHUB_TOKEN, ADMIN_PASSWORD, GMAIL_*) should remain configured.

### Step 2: Deploy Worker

```bash
cd worker/mbfd-github-proxy
set CLOUDFLARE_API_TOKEN=U6XGuhQXd5JwIrkuIprFiXA_OvyCqd6ZQeLs_cmZ
npx wrangler deploy
```

## Part 3: Google Sheet Format

Your Google Sheet should have the following structure in a sheet named "Inventory":

| Row | Column A | Column B | Column C        | Column D         | Column E  | Column F      | Column G       | Column H         | Column I   |
|-----|----------|----------|-----------------|------------------|-----------|---------------|----------------|------------------|------------|
| 1   | Shelf    | Row      | Equipment Type  | Equipment Name   | Quantity  | Manufacturer  | Location       | Description      | Min Qty    |
| 2   | A        | 1        | Hose            | 2.5" Hose 50ft   | 10        | Snap-tite     | Supply Closet  | Red hose         | 5          |
| 3   | A        | 2        | Tools           | Halligan Bar     | 3         | Pro-Bar       | Supply Closet  | 30" steel        | 2          |
| ... | ...      | ...      | ...             | ...              | ...       | ...           |...             | ...              | ...        |

**Important**: 
- First row is headers
- Data starts on row 2
- Quantity (Column E) must be a number
- Min Qty (Column I) is optional but recommended

## Part 4: Testing

### Test Inventory Read
```bash
curl -X GET https://mbfd-github-proxy.pdarleyjr.workers.dev/api/inventory \
  -H "X-Admin-Password: YOUR_ADMIN_PASSWORD"
```

Expected response:
```json
{
  "items": [
    {
      "id": "item_1",
      "shelf": "A",
      "row": 1,
      "equipmentType": "Hose",
      "equipmentName": "2.5\" Hose 50ft",
      "quantity": 10,
      "manufacturer": "Snap-tite",
      "location": "Supply Closet",
      "description": "Red hose",
      "minQty": 5
    }
    // ... more items
  ],
  "fetchedAt": "2025-12-12T...",
  "source": "sheets"
}
```

### Test Task Creation
```bash
curl -X POST https://mbfd-github-proxy.pdarleyjr.workers.dev/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "tasks": [{
      "apparatus": "Engine 1",
      "compartment": "Left Side #3",
      "item": "Halligan Bar",
      "deficiencyType": "missing",
      "createdBy": "Test User"
    }]
  }'
```

### Test Inventory Adjustment
```bash
curl -X POST https://mbfd-github-proxy.pdarleyjr.workers.dev/api/inventory/adjust \
  -H "X-Admin-Password: YOUR_ADMIN_PASSWORD" \
  -H "Content-Type: application/json" \
  -d '{
    "itemId": "item_3",
    "delta": -1,
    "reason": "Transferred to Engine 1",
    "performedBy": "Admin"
  }'
```

## Part 5: Frontend Integration

The frontend components have been added to the React app:
- `src/lib/inventory.ts` - API client functions
- `src/components/inventory/SupplyListPanel.tsx` - Inventory display
- `src/components/inventory/TasksPanel.tsx` - Task management
- Updated `src/components/AdminDashboard.tsx` - New "Inventory" tab

## Troubleshooting

### Error: "GOOGLE_SA_KEY not configured"
- Ensure you've set the secret using `wrangler secret put GOOGLE_SA_KEY`
- Verify the JSON is valid (test with `JSON.parse()`)

### Error: "Failed to read sheet"
- Check that the service account email has access to the sheet
- Verify the sheet ID is correct
- Ensure the "Inventory" sheet tab exists

### Error: "Failed to get access token"
- Verify the service account JSON is complete and valid
- Check that Google Sheets API is enabled in GCP
- Ensure the private key format is correct (includes BEGIN/END markers)

### Error: "D1 database not configured"
- Run `npx wrangler d1 migrations apply mbfd-supply-db --remote`
- Verify wrangler.jsonc has the D1 binding

## Security Notes

1. **Never commit service account keys to git**
2. **Store secrets only in Cloudflare Worker environment**
3. **Admin password protects all write operations**
4. **Service account has Editor access only to the shared sheet**
5. **CORS restricts requests to https://pdarleyjr.github.io**

## API Endpoints

### GET /api/inventory
Returns live inventory data from Google Sheets.
- **Auth**: Admin password required
- **Response**: Array of inventory items

### POST /api/tasks
Creates new supply tasks (usually called automatically from inspections).
- **Auth**: None required for automatic creation
- **Body**: `{ tasks: [...] }`

### GET /api/tasks
Returns list of supply tasks filtered by status.
- **Auth**: Admin password required
- **Query Params**: `?status=pending|completed|canceled`

### PATCH /api/tasks/:id
Updates a task (mark complete, cancel, etc.).
- **Auth**: Admin password required
- **Body**: `{ status, chosenReplacement, completedBy, notes }`

### POST /api/inventory/adjust
Directly adjusts inventory quantity.
- **Auth**: Admin password required
- **Body**: `{ itemId, delta, reason, performedBy }`

## Receipt Hosting

The system includes hosted receipt generation for inspection logs. When an inspection is completed, a print-friendly receipt is automatically generated, stored in Cloudflare KV, and linked in the GitHub issue.

### Environment Variables

Add these to your Cloudflare Worker:

```bash
# Set the worker's public hostname (used for generating receipt URLs)
echo 'https://mbfd-github-proxy.pdarleyjr.workers.dev' | npx wrangler secret put MBFD_HOSTNAME

# Set receipt expiration (optional, defaults to 90 days)
echo '90' | npx wrangler secret put RECEIPT_TTL_DAYS
```

### Endpoints

#### POST /api/receipts
Creates a new hosted receipt and stores it in KV.
- **Auth**: Admin password required
- **Method**: POST
- **Headers**: 
  - `Content-Type: application/json`
  - `X-Admin-Password: <admin_password>`
- **Body**:
  ```json
  {
    "inspector": "John Doe (Captain)",
    "apparatus": "Rescue 1",
    "date": "2025-12-12T20:00:00.000Z",
    "items": [
      {
        "compartment": "Left Side #1",
        "itemName": "Halligan Bar",
        "status": "present",
        "notes": ""
      },
      {
        "compartment": "Rear",
        "itemName": "First Aid Kit",
        "status": "missing",
        "notes": "Could not locate"
      }
    ],
    "summary": {
      "totalItems": 45,
      "issuesFound": 1
    }
  }
  ```
- **Response (201)**:
  ```json
  {
    "ok": true,
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "url": "https://mbfd-github-proxy.pdarleyjr.workers.dev/receipts/550e8400-e29b-41d4-a716-446655440000"
  }
  ```

#### GET /receipts/:id
Retrieves a hosted receipt HTML page.
- **Auth**: None required (public URL, but unguessable UUID)
- **Method**: GET
- **Response**: HTML page (print-friendly)
- **Cache**: 1 hour public cache
- **TTL**: Receipts expire after configured days (default 90)

### Example: Create Receipt

```bash
curl -X POST 'https://mbfd-github-proxy.pdarleyjr.workers.dev/api/receipts' \
  -H 'Content-Type: application/json' \
  -H 'X-Admin-Password: YOUR_ADMIN_PASSWORD' \
  -d '{
    "inspector": "Test User (Firefighter)",
    "apparatus": "Engine 1",
    "date": "2025-12-12T20:02:35.148Z",
    "items": [
      {
        "compartment": "Front",
        "itemName": "Halligan Bar",
        "status": "present",
        "notes": ""
      }
    ],
    "summary": {
      "totalItems": 1,
      "issuesFound": 0
    }
  }'
```

### Example: View Receipt

```bash
# Returns HTML page
curl 'https://mbfd-github-proxy.pdarleyjr.workers.dev/receipts/550e8400-e29b-41d4-a716-446655440000'
```

Or visit the URL in a browser for the full print-friendly receipt.

### Features

- **Automatic Generation**: Receipts are automatically created when inspections are submitted
- **Print-Friendly**: Optimized CSS for printing with proper page breaks
- **Mobile-Friendly**: Responsive design works on all devices
- **Secure Storage**: Stored in Cloudflare KV with automatic expiration
- **Fallback**: If receipt creation fails, a markdown version is embedded in the GitHub issue
- **Admin UI**: Receipt links appear in the admin dashboard inspection history

### KV Storage

Receipts are stored in the `MBFD_CONFIG` KV namespace with:
- **Key Format**: `receipt:<uuid>`
- **Value**: Complete HTML page
- **TTL**: Configurable via `RECEIPT_TTL_DAYS` (default 90 days)
- **After Expiration**: Receipts are automatically purged from KV

### Security Notes

1. **POST endpoint** requires admin password authentication
2. **GET endpoint** is public but uses unguessable UUIDs (v4)
3. **HTML escaping** prevents XSS attacks in user-provided data
4. **No sensitive data** in receipts (only inspection results)
5. **Automatic expiration** prevents indefinite data retention

## Next Steps

1. Complete Google Service Account setup (Steps 1-5 above)
2. Configure Cloudflare secrets
3. Deploy worker
4. Test endpoints
5. Access admin dashboard to view inventory
6. Train users on the new system

## Support

For issues or questions, refer to:
- [Google Sheets API Documentation](https://developers.google.com/sheets/api)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Cloudflare D1 Docs](https://developers.cloudflare.com/d1/)
