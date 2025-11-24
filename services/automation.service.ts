import { prisma } from '@/lib/prisma'
import { LeadProcessingService } from './lead-processing.service'
import nodemailer from 'nodemailer'
import cron from 'node-cron'

export class AutomationService {
  private leadService: LeadProcessingService
  private emailTransporter: nodemailer.Transporter | null = null

  constructor() {
    this.leadService = new LeadProcessingService()
    this.initializeEmailTransporter()
  }

  private initializeEmailTransporter() {
    if (
      process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS
    ) {
      this.emailTransporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      })
    }
  }

  // Schedule daily lead updates
  scheduleDailyUpdates() {
    // Run every day at 2 AM
    cron.schedule('0 2 * * *', async () => {
      console.log('Running daily lead score updates...')
      await this.updateAllLeadScores()
    })
  }

  // Schedule weekly reports
  scheduleWeeklyReports() {
    // Run every Monday at 9 AM
    cron.schedule('0 9 * * 1', async () => {
      console.log('Sending weekly lead reports...')
      await this.sendWeeklyReport()
    })
  }

  // Update all lead scores
  async updateAllLeadScores() {
    try {
      const leads = await prisma.lead.findMany({
        where: {
          status: 'COMPLETED',
        },
      })

      for (const lead of leads) {
        try {
          await this.leadService.updateLeadScore(lead.id)

          // Create automation task record
          await prisma.automationTask.create({
            data: {
              leadId: lead.id,
              taskType: 'DAILY_UPDATE',
              status: 'COMPLETED',
              executedAt: new Date(),
              result: { success: true } as any,
            },
          })
        } catch (error) {
          console.error(`Failed to update lead ${lead.id}:`, error)

          await prisma.automationTask.create({
            data: {
              leadId: lead.id,
              taskType: 'DAILY_UPDATE',
              status: 'FAILED',
              executedAt: new Date(),
              error: (error as Error).message,
            },
          })
        }
      }

      console.log(`Updated ${leads.length} leads`)
    } catch (error) {
      console.error('Daily update error:', error)
    }
  }

  // Send email to top leads
  async emailTopLeads(recipientEmail: string) {
    if (!this.emailTransporter) {
      throw new Error('Email transporter not configured')
    }

    try {
      // Get top 20 high-potential leads
      const topLeads = await prisma.lead.findMany({
        where: {
          potentialTag: 'HIGH',
          status: 'COMPLETED',
        },
        orderBy: {
          leadScore: 'desc',
        },
        take: 20,
      })

      if (topLeads.length === 0) {
        console.log('No high-potential leads to email')
        return
      }

      // Generate email content
      const emailContent = this.generateTopLeadsEmail(topLeads)

      // Send email
      await this.emailTransporter.sendMail({
        from: process.env.SMTP_USER,
        to: recipientEmail,
        subject: `Top ${topLeads.length} High-Potential Leads - ${new Date().toLocaleDateString()}`,
        html: emailContent,
      })

      // Create automation task record
      await prisma.automationTask.create({
        data: {
          taskType: 'EMAIL_TOP_LEADS',
          status: 'COMPLETED',
          executedAt: new Date(),
          result: {
            recipient: recipientEmail,
            leadCount: topLeads.length,
          } as any,
        },
      })

      console.log(`Sent top leads email to ${recipientEmail}`)
    } catch (error) {
      console.error('Email sending error:', error)

      await prisma.automationTask.create({
        data: {
          taskType: 'EMAIL_TOP_LEADS',
          status: 'FAILED',
          executedAt: new Date(),
          error: (error as Error).message,
        },
      })

      throw error
    }
  }

  // Generate weekly report
  async sendWeeklyReport() {
    if (!this.emailTransporter || !process.env.SMTP_USER) {
      console.log('Email not configured for weekly reports')
      return
    }

    try {
      // Get stats for the past week
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)

      const newLeads = await prisma.lead.count({
        where: {
          createdAt: {
            gte: weekAgo,
          },
        },
      })

      const allLeads = await prisma.lead.findMany({
        where: {
          status: 'COMPLETED',
        },
      })

      const highPotential = allLeads.filter((l) => l.potentialTag === 'HIGH').length
      const avgScore =
        allLeads.reduce((sum, l) => sum + (l.leadScore || 0), 0) / allLeads.length || 0

      // Generate report HTML
      const reportHTML = `
        <h1>Weekly Lead Generation Report</h1>
        <p><strong>Report Period:</strong> ${weekAgo.toLocaleDateString()} - ${new Date().toLocaleDateString()}</p>

        <h2>Summary</h2>
        <ul>
          <li>New Leads This Week: ${newLeads}</li>
          <li>Total Leads: ${allLeads.length}</li>
          <li>High-Potential Leads: ${highPotential}</li>
          <li>Average Lead Score: ${avgScore.toFixed(1)}</li>
        </ul>

        <h2>Top 10 Leads</h2>
        <table border="1" cellpadding="8" style="border-collapse: collapse; width: 100%;">
          <thead>
            <tr>
              <th>Company</th>
              <th>Score</th>
              <th>Potential</th>
              <th>Industry</th>
            </tr>
          </thead>
          <tbody>
            ${allLeads
              .sort((a, b) => (b.leadScore || 0) - (a.leadScore || 0))
              .slice(0, 10)
              .map(
                (lead) => `
              <tr>
                <td>${lead.companyName}</td>
                <td>${lead.leadScore || 0}</td>
                <td>${lead.potentialTag || 'N/A'}</td>
                <td>${lead.industry || 'N/A'}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      `

      // Send email to admin
      await this.emailTransporter.sendMail({
        from: process.env.SMTP_USER,
        to: process.env.SMTP_USER, // Send to self
        subject: `Weekly Lead Generation Report - ${new Date().toLocaleDateString()}`,
        html: reportHTML,
      })

      console.log('Weekly report sent')
    } catch (error) {
      console.error('Weekly report error:', error)
    }
  }

  // Generate AI outreach message for a lead
  async generateOutreachMessage(leadId: string): Promise<string> {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
    })

    if (!lead) {
      throw new Error('Lead not found')
    }

    const insights = lead.enrichedInsights as any
    const companyInfo = lead.companyInfo as any

    const message = `
Subject: Unlock Growth Opportunities for ${lead.companyName}

Hi there,

I came across ${lead.companyName} and was impressed by your ${companyInfo?.category || 'business'} presence${lead.websiteUrl ? ` at ${lead.websiteUrl}` : ''}.

${insights?.suggested_sales_approach || 'I noticed some opportunities where we could help streamline your operations and boost customer engagement.'}

${insights?.automation_opportunities?.length > 0 ? `Specifically, I think you might benefit from:\n${insights.automation_opportunities.slice(0, 2).map((opp: string) => `- ${opp}`).join('\n')}` : ''}

Would you be open to a quick 15-minute call to discuss how we can help ${lead.companyName} ${insights?.likely_pain_points?.[0] || 'achieve your growth goals'}?

Looking forward to connecting!

Best regards
    `.trim()

    // Save to automation tasks
    await prisma.automationTask.create({
      data: {
        leadId: lead.id,
        taskType: 'GENERATE_OUTREACH',
        status: 'COMPLETED',
        executedAt: new Date(),
        result: { message } as any,
      },
    })

    return message
  }

  private generateTopLeadsEmail(leads: any[]): string {
    return `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            table { border-collapse: collapse; width: 100%; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background-color: #0ea5e9; color: white; }
            .high { color: #10b981; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>Top High-Potential Leads</h1>
          <p>Generated: ${new Date().toLocaleString()}</p>

          <table>
            <thead>
              <tr>
                <th>Company</th>
                <th>Score</th>
                <th>Website</th>
                <th>Industry</th>
                <th>Social Score</th>
              </tr>
            </thead>
            <tbody>
              ${leads
                .map(
                  (lead) => `
                <tr>
                  <td><strong>${lead.companyName}</strong></td>
                  <td class="high">${lead.leadScore || 0}</td>
                  <td>${lead.websiteUrl ? `<a href="${lead.websiteUrl}">${lead.websiteUrl}</a>` : 'N/A'}</td>
                  <td>${lead.industry || 'N/A'}</td>
                  <td>${(lead.normalizedData as any)?.social_presence_score || 0}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>

          <p><em>This is an automated email from your Lead Generation Platform.</em></p>
        </body>
      </html>
    `
  }

  // Initialize all scheduled tasks
  initializeScheduledTasks() {
    console.log('Initializing automation schedules...')
    this.scheduleDailyUpdates()
    this.scheduleWeeklyReports()
    console.log('Automation schedules initialized')
  }
}
