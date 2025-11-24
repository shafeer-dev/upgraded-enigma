import { NextRequest, NextResponse } from 'next/server'
import { LeadProcessingService } from '@/services/lead-processing.service'
import { LeadInput } from '@/types'

const leadService = new LeadProcessingService()

// POST /api/leads - Create and process a new lead
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    if (!body.company_name) {
      return NextResponse.json(
        { error: 'company_name is required' },
        { status: 400 }
      )
    }

    const input: LeadInput = {
      company_name: body.company_name,
      website_url: body.website_url,
      location: body.location,
      industry: body.industry,
    }

    // Process the lead
    const result = await leadService.processLead(input)

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error: any) {
    console.error('Lead processing API error:', error)
    return NextResponse.json(
      {
        error: 'Failed to process lead',
        message: error.message,
      },
      { status: 500 }
    )
  }
}

// GET /api/leads - Get all leads with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

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

    return NextResponse.json({
      success: true,
      count: leads.length,
      data: leads,
    })
  } catch (error: any) {
    console.error('Get leads API error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch leads',
        message: error.message,
      },
      { status: 500 }
    )
  }
}
