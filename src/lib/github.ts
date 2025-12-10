import type { Defect, GitHubIssue, InspectionSubmission } from '../types';

// Cloudflare Worker API endpoint
const API_BASE_URL = 'https://mbfd-github-proxy.pdarleyjr.workers.dev/api';

class GitHubService {
  private adminPassword: string | null = null;

  constructor() {
    // No token needed in frontend - handled by Cloudflare Worker
  }

  /**
   * Set admin password for authenticated requests
   */
  setAdminPassword(password: string): void {
    this.adminPassword = password;
  }

  /**
   * Clear admin password
   */
  clearAdminPassword(): void {
    this.adminPassword = null;
  }

  /**
   * Check if admin is authenticated
   */
  isAdminAuthenticated(): boolean {
    return this.adminPassword !== null;
  }

  /**
   * Get headers for API requests
   */
  private getHeaders(isAdmin: boolean = false): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (isAdmin && this.adminPassword) {
      headers['X-Admin-Password'] = this.adminPassword;
    }

    return headers;
  }

  /**
   * Fetch all open defects for a specific apparatus
   * Returns a map of items to their issue numbers for quick lookup
   */
  async checkExistingDefects(apparatus: string): Promise<Map<string, GitHubIssue>> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/issues?state=open&labels=Defect,${encodeURIComponent(apparatus)}&per_page=100`,
        {
          method: 'GET',
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch defects: ${response.statusText}`);
      }

      const issues: GitHubIssue[] = await response.json();
      const defectMap = new Map<string, GitHubIssue>();

      for (const issue of issues) {
        // Parse the issue title to extract compartment and item
        // Expected format: "[Apparatus] Compartment: Item - Status"
        const match = issue.title.match(/\[.+\]\s+(.+):\s+(.+?)\s+-\s+(Missing|Damaged)/);
        if (match) {
          const [, compartment, item] = match;
          const key = `${compartment}:${item}`;
          defectMap.set(key, issue);
        }
      }

      return defectMap;
    } catch (error) {
      console.error('Error fetching existing defects:', error);
      throw error;
    }
  }

  /**
   * Submit a checklist inspection
   * Creates new issues for new defects, adds comments to existing ones
   */
  async submitChecklist(submission: InspectionSubmission): Promise<void> {
    const { user, apparatus, date, defects } = submission;

    // Get existing open defects for this apparatus
    const existingDefects = await this.checkExistingDefects(apparatus);

    // Process each defect
    for (const defect of defects) {
      const defectKey = `${defect.compartment}:${defect.item}`;
      const existingIssue = existingDefects.get(defectKey);

      if (existingIssue) {
        // Add comment to existing issue
        await this.addCommentToDefect(
          existingIssue.number,
          user.name,
          user.rank,
          date,
          defect.notes
        );
      } else {
        // Create new issue
        await this.createDefectIssue(
          apparatus,
          defect.compartment,
          defect.item,
          defect.status,
          defect.notes,
          user.name,
          user.rank,
          date
        );
      }
    }

    // Create a log entry (closed issue) for the completed inspection
    await this.createLogEntry(submission);
  }

  /**
   * Create a new defect issue
   */
  private async createDefectIssue(
    apparatus: string,
    compartment: string,
    item: string,
    status: 'missing' | 'damaged',
    notes: string,
    reportedBy: string,
    rank: string,
    date: string
  ): Promise<void> {
    const title = `[${apparatus}] ${compartment}: ${item} - ${status === 'missing' ? 'Missing' : 'Damaged'}`;
    const body = `
## Defect Report

**Apparatus:** ${apparatus}
**Compartment:** ${compartment}
**Item:** ${item}
**Status:** ${status === 'missing' ? '❌ Missing' : '⚠️ Damaged'}
**Reported By:** ${reportedBy} (${rank})
**Date:** ${date}

### Notes
${notes}

---
*This issue was automatically created by the MBFD Checkout System.*
    `.trim();

    const labels = ['Defect', apparatus];
    if (status === 'damaged') {
      labels.push('Damaged');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/issues`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ title, body, labels }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create issue: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error creating defect issue:', error);
      throw error;
    }
  }

  /**
   * Add a verification comment to an existing defect
   */
  private async addCommentToDefect(
    issueNumber: number,
    verifiedBy: string,
    rank: string,
    date: string,
    notes?: string
  ): Promise<void> {
    const body = `
### Verification Update

**Verified still present by:** ${verifiedBy} (${rank})
**Date:** ${date}

${notes ? `**Additional Notes:** ${notes}` : ''}

---
*This comment was automatically added by the MBFD Checkout System.*
    `.trim();

    try {
      const response = await fetch(`${API_BASE_URL}/issues/${issueNumber}/comments`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ body }),
      });

      if (!response.ok) {
        throw new Error(`Failed to add comment: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error adding comment to issue:', error);
      throw error;
    }
  }

  /**
   * Create a log entry for completed inspection
   */
  private async createLogEntry(submission: InspectionSubmission): Promise<void> {
    const { user, apparatus, date, items } = submission;
    
    const title = `[${apparatus}] Daily Inspection - ${date}`;
    const body = `
## Daily Inspection Log

**Apparatus:** ${apparatus}
**Conducted By:** ${user.name} (${user.rank})
**Date:** ${date}

### Summary
- **Total Items Checked:** ${items.length}
- **Issues Found:** ${submission.defects.length}

${submission.defects.length > 0 ? `
### Issues Reported
${submission.defects.map(d => `- ${d.compartment}: ${d.item} - ${d.status === 'missing' ? '❌ Missing' : '⚠️ Damaged'}`).join('\n')}`
 : '✅ All items present and working'}

---
*This inspection log was automatically created by the MBFD Checkout System.*
    `.trim();

    try {
      const response = await fetch(`${API_BASE_URL}/issues`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          title,
          body,
          labels: ['Log', apparatus],
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create log: ${response.statusText}`);
      }

      const issue = await response.json();

      // Immediately close the issue to mark it as a log entry
      await fetch(`${API_BASE_URL}/issues/${issue.number}`, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify({ state: 'closed' }),
      });
    } catch (error) {
      console.error('Error creating log entry:', error);
      throw error;
    }
  }

  /**
   * Fetch all open defects across all apparatus (ADMIN ONLY)
   */
  async getAllDefects(): Promise<Defect[]> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/issues?state=open&labels=Defect&per_page=100`,
        {
          method: 'GET',
          headers: this.getHeaders(true), // Admin request
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized. Please enter the admin password.');
        }
        throw new Error(`Failed to fetch defects: ${response.statusText}`);
      }

      const issues: GitHubIssue[] = await response.json();
      return issues.map(issue => this.parseDefectFromIssue(issue));
    } catch (error) {
      console.error('Error fetching all defects:', error);
      throw error;
    }
  }

  /**
   * Parse a defect object from a GitHub issue
   */
  private parseDefectFromIssue(issue: GitHubIssue): Defect {
    const match = issue.title.match(/\[(.+)\]\s+(.+):\s+(.+?)\s+-\s+(Missing|Damaged)/);
    
    let apparatus = 'Rescue 1';
    let compartment = 'Unknown';
    let item = 'Unknown';
    let status: 'missing' | 'damaged' = 'missing';

    if (match) {
      apparatus = match[1];
      compartment = match[2];
      item = match[3];
      const statusStr = match[4];
      status = statusStr.toLowerCase() as 'missing' | 'damaged';
    }

    return {
      issueNumber: issue.number,
      apparatus,
      compartment,
      item,
      status,
      notes: issue.body || '',
      reportedBy: issue.user?.login || 'Unknown',
      reportedAt: issue.created_at,
      updatedAt: issue.updated_at,
      resolved: false,
    };
  }

  /**
   * Resolve a defect by closing the issue (ADMIN ONLY)
   */
  async resolveDefect(issueNumber: number, resolutionNote: string, resolvedBy: string): Promise<void> {
    try {
      // Add resolution comment
      await fetch(`${API_BASE_URL}/issues/${issueNumber}/comments`, {
        method: 'POST',
        headers: this.getHeaders(true), // Admin request
        body: JSON.stringify({
          body: `
## ✅ Defect Resolved

**Resolved By:** ${resolvedBy}
**Date:** ${new Date().toISOString()}

### Resolution
${resolutionNote}

---
*This defect was marked as resolved via the MBFD Admin Dashboard.*
          `.trim(),
        }),
      });

      // Close the issue
      const response = await fetch(`${API_BASE_URL}/issues/${issueNumber}`, {
        method: 'PATCH',
        headers: this.getHeaders(true), // Admin request
        body: JSON.stringify({
          state: 'closed',
          labels: ['Defect', 'Resolved'],
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized. Please enter the admin password.');
        }
        throw new Error(`Failed to resolve defect: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error resolving defect:', error);
      throw error;
    }
  }

  /**
   * Get fleet status summary (ADMIN ONLY)
   */
  async getFleetStatus(): Promise<Map<string, number>> {
    const defects = await this.getAllDefects();
    const statusMap = new Map<string, number>();

    // Initialize with Rescue 1 only (since we only support it now)
    statusMap.set('Rescue 1', 0);

    // Count defects per apparatus
    defects.forEach(defect => {
      const current = statusMap.get(defect.apparatus) || 0;
      statusMap.set(defect.apparatus, current + 1);
    });

    return statusMap;
  }
}

// Export a singleton instance
export const githubService = new GitHubService();