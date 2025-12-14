-- Migration: Create vehicle_change_requests table
-- Purpose: Track apparatus-to-vehicle assignment change requests from field users
-- Date: 2025-12-14

CREATE TABLE IF NOT EXISTS vehicle_change_requests (
  id TEXT PRIMARY KEY,
  apparatus TEXT NOT NULL,
  old_vehicle_no TEXT,
  new_vehicle_no TEXT NOT NULL,
  reported_by TEXT NOT NULL,
  reported_at TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
  reviewed_by TEXT,
  reviewed_at TEXT,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries by status
CREATE INDEX IF NOT EXISTS idx_vehicle_change_requests_status ON vehicle_change_requests(status);

-- Create index for faster queries by apparatus
CREATE INDEX IF NOT EXISTS idx_vehicle_change_requests_apparatus ON vehicle_change_requests(apparatus);

-- Create index for faster queries by reported_at
CREATE INDEX IF NOT EXISTS idx_vehicle_change_requests_reported_at ON vehicle_change_requests(reported_at DESC);
