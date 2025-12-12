/**
 * Notification Handler
 * 
 * Handles incoming notification requests after inspection submissions
 * Queues for daily digest or sends immediately based on configuration
 */

import { 
  queueNotification, 
  getEmailConfig, 
  canSendEmail,
  incrementEmailCounter,
  PendingNotification 
} from '../kv-helpers';
import { sendGmailMessage } from '../gmail';
import { generateImmediateEmail } from '../digest';

interface Env {
  MBFD_CONFIG: KVNamespace;
  GMAIL_CLIENT_ID: string;
  GMAIL_CLIENT_SECRET: string;
  GMAIL_REFRESH_TOKEN: string;
  GMAIL_SENDER_EMAIL: string;
}

export async function handleNotify(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    const body = await request.json() as {
      apparatus: string;
      operator: string;
      checklistType: string;
      totalItems: number;
      completedItems: number;
      defects: Array<{
        item: string;
        category: string;
        severity: 'critical' | 'high' | 'medium' | 'low';
      }>;
      githubIssueUrl?: string;
    };

    // Validate required fields
    if (!body.apparatus || !body.operator || !body.checklistType) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Create notification object
    const notification: PendingNotification = {
      timestamp: new Date().toISOString(),
      apparatus: body.apparatus,
      operator: body.operator,
      checklistType: body.checklistType,
      totalItems: body.totalItems,
      completedItems: body.completedItems,
      defects: body.defects || [],
      hasCriticalDefects: body.defects?.some(d => d.severity === 'critical') || false,
      githubIssueUrl: body.githubIssueUrl
    };

    // Get email configuration
    const config = await getEmailConfig(env);

    // Determine if we should send immediately based on time
    // Convert current time to Pacific Time and check if it's after 12:00 PM
    const now = new Date();
    const pacificTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
    const currentHour = pacificTime.getHours();
    const isAfterNoon = currentHour >= 12;

    // Send immediately if:
    // 1. It's after 12 PM Pacific, OR
    // 2. Mode is per_submission, OR
    // 3. Mode is hybrid AND has critical defects
    const shouldSendImmediately = 
      isAfterNoon ||
      config.email_mode === 'per_submission' ||
      (config.email_mode === 'hybrid' && notification.hasCriticalDefects && config.enable_immediate_for_critical);

    if (shouldSendImmediately && config.enabled) {
      // Check rate limit
      const canSend = await canSendEmail(env);
      
      if (canSend) {
        // Send immediate email
        const emailContent = generateImmediateEmail(notification);
        const result = await sendGmailMessage(env, {
          to: config.recipients,
          subject: `MBFD Alert - ${notification.apparatus} Inspection`,
          textBody: emailContent.text,
          htmlBody: emailContent.html
        });

        if (result.success) {
          await incrementEmailCounter(env);
          
          return new Response(
            JSON.stringify({ 
              success: true,
              notification_sent: 'immediate',
              message: isAfterNoon ? 'Sent immediately (after 12 PM)' : 'Notification sent successfully'
            }),
            { 
              status: 200, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        } else {
          // Failed to send immediately, queue for digest
          console.error('Failed to send immediate email:', result.error);
          await queueNotification(env, notification);
          
          return new Response(
            JSON.stringify({ 
              success: true,
              notification_sent: 'queued',
              message: 'Queued for daily digest (immediate send failed)'
            }),
            { 
              status: 200, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }
      } else {
        // Rate limit reached, queue for digest
        await queueNotification(env, notification);
        
        return new Response(
          JSON.stringify({ 
            success: true,
            notification_sent: 'queued',
            message: 'Daily email limit reached, queued for digest'
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
    } else {
      // Queue for daily digest (before 12 PM or daily_digest mode)
      await queueNotification(env, notification);
      
      return new Response(
        JSON.stringify({ 
          success: true,
          notification_sent: 'queued',
          message: isAfterNoon ? 'Queued for daily digest' : 'Queued for 12 PM daily digest'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

  } catch (error) {
    console.error('Error handling notification:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process notification',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}