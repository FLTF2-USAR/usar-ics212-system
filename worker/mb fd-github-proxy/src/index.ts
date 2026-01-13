import { handleNotify } from './handlers/notify';
import { handleGetEmailConfig, handleUpdateEmailConfig } from './handlers/config';
import { handleManualDigest } from './handlers/digest';
import { handleAnalyze } from './handlers/analyze';
import { handleGetInventory, handleAdjustInventory } from './handlers/inventory';
import { handleCreateTasks, handleGetTasks, handleUpdateTask, handleMarkTasksViewed } from './handlers/tasks';
import { handleAIInsights, handleGetInsights } from './handlers/ai-insights';
import { handleSendEmail } from './handlers/send-email';
import { handleCreateReceipt, handleGetReceipt } from './handlers/receipts';
import { 
  handleGetApparatusStatus, 
  handleUpdateApparatusStatus,
  handleCreateVehicleChangeRequest,
  handleGetVehicleChangeRequests,
  handleReviewVehicleChangeRequest
} from './handlers/apparatus-status';
import {
  handleListApparatus,
  handleGetFormByApparatus,
  handleListForms,
  handleGetTemplate,
  handleCreateForm,
  handleUpdateForm,
  handleImportForm
} from './handlers/forms';
import { handleImageUpload, handleImageRetrieval } from './handlers/uploads';
import { handleHealthCheck } from './handlers/health';
import { handleVehicles } from './handlers/vehicles';
import { handleICS212Submit } from './handlers/ics212-submit';
import { handlePDFDownload, handlePDFPreview } from './handlers/ics212-pdf-download';
import { handleICS212Admin } from './handlers/ics212-admin';
// ICS 218 handlers
import { handleICS218PasswordValidation } from './handlers/ics218-password';
import { handleICS218Submit } from './handlers/ics218-submit';
import { handleICS218FormsList, handleICS218FormGet } from './handlers/ics218-forms';
// NEW: Admin dashboard handlers
import { handleFiles } from './handlers/files-handler';
import { handleEmail } from './handlers/email-handler';
import { handleAnalytics } from './handlers/analytics-handler';
import { handleAirtable } from './handlers/airtable-handler';
// NEW: PDF Config handler for Visual Mapper
import { handleGetPDFConfig, handleUpdatePDFConfig, handleResetPDFConfig } from './handlers/pdf-config-handler';
import { sendDailyDigest } from './digest';

// ... existing code ...
