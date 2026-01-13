-- Migration 0006: PDF Field Configurations for Visual Mapper
-- This table stores coordinate mappings for PDF form fields as percentages (0.0 to 1.0)
-- Making them resolution-independent and allowing visual drag-and-drop configuration

CREATE TABLE IF NOT EXISTS pdf_field_configs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  form_type TEXT NOT NULL,          -- e.g., 'ics212', 'ics218'
  field_key TEXT NOT NULL,          -- e.g., 'incidentName', 'inspection_0_pass'
  page_number INTEGER NOT NULL DEFAULT 1,
  x_pct REAL NOT NULL,              -- X position as % of page width (0.0 to 1.0)
  y_pct REAL NOT NULL,              -- Y position as % of page height (0.0 to 1.0)
  width_pct REAL,                   -- Optional width as % of page width
  height_pct REAL,                  -- Optional height as % of page height
  field_type TEXT DEFAULT 'text',   -- 'text', 'checkbox', 'signature', 'multiline'
  font_size INTEGER DEFAULT 10,     -- Font size for text fields
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(form_type, field_key, page_number)
);

-- Index for fast lookups by form type
CREATE INDEX idx_pdf_configs_form_type ON pdf_field_configs(form_type);

-- Seed data: Default ICS-212 field coordinates (converted from current hardcoded values)
-- PDF dimensions: 612pt width x 792pt height
-- Formula: x_pct = x_px / 612, y_pct = y_px / 792

INSERT INTO pdf_field_configs (form_type, field_key, page_number, x_pct, y_pct, field_type) VALUES
-- Header section
('ics212', 'incidentName', 1, 0.098, 0.878, 'text'),
('ics212', 'orderNo', 1, 0.743, 0.878, 'text'),
('ics212', 'vehicleLicenseNo', 1, 0.098, 0.851, 'text'),
('ics212', 'agency', 1, 0.465, 0.851, 'text'),
('ics212', 'regUnit', 1, 1.103, 0.631, 'text'),
('ics212', 'vehicleType', 1, 1.062, 0.126, 'text'),
('ics212', 'odometerReading', 1, 1.062, 0.442, 'text'),
('ics212', 'vehicleIdNo', 1, 1.062, 0.631, 'text'),

-- Inspection items - Pass checkboxes
('ics212', 'inspection_0_pass', 1, 0.980, 0.347, 'checkbox'),
('ics212', 'inspection_1_pass', 1, 0.980, 0.326, 'checkbox'),
('ics212', 'inspection_2_pass', 1, 0.980, 0.304, 'checkbox'),
('ics212', 'inspection_3_pass', 1, 0.980, 0.283, 'checkbox'),
('ics212', 'inspection_4_pass', 1, 0.980, 0.261, 'checkbox'),
('ics212', 'inspection_5_pass', 1, 0.980, 0.240, 'checkbox'),
('ics212', 'inspection_6_pass', 1, 0.980, 0.218, 'checkbox'),
('ics212', 'inspection_7_pass', 1, 0.980, 0.197, 'checkbox'),
('ics212', 'inspection_8_pass', 1, 0.980, 0.175, 'checkbox'),
('ics212', 'inspection_9_pass', 1, 0.980, 0.154, 'checkbox'),
('ics212', 'inspection_10_pass', 1, 0.980, 0.133, 'checkbox'),
('ics212', 'inspection_11_pass', 1, 0.980, 0.111, 'checkbox'),
('ics212', 'inspection_12_pass', 1, 0.980, 0.090, 'checkbox'),
('ics212', 'inspection_13_pass', 1, 0.980, 0.068, 'checkbox'),
('ics212', 'inspection_14_pass', 1, 0.980, 0.047, 'checkbox'),
('ics212', 'inspection_15_pass', 1, 0.980, 0.025, 'checkbox'),
('ics212', 'inspection_16_pass', 1, 0.980, 0.004, 'checkbox'),

