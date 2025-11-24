import { NextRequest, NextResponse } from 'next/server'
import { LeadProcessingService } from '@/services/lead-processing.service'
import { LeadInput } from '@/types'

const leadService = new LeadProcessingService()

// POST /api/leads/batch - Process multiple leads
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!Array.isArray(body.leads)) {
      return NextResponse.json(
        { error: 'leads array is required' },
        { status: 400 }
      )
    }

    // Validate each lead
    const inputs: LeadInput[] = body.leads.map((lead: any) => {
      if (!lead.company_name) {
        throw new Error('Each lead must have a company_name')
      }

      return {
        company_name: lead.company_name,
        website_url: lead.website_url,
        location: lead.location,
        industry: lead.industry,
      }
    })

    // Process batch
    const results = await leadService.processBatchLeads(inputs)

    const successful = results.filter((r) => r.status === 'completed').length
    const failed = results.length - successful

    return NextResponse.json({
      success: true,
      summary: {
        total: results.length,
        successful,
        failed,
      },
      data: results,
    })
  } catch (error: any) {
    console.error('Batch processing API error:', error)
    return NextResponse.json(
      {
        error: 'Failed to process batch',
        message: error.message,
      },
      { status: 500 }
    )
  }
}
