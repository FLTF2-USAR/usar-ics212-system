const fs = require('fs');
const path = require('path');

const WORKER_URL = 'https://mbfd-github-proxy.pdarleyjr.workers.dev';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

if (!ADMIN_PASSWORD) {
  console.error('❌ ADMIN_PASSWORD environment variable must be set');
  console.error('Usage: ADMIN_PASSWORD=your_password node seed-forms.js');
  process.exit(1);
}

// Mapping of apparatus to template files
const apparatusMappings = [
  { apparatus: 'Engine 1', template: 'Engine', file: '../../public/data/engine_checklist.json' },
  { apparatus: 'Engine 2', template: 'Engine', file: '../../public/data/engine_checklist.json' },
  { apparatus: 'Engine 3', template: 'Engine', file: '../../public/data/engine_checklist.json' },
  { apparatus: 'Engine 4', template: 'Engine', file: '../../public/data/engine_checklist.json' },
  { apparatus: 'Rescue 1', template: 'Rescue', file: '../../public/data/rescue_checklist.json' },
  { apparatus: 'Rescue 2', template: 'Rescue', file: '../../public/data/rescue_checklist.json' },
  { apparatus: 'Rescue 3', template: 'Rescue', file: '../../public/data/rescue_checklist.json' },
  { apparatus: 'Rescue 4', template: 'Rescue', file: '../../public/data/rescue_checklist.json' },
  { apparatus: 'Rescue 11', template: 'Rescue', file: '../../public/data/rescue_checklist.json' },
  { apparatus: 'Rescue 22', template: 'Rescue', file: '../../public/data/rescue_checklist.json' },
  { apparatus: 'Rescue 44', template: 'Rescue', file: '../../public/data/rescue_checklist.json' },
  { apparatus: 'Ladder 1', template: 'Ladder 1', file: '../../public/data/ladder1_checklist.json' },
  { apparatus: 'Ladder 3', template: 'Ladder 3', file: '../../public/data/ladder3_checklist.json' },
  { apparatus: 'Rope Inventory', template: 'Rope Inventory', file: '../../public/data/rope_checklist.json' },
];

async function seedForms() {
  console.log('🌱 Starting database seeding...\n');
  
  // Track unique templates we've already created (map templateName -> templateId)
  const createdTemplates = new Map();
  
  for (const mapping of apparatusMappings) {
    try {
      const templateKey = mapping.template;
      
      if (!createdTemplates.has(templateKey)) {
        // Load the form JSON
        const formPath = path.join(__dirname, mapping.file);
        const formJson = JSON.parse(fs.readFileSync(formPath, 'utf8'));
        
        // First apparatus using this template creates it
        console.log(`📄 Creating template "${mapping.template}" for ${mapping.apparatus}...`);
        
        const response = await fetch(`${WORKER_URL}/api/forms`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Admin-Password': ADMIN_PASSWORD,
          },
          body: JSON.stringify({
            apparatus: mapping.apparatus,
            templateName: mapping.template,
            formJson: formJson,
          }),
        });
        
        if (!response.ok) {
          const error = await response.text();
          throw new Error(`HTTP ${response.status}: ${error}`);
        }
        
        const result = await response.json();
        const templateId = result.templateId;
        createdTemplates.set(templateKey, templateId);
        
        console.log(`✅ Created template "${mapping.template}" (ID: ${templateId}) for ${mapping.apparatus}\n`);
      } else {
        // Subsequent apparatus using the same template - use baseTemplateId
        const existingTemplateId = createdTemplates.get(templateKey);
        console.log(`📎 Linking ${mapping.apparatus} to existing "${mapping.template}" template (ID: ${existingTemplateId})...`);
        
        // Create apparatus entry linked to existing template using baseTemplateId
        const response = await fetch(`${WORKER_URL}/api/forms`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Admin-Password': ADMIN_PASSWORD,
          },
          body: JSON.stringify({
            apparatus: mapping.apparatus,
            baseTemplateId: existingTemplateId,
          }),
        });
        
        if (!response.ok) {
          const error = await response.text();
          throw new Error(`HTTP ${response.status}: ${error}`);
        }
        
        console.log(`✅ Linked ${mapping.apparatus} to template "${mapping.template}"\n`);
      }
    } catch (error) {
      console.error(`❌ Error seeding ${mapping.apparatus}:`, error.message);
      console.error('');
    }
  }
  
  console.log('🎉 Database seeding complete!');
  console.log(`✅ Created ${createdTemplates.size} unique templates`);
  console.log(`✅ Configured ${apparatusMappings.length} apparatus`);
}

// Run the seeding
seedForms().catch(console.error);