-- Inspection items - Fail checkboxes
('ics212', 'inspection_0_fail', 1, 0.645, 0.347, 'checkbox'),
('ics212', 'inspection_1_fail', 1, 0.645, 0.326, 'checkbox'),
('ics212', 'inspection_2_fail', 1, 0.645, 0.304, 'checkbox'),
('ics212', 'inspection_3_fail', 1, 0.645, 0.283, 'checkbox'),
('ics212', 'inspection_4_fail', 1, 0.645, 0.261, 'checkbox'),
('ics212', 'inspection_5_fail', 1, 0.645, 0.240, 'checkbox'),
('ics212', 'inspection_6_fail', 1, 0.645, 0.218, 'checkbox'),
('ics212', 'inspection_7_fail', 1, 0.645, 0.197, 'checkbox'),
('ics212', 'inspection_8_fail', 1, 0.645, 0.175, 'checkbox'),
('ics212', 'inspection_9_fail', 1, 0.645, 0.154, 'checkbox'),
('ics212', 'inspection_10_fail', 1, 0.645, 0.133, 'checkbox'),
('ics212', 'inspection_11_fail', 1, 0.645, 0.111, 'checkbox'),
('ics212', 'inspection_12_fail', 1, 0.645, 0.090, 'checkbox'),
('ics212', 'inspection_13_fail', 1, 0.645, 0.068, 'checkbox'),
('ics212', 'inspection_14_fail', 1, 0.645, 0.047, 'checkbox'),
('ics212', 'inspection_15_fail', 1, 0.645, 0.025, 'checkbox'),
('ics212', 'inspection_16_fail', 1, 0.645, 0.004, 'checkbox'),

-- Inspection items - Comment fields
('ics212', 'inspection_0_comment', 1, 0.727, 0.347, 'text'),
('ics212', 'inspection_1_comment', 1, 0.727, 0.326, 'text'),
('ics212', 'inspection_2_comment', 1, 0.727, 0.304, 'text'),
('ics212', 'inspection_3_comment', 1, 0.727, 0.283, 'text'),
('ics212', 'inspection_4_comment', 1, 0.727, 0.261, 'text'),
('ics212', 'inspection_5_comment', 1, 0.727, 0.240, 'text'),
('ics212', 'inspection_6_comment', 1, 0.727, 0.218, 'text'),
('ics212', 'inspection_7_comment', 1, 0.727, 0.197, 'text'),
('ics212', 'inspection_8_comment', 1, 0.727, 0.175, 'text'),
('ics212', 'inspection_9_comment', 1, 0.727, 0.154, 'text'),
('ics212', 'inspection_10_comment', 1, 0.727, 0.133, 'text'),
('ics212', 'inspection_11_comment', 1, 0.727, 0.111, 'text'),
('ics212', 'inspection_12_comment', 1, 0.727, 0.090, 'text'),
('ics212', 'inspection_13_comment', 1, 0.727, 0.068, 'text'),
('ics212', 'inspection_14_comment', 1, 0.727, 0.047, 'text'),
('ics212', 'inspection_15_comment', 1, 0.727, 0.025, 'text'),
('ics212', 'inspection_16_comment', 1, 0.727, 0.004, 'text'),

-- Additional comments block
('ics212', 'additionalComments', 1, 0.098, 0.414, 'multiline'),

-- Hold for Repairs section
('ics212', 'hold_checkbox', 1, 0.098, 0.170, 'checkbox'),
('ics212', 'inspector_date', 1, 0.286, 0.126, 'text'),
('ics212', 'inspector_time', 1, 0.286, 0.316, 'text'),
('ics212', 'inspector_name', 1, 0.237, 0.252, 'text'),
('ics212', 'inspector_signature', 1, 0.204, 0.252, 'signature'),

-- Release for Use section
('ics212', 'release_checkbox', 1, 0.498, 0.170, 'checkbox'),
('ics212', 'operator_date', 1, 0.286, 0.442, 'text'),
('ics212', 'operator_time', 1, 0.286, 0.631, 'text'),
('ics212', 'operator_name', 1, 0.237, 0.568, 'text'),
('ics212', 'operator_signature', 1, 0.204, 0.568, 'signature');
