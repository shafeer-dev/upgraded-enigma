import { NextRequest, NextResponse } from 'next/server'
import { LeadProcessingService } from '@/services/lead-processing.service'
import { ExportService } from '@/services/export.service'

const leadService = new LeadProcessingService()
const exportService = new ExportService()

// GET /api/leads/export?format=csv|pdf
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'csv'

    // Get filters
    const filters = {
      status: searchParams.get('status') || undefined,
      potentialTag: searchParams.get('potentialTag') || undefined,
      minScore: searchParams.get('minScore')
        ? parseInt(searchParams.get('minScore')!)
        : undefined,
      maxScore: searchParams.get('maxScore')
        ? parseInt(searchParams.get('maxScore')!)
        : undefined,
    }

    const leads = await leadService.getAllLeads(filters)

    if (format === 'csv') {
      const csvContent = await exportService.exportToCSV(leads)

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="leads-export-${Date.now()}.csv"`,
        },
      })
    } else if (format === 'pdf') {
      const pdfBuffer = await exportService.exportToPDF(leads)

      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="leads-report-${Date.now()}.pdf"`,
        },
      })
    } else {
      return NextResponse.json(
        { error: 'Invalid format. Use csv or pdf' },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error('Export API error:', error)
    return NextResponse.json(
      {
        error: 'Failed to export leads',
        message: error.message,
      },
      { status: 500 }
    )
  }
}
