-- Migration: Create supply_tasks table for tracking inventory-related tasks
-- Created: 2025-12-12

CREATE TABLE IF NOT EXISTS supply_tasks (
  id TEXT PRIMARY KEY,
  apparatus TEXT NOT NULL,
  compartment TEXT,
  item_name TEXT NOT NULL,
  item_id TEXT,
  deficiency_type TEXT NOT NULL CHECK(deficiency_type IN ('missing', 'damaged')),
  suggested_replacements TEXT, -- JSON array of suggestions
  chosen_replacement TEXT, -- JSON object of chosen replacement
  qty_to_transfer INTEGER DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'completed', 'canceled')),
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  completed_by TEXT,
  completed_at TEXT,
  notes TEXT,
  audit_log TEXT -- JSON array of audit entries
);

CREATE INDEX IF NOT EXISTS idx_tasks_status ON supply_tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_apparatus ON supply_tasks(apparatus);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON supply_tasks(created_at);

-- Create inventory_audit table for tracking all inventory changes
CREATE TABLE IF NOT EXISTS inventory_audit (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL,
  delta INTEGER NOT NULL,
  reason TEXT,
  performed_by TEXT NOT NULL,
  performed_at TEXT NOT NULL,
  task_id TEXT,
  extra TEXT -- JSON for additional data
);

CREATE INDEX IF NOT EXISTS idx_audit_item ON inventory_audit(item_id);
CREATE INDEX IF NOT EXISTS idx_audit_performed_at ON inventory_audit(performed_at);
