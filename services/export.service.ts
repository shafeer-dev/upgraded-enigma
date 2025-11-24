import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export class ExportService {
  async exportToCSV(leads: any[]): Promise<string> {
    if (leads.length === 0) {
      return 'No leads to export'
    }

    // CSV headers
    const headers = [
      'Company Name',
      'Website',
      'Location',
      'Industry',
      'Lead Score',
      'Potential',
      'Status',
      'Platform',
      'Tech Stack',
      'Social Score',
      'WhatsApp',
      'Email',
      'Phone',
      'Created At',
    ]

    // CSV rows
    const rows = leads.map((lead) => {
      const normalizedData = lead.normalizedData || {}
      const websiteTech = lead.websiteTech || {}
      const companyInfo = lead.companyInfo || {}

      return [
        this.escapeCSV(lead.companyName),
        this.escapeCSV(lead.websiteUrl || ''),
        this.escapeCSV(normalizedData.location?.city || lead.location || ''),
        this.escapeCSV(normalizedData.industry_category || lead.industry || ''),
        lead.leadScore || 0,
        lead.potentialTag || 'UNKNOWN',
        lead.status || 'PENDING',
        this.escapeCSV(websiteTech.platform || ''),
        this.escapeCSV(normalizedData.tech_stack?.join(', ') || ''),
        normalizedData.social_presence_score || 0,
        normalizedData.whatsapp_enabled ? 'Yes' : 'No',
        this.escapeCSV(normalizedData.formatted_email || ''),
        this.escapeCSV(normalizedData.formatted_phone || ''),
        new Date(lead.createdAt).toLocaleDateString(),
      ]
    })

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n')

    return csvContent
  }

  async exportToPDF(leads: any[]): Promise<Buffer> {
    const doc = new jsPDF()

    // Add title
    doc.setFontSize(18)
    doc.text('Lead Generation Report', 14, 22)

    // Add metadata
    doc.setFontSize(11)
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 32)
    doc.text(`Total Leads: ${leads.length}`, 14, 38)

    // Calculate statistics
    const highPotential = leads.filter((l) => l.potentialTag === 'HIGH').length
    const mediumPotential = leads.filter((l) => l.potentialTag === 'MEDIUM').length
    const lowPotential = leads.filter((l) => l.potentialTag === 'LOW').length
    const avgScore =
      leads.reduce((sum, l) => sum + (l.leadScore || 0), 0) / leads.length || 0

    doc.text(`High Potential: ${highPotential}`, 14, 44)
    doc.text(`Medium Potential: ${mediumPotential}`, 14, 50)
    doc.text(`Low Potential: ${lowPotential}`, 14, 56)
    doc.text(`Average Score: ${avgScore.toFixed(1)}`, 14, 62)

    // Add table
    const tableData = leads.map((lead) => {
      const normalizedData = lead.normalizedData || {}

      return [
        lead.companyName,
        lead.leadScore || 0,
        lead.potentialTag || '-',
        normalizedData.industry_category || lead.industry || '-',
        normalizedData.social_presence_score || 0,
        normalizedData.whatsapp_enabled ? 'Yes' : 'No',
      ]
    })

    autoTable(doc, {
      head: [['Company', 'Score', 'Potential', 'Industry', 'Social', 'WhatsApp']],
      body: tableData,
      startY: 70,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [14, 165, 233] },
    })

    // Convert to buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
    return pdfBuffer
  }

  private escapeCSV(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`
    }
    return value
  }

  async exportLeadDetails(lead: any): Promise<string> {
    const sections = []

    // Header
    sections.push('='.repeat(80))
    sections.push(`LEAD REPORT: ${lead.companyName}`)
    sections.push('='.repeat(80))
    sections.push('')

    // Basic Info
    sections.push('BASIC INFORMATION')
    sections.push('-'.repeat(80))
    sections.push(`Company: ${lead.companyName}`)
    sections.push(`Website: ${lead.websiteUrl || 'N/A'}`)
    sections.push(`Location: ${lead.location || 'N/A'}`)
    sections.push(`Industry: ${lead.industry || 'N/A'}`)
    sections.push(`Status: ${lead.status}`)
    sections.push('')

    // Scoring
    sections.push('LEAD SCORING')
    sections.push('-'.repeat(80))
    sections.push(`Score: ${lead.leadScore || 0}/100`)
    sections.push(`Potential: ${lead.potentialTag || 'N/A'}`)
    sections.push(`Notes: ${lead.scoringNotes || 'N/A'}`)
    sections.push('')

    // Website Technology
    if (lead.websiteTech) {
      const tech = lead.websiteTech
      sections.push('WEBSITE TECHNOLOGY')
      sections.push('-'.repeat(80))
      sections.push(`Platform: ${tech.platform || 'Unknown'}`)
      sections.push(`CMS: ${tech.cms || 'N/A'}`)
      sections.push(`E-commerce: ${tech.ecommerce || 'N/A'}`)
      sections.push(`Technologies: ${tech.technologies?.join(', ') || 'N/A'}`)
      sections.push(`Analytics: ${tech.analytics?.join(', ') || 'N/A'}`)
      sections.push(`Frameworks: ${tech.frameworks?.join(', ') || 'N/A'}`)
      sections.push('')
    }

    // Social Media
    if (lead.socialMediaInfo) {
      sections.push('SOCIAL MEDIA PRESENCE')
      sections.push('-'.repeat(80))
      Object.entries(lead.socialMediaInfo).forEach(([platform, data]: [string, any]) => {
        sections.push(
          `${platform.toUpperCase()}: ${data.url || 'N/A'} (${
            data.followers ? data.followers + ' followers' : 'Unknown'
          })`
        )
      })
      sections.push('')
    }

    // Company Info
    if (lead.companyInfo) {
      const info = lead.companyInfo
      sections.push('COMPANY INFORMATION')
      sections.push('-'.repeat(80))
      sections.push(`Description: ${info.description || 'N/A'}`)
      sections.push(`Size: ${info.size || 'N/A'}`)
      sections.push(`Employees: ${info.employees || 'N/A'}`)
      sections.push(`Founded: ${info.founded || 'N/A'}`)
      sections.push(`Email: ${info.email || 'N/A'}`)
      sections.push(`Phone: ${info.phone || 'N/A'}`)
      sections.push('')
    }

    // Insights
    if (lead.enrichedInsights) {
      const insights = lead.enrichedInsights
      sections.push('AI-GENERATED INSIGHTS')
      sections.push('-'.repeat(80))
      sections.push(`Sales Approach: ${insights.suggested_sales_approach || 'N/A'}`)
      sections.push(`Marketing Readiness: ${insights.marketing_readiness || 'N/A'}`)

      if (insights.likely_pain_points?.length > 0) {
        sections.push('\nPain Points:')
        insights.likely_pain_points.forEach((point: string) => {
          sections.push(`  - ${point}`)
        })
      }

      if (insights.automation_opportunities?.length > 0) {
        sections.push('\nAutomation Opportunities:')
        insights.automation_opportunities.forEach((opp: string) => {
          sections.push(`  - ${opp}`)
        })
      }

      if (insights.next_steps?.length > 0) {
        sections.push('\nNext Steps:')
        insights.next_steps.forEach((step: string) => {
          sections.push(`  - ${step}`)
        })
      }
      sections.push('')
    }

    sections.push('='.repeat(80))
    sections.push(`Generated: ${new Date().toLocaleString()}`)
    sections.push('='.repeat(80))

    return sections.join('\n')
  }
}
