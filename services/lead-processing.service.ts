import { prisma } from '@/lib/prisma'
import { WebsiteTechService } from './website-tech.service'
import { SocialMediaService } from './social-media.service'
import { WhatsAppService } from './whatsapp.service'
import { CompanyEnrichmentService } from './company-enrichment.service'
import { DataNormalizationService } from './data-normalization.service'
import { AILeadScoringService } from './ai-scoring.service'
import {
  LeadInput,
  LeadProcessingResult,
  ProcessingStep,
  WebsiteTechData,
  SocialMediaInfo,
  WhatsAppStatus,
  CompanyEnrichmentData,
  NormalizedData,
} from '@/types'

export class LeadProcessingService {
  private websiteTechService: WebsiteTechService
  private socialMediaService: SocialMediaService
  private whatsappService: WhatsAppService
  private companyEnrichmentService: CompanyEnrichmentService
  private normalizationService: DataNormalizationService
  private aiScoringService: AILeadScoringService

  constructor() {
    this.websiteTechService = new WebsiteTechService()
    this.socialMediaService = new SocialMediaService()
    this.whatsappService = new WhatsAppService()
    this.companyEnrichmentService = new CompanyEnrichmentService()
    this.normalizationService = new DataNormalizationService()
    this.aiScoringService = new AILeadScoringService()
  }

  async processLead(input: LeadInput): Promise<LeadProcessingResult> {
    const steps: ProcessingStep[] = []

    // Create lead in database
    const lead = await prisma.lead.create({
      data: {
        companyName: input.company_name,
        websiteUrl: input.website_url,
        location: input.location,
        industry: input.industry,
        status: 'PROCESSING',
      },
    })

    let websiteTech: WebsiteTechData | undefined
    let socialMediaInfo: SocialMediaInfo | undefined
    let whatsappStatus: WhatsAppStatus | undefined
    let companyInfo: CompanyEnrichmentData | undefined
    let normalizedData: NormalizedData | undefined

    try {
      // Step 1: Fetch Website Technology
      const techStep = await this.executeStep('Fetch Website Technology', async () => {
        if (input.website_url) {
          return await this.websiteTechService.detectTechnology(input.website_url)
        }
        return undefined
      })
      steps.push(techStep)
      websiteTech = techStep.data

      // Step 2: Fetch Social Media Presence
      const socialStep = await this.executeStep('Fetch Social Media Presence', async () => {
        return await this.socialMediaService.fetchSocialMediaPresence(
          input.company_name,
          input.website_url
        )
      })
      steps.push(socialStep)
      socialMediaInfo = socialStep.data

      // Step 3: Fetch & Enrich Company Info
      const enrichStep = await this.executeStep('Fetch & Enrich Company Info', async () => {
        return await this.companyEnrichmentService.enrichCompanyData(
          input.company_name,
          input.website_url,
          input.location,
          input.industry
        )
      })
      steps.push(enrichStep)
      companyInfo = enrichStep.data

      // Extract phone and email if not found
      if (input.website_url) {
        if (!companyInfo?.phone) {
          const phone = await this.whatsappService.extractPhoneFromWebsite(input.website_url)
          if (phone && companyInfo) {
            companyInfo.phone = phone
          }
        }
        if (!companyInfo?.email) {
          const email = await this.companyEnrichmentService.extractEmailFromWebsite(
            input.website_url
          )
          if (email && companyInfo) {
            companyInfo.email = email
          }
        }
      }

      // Step 4: Check WhatsApp Business API
      const whatsappStep = await this.executeStep('Check WhatsApp Business API', async () => {
        return await this.whatsappService.checkWhatsAppStatus(
          companyInfo?.phone,
          input.company_name
        )
      })
      steps.push(whatsappStep)
      whatsappStatus = whatsappStep.data

      // Step 5: Normalize Data
      const normalizeStep = await this.executeStep('Normalize Data', async () => {
        return this.normalizationService.normalizeLeadData(
          input.company_name,
          input.website_url,
          input.location,
          websiteTech,
          socialMediaInfo,
          companyInfo,
          whatsappStatus?.has_business_account
        )
      })
      steps.push(normalizeStep)
      normalizedData = normalizeStep.data

      // Step 6: AI Lead Scoring
      const scoringStep = await this.executeStep('AI Lead Scoring', async () => {
        return await this.aiScoringService.scoreAndEnrichLead(
          input.company_name,
          websiteTech,
          socialMediaInfo,
          companyInfo,
          normalizedData,
          whatsappStatus?.has_business_account
        )
      })
      steps.push(scoringStep)
      const { scoring, insights } = scoringStep.data

      // Update lead in database with all collected data
      await prisma.lead.update({
        where: { id: lead.id },
        data: {
          status: 'COMPLETED',
          websiteTech: websiteTech as any,
          socialMediaInfo: socialMediaInfo as any,
          whatsappStatus: whatsappStatus as any,
          companyInfo: companyInfo as any,
          normalizedData: normalizedData as any,
          leadScore: scoring?.score,
          potentialTag: scoring?.potential_tag,
          scoringNotes: scoring?.notes,
          enrichedInsights: insights as any,
          lastProcessedAt: new Date(),
        },
      })

      // Create history entry
      await prisma.leadHistory.create({
        data: {
          leadId: lead.id,
          action: 'LEAD_PROCESSED',
          newScore: scoring?.score,
          changes: {
            steps: steps.map((s) => s.step_name),
            completed_at: new Date(),
          } as any,
        },
      })

      return {
        lead_id: lead.id,
        company_name: input.company_name,
        website_url: input.website_url,
        website_tech: websiteTech,
        social_media_info: socialMediaInfo,
        whatsapp_status: whatsappStatus,
        company_info_enriched: companyInfo,
        normalized_data: normalizedData,
        lead_score_and_notes: scoring,
        enriched_insights: insights,
        processing_steps: steps,
        status: 'completed',
        created_at: lead.createdAt,
        updated_at: new Date(),
      }
    } catch (error) {
      console.error('Lead processing error:', error)

      // Update lead status to failed
      await prisma.lead.update({
        where: { id: lead.id },
        data: {
          status: 'FAILED',
          processingStage: steps[steps.length - 1]?.step_name || 'Unknown',
        },
      })

      throw error
    }
  }

