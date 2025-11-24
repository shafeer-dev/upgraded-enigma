import { NextRequest, NextResponse } from 'next/server'
import { LeadProcessingService } from '@/services/lead-processing.service'

const leadService = new LeadProcessingService()

// GET /api/leads/[id] - Get a specific lead
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const lead = await leadService.getLeadById(params.id)

    if (!lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: lead,
    })
  } catch (error: any) {
    console.error('Get lead API error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch lead',
        message: error.message,
      },
      { status: 500 }
    )
  }
}

// DELETE /api/leads/[id] - Delete a specific lead
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await leadService.deleteLeadById(params.id)

    return NextResponse.json({
      success: true,
      message: 'Lead deleted successfully',
    })
  } catch (error: any) {
    console.error('Delete lead API error:', error)
    return NextResponse.json(
      {
        error: 'Failed to delete lead',
        message: error.message,
      },
      { status: 500 }
    )
  }
}

// PUT /api/leads/[id] - Update lead score
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await leadService.updateLeadScore(params.id)

    const updatedLead = await leadService.getLeadById(params.id)

    return NextResponse.json({
      success: true,
      message: 'Lead score updated successfully',
      data: updatedLead,
    })
  } catch (error: any) {
    console.error('Update lead API error:', error)
    return NextResponse.json(
      {
        error: 'Failed to update lead',
        message: error.message,
      },
      { status: 500 }
    )
  }
}
