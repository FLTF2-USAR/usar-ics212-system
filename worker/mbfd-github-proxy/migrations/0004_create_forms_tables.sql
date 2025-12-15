-- Migration: Create tables for inventory forms and apparatus management
-- This enables dynamic form management for apparatus daily inspections

CREATE TABLE IF NOT EXISTS form_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  modified_at TEXT NOT NULL,
  published_version INTEGER
);

CREATE TABLE IF NOT EXISTS apparatus (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  template_id TEXT NOT NULL REFERENCES form_templates(id),
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS form_versions (
  version_id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_id TEXT NOT NULL REFERENCES form_templates(id),
  json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  created_by TEXT,
  change_summary TEXT,
  is_published INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_apparatus_name ON apparatus(name);
CREATE INDEX IF NOT EXISTS idx_apparatus_template ON apparatus(template_id);
CREATE INDEX IF NOT EXISTS idx_versions_template ON form_versions(template_id);
CREATE INDEX IF NOT EXISTS idx_versions_published ON form_versions(template_id, is_published);