  async processBatchLeads(inputs: LeadInput[]): Promise<LeadProcessingResult[]> {
    const results: LeadProcessingResult[] = []

    // Process leads with concurrency limit
    const concurrencyLimit = 3
    for (let i = 0; i < inputs.length; i += concurrencyLimit) {
      const batch = inputs.slice(i, i + concurrencyLimit)
      const batchResults = await Promise.allSettled(
        batch.map((input) => this.processLead(input))
      )

      batchResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          results.push(result.value)
        } else {
          console.error('Batch processing error:', result.reason)
        }
      })
    }

    return results
  }

  async retryFailedLead(leadId: string): Promise<LeadProcessingResult> {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
    })

    if (!lead) {
      throw new Error('Lead not found')
    }

    const input: LeadInput = {
      company_name: lead.companyName,
      website_url: lead.websiteUrl || undefined,
      location: lead.location || undefined,
      industry: lead.industry || undefined,
    }

    // Delete the old lead and reprocess
    await prisma.lead.delete({
      where: { id: leadId },
    })

    return await this.processLead(input)
  }

  async updateLeadScore(leadId: string): Promise<void> {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
    })

    if (!lead) {
      throw new Error('Lead not found')
    }

    const previousScore = lead.leadScore

    // Re-run scoring with existing data
    const { scoring, insights } = await this.aiScoringService.scoreAndEnrichLead(
      lead.companyName,
      lead.websiteTech as any,
      lead.socialMediaInfo as any,
      lead.companyInfo as any,
      lead.normalizedData as any,
      (lead.whatsappStatus as any)?.has_business_account
    )

    await prisma.lead.update({
      where: { id: leadId },
      data: {
        leadScore: scoring.score,
        potentialTag: scoring.potential_tag,
        scoringNotes: scoring.notes,
        enrichedInsights: insights as any,
        lastProcessedAt: new Date(),
      },
    })

    // Create history entry
    await prisma.leadHistory.create({
      data: {
        leadId: lead.id,
        action: 'SCORE_UPDATED',
        previousScore,
        newScore: scoring.score,
        changes: {
          reason: 'Manual score update',
        } as any,
      },
    })
  }

  private async executeStep<T>(
    stepName: string,
    fn: () => Promise<T>
  ): Promise<ProcessingStep> {
    const step: ProcessingStep = {
      step_name: stepName,
      status: 'in_progress',
      started_at: new Date(),
    }

    try {
      const data = await fn()
      step.status = 'completed'
      step.data = data
      step.completed_at = new Date()
    } catch (error: any) {
      step.status = 'failed'
      step.error = error.message
      step.completed_at = new Date()
      console.error(`Step "${stepName}" failed:`, error)
    }

    return step
  }

  async getLeadById(leadId: string) {
    return await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        history: {
          orderBy: { performedAt: 'desc' },
          take: 10,
        },
      },
    })
  }

  async getAllLeads(filters?: {
    status?: string
    potentialTag?: string
    minScore?: number
    maxScore?: number
  }) {
    const where: any = {}

    if (filters?.status) {
      where.status = filters.status
    }
    if (filters?.potentialTag) {
      where.potentialTag = filters.potentialTag
    }
    if (filters?.minScore !== undefined || filters?.maxScore !== undefined) {
      where.leadScore = {}
      if (filters.minScore !== undefined) {
        where.leadScore.gte = filters.minScore
      }
      if (filters.maxScore !== undefined) {
        where.leadScore.lte = filters.maxScore
      }
    }

    return await prisma.lead.findMany({
      where,
      orderBy: { leadScore: 'desc' },
    })
  }

  async deleteLeadById(leadId: string) {
    return await prisma.lead.delete({
      where: { id: leadId },
    })
  }
}
