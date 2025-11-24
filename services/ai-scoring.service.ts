import OpenAI from 'openai'
import {
  LeadScoringResult,
  EnrichedInsights,
  WebsiteTechData,
  SocialMediaInfo,
  CompanyEnrichmentData,
  NormalizedData,
} from '@/types'

export class AILeadScoringService {
  private openai: OpenAI

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }

  async scoreAndEnrichLead(
    companyName: string,
    websiteTech?: WebsiteTechData,
    socialMediaInfo?: SocialMediaInfo,
    companyInfo?: CompanyEnrichmentData,
    normalizedData?: NormalizedData,
    whatsappEnabled?: boolean
  ): Promise<{
    scoring: LeadScoringResult
    insights: EnrichedInsights
  }> {
    try {
      // Calculate base scores
      const baseScores = this.calculateBaseScores(
        websiteTech,
        socialMediaInfo,
        companyInfo,
        normalizedData,
        whatsappEnabled
      )

      // Generate AI-enhanced scoring and insights
      const aiAnalysis = await this.generateAIAnalysis(
        companyName,
        websiteTech,
        socialMediaInfo,
        companyInfo,
        normalizedData,
        baseScores,
        whatsappEnabled
      )

      return aiAnalysis
    } catch (error) {
      console.error('AI scoring error:', error)

      // Fallback to basic scoring if AI fails
      return this.generateBasicScoring(
        companyName,
        websiteTech,
        socialMediaInfo,
        companyInfo,
        normalizedData,
        whatsappEnabled
      )
    }
  }

  private calculateBaseScores(
    websiteTech?: WebsiteTechData,
    socialMediaInfo?: SocialMediaInfo,
    companyInfo?: CompanyEnrichmentData,
    normalizedData?: NormalizedData,
    whatsappEnabled?: boolean
  ): {
    website_quality: number
    social_activity: number
    tech_readiness: number
    business_maturity: number
    automation_potential: number
  } {
    // Website quality (0-20)
    let websiteQuality = 0
    if (websiteTech) {
      if (websiteTech.platform && websiteTech.platform !== 'Unknown') websiteQuality += 5
      if (websiteTech.cms) websiteQuality += 3
      if (websiteTech.ecommerce) websiteQuality += 5
      if (websiteTech.analytics.length > 0) websiteQuality += 3
      if (websiteTech.frameworks.length > 0) websiteQuality += 4
    }

    // Social activity (0-20)
    let socialActivity = normalizedData?.social_presence_score || 0
    socialActivity = Math.round((socialActivity / 100) * 20)

    // Tech readiness (0-20)
    let techReadiness = 0
    if (websiteTech?.technologies.length || 0 > 5) techReadiness += 5
    if (websiteTech?.ecommerce) techReadiness += 5
    if (websiteTech?.analytics.length || 0 > 0) techReadiness += 5
    if (normalizedData?.tech_stack.length || 0 > 0) techReadiness += 5

    // Business maturity (0-20)
    let businessMaturity = 0
    if (companyInfo?.employees) {
      if (companyInfo.employees > 100) businessMaturity += 10
      else if (companyInfo.employees > 50) businessMaturity += 7
      else if (companyInfo.employees > 10) businessMaturity += 5
      else businessMaturity += 2
    }
    if (companyInfo?.founded) {
      const age = new Date().getFullYear() - parseInt(companyInfo.founded)
      if (age > 10) businessMaturity += 5
      else if (age > 5) businessMaturity += 3
      else businessMaturity += 1
    }
    if (companyInfo?.funding) businessMaturity += 5

    // Automation potential (0-20)
    let automationPotential = 0
    if (!whatsappEnabled) automationPotential += 5 // Opportunity to adopt
    if (websiteTech?.ecommerce) automationPotential += 5
    if ((socialMediaInfo && Object.keys(socialMediaInfo).length > 2)) automationPotential += 5
    if (websiteTech?.analytics.length || 0 > 0) automationPotential += 3
    if (!websiteTech?.platform || websiteTech.platform === 'Custom') automationPotential += 2

    return {
      website_quality: Math.min(websiteQuality, 20),
      social_activity: Math.min(socialActivity, 20),
      tech_readiness: Math.min(techReadiness, 20),
      business_maturity: Math.min(businessMaturity, 20),
      automation_potential: Math.min(automationPotential, 20),
    }
  }

  private async generateAIAnalysis(
    companyName: string,
    websiteTech?: WebsiteTechData,
    socialMediaInfo?: SocialMediaInfo,
    companyInfo?: CompanyEnrichmentData,
    normalizedData?: NormalizedData,
    baseScores?: any,
    whatsappEnabled?: boolean
  ): Promise<{
    scoring: LeadScoringResult
    insights: EnrichedInsights
  }> {
    const prompt = this.buildScoringPrompt(
      companyName,
      websiteTech,
      socialMediaInfo,
      companyInfo,
      normalizedData,
      baseScores,
      whatsappEnabled
    )

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content:
            'You are a B2B lead scoring expert specializing in evaluating companies for marketing automation, WhatsApp Business API, and digital transformation opportunities. Analyze the provided data and return a JSON response with lead scoring and insights.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    })

    const response = JSON.parse(completion.choices[0].message.content || '{}')

    return {
      scoring: {
        score: response.score || this.calculateTotalScore(baseScores),
        potential_tag: response.potential_tag || this.determinePotentialTag(response.score || 50),
        scoring_factors: baseScores || response.scoring_factors,
        notes: response.notes || '',
        recommended_approach: response.recommended_approach || '',
      },
      insights: {
        suggested_sales_approach: response.suggested_sales_approach || '',
        likely_pain_points: response.likely_pain_points || [],
        marketing_readiness: response.marketing_readiness || '',
        competitor_activity: response.competitor_activity,
        industry_trends: response.industry_trends || [],
        automation_opportunities: response.automation_opportunities || [],
        next_steps: response.next_steps || [],
      },
    }
  }

  private buildScoringPrompt(
    companyName: string,
    websiteTech?: WebsiteTechData,
    socialMediaInfo?: SocialMediaInfo,
    companyInfo?: CompanyEnrichmentData,
    normalizedData?: NormalizedData,
    baseScores?: any,
    whatsappEnabled?: boolean
  ): string {
    return `
Analyze this company for lead scoring and provide actionable insights:

Company: ${companyName}
Industry: ${companyInfo?.category || normalizedData?.industry_category || 'Unknown'}
Size: ${companyInfo?.size || 'Unknown'} (${companyInfo?.employees || 'Unknown'} employees)
Location: ${companyInfo?.address || normalizedData?.location?.city || 'Unknown'}

Website Technology:
- Platform: ${websiteTech?.platform || 'Unknown'}
- Tech Stack: ${normalizedData?.tech_stack.join(', ') || 'Unknown'}
- E-commerce: ${websiteTech?.ecommerce || 'No'}
- Analytics: ${websiteTech?.analytics.join(', ') || 'None'}

Social Media Presence:
- Platforms: ${socialMediaInfo ? Object.keys(socialMediaInfo).join(', ') : 'None'}
- Social Score: ${normalizedData?.social_presence_score || 0}/100

WhatsApp Business: ${whatsappEnabled ? 'Yes' : 'No'}

Base Scoring Factors (0-20 each):
- Website Quality: ${baseScores?.website_quality || 0}
- Social Activity: ${baseScores?.social_activity || 0}
- Tech Readiness: ${baseScores?.tech_readiness || 0}
- Business Maturity: ${baseScores?.business_maturity || 0}
- Automation Potential: ${baseScores?.automation_potential || 0}

Provide a comprehensive analysis in JSON format with the following structure:
{
  "score": <total score 0-100>,
  "potential_tag": "<HIGH|MEDIUM|LOW>",
  "notes": "<2-3 sentence summary of why this score was given>",
  "recommended_approach": "<specific sales approach recommendation>",
  "suggested_sales_approach": "<detailed sales strategy>",
  "likely_pain_points": ["<pain point 1>", "<pain point 2>", ...],
  "marketing_readiness": "<assessment of their marketing maturity>",
  "competitor_activity": "<insights about competition if applicable>",
  "industry_trends": ["<trend 1>", "<trend 2>", ...],
  "automation_opportunities": ["<opportunity 1>", "<opportunity 2>", ...],
  "next_steps": ["<action 1>", "<action 2>", ...]
}
`
  }

  private generateBasicScoring(
    companyName: string,
    websiteTech?: WebsiteTechData,
    socialMediaInfo?: SocialMediaInfo,
    companyInfo?: CompanyEnrichmentData,
    normalizedData?: NormalizedData,
    whatsappEnabled?: boolean
  ): {
    scoring: LeadScoringResult
    insights: EnrichedInsights
  } {
    const scoringFactors = this.calculateBaseScores(
      websiteTech,
      socialMediaInfo,
      companyInfo,
      normalizedData,
      whatsappEnabled
    )

    const totalScore = this.calculateTotalScore(scoringFactors)
    const potentialTag = this.determinePotentialTag(totalScore)

    return {
      scoring: {
        score: totalScore,
        potential_tag: potentialTag,
        scoring_factors: scoringFactors,
        notes: this.generateBasicNotes(totalScore, scoringFactors),
        recommended_approach: this.generateBasicApproach(potentialTag, whatsappEnabled),
      },
      insights: {
        suggested_sales_approach: this.generateBasicApproach(potentialTag, whatsappEnabled),
        likely_pain_points: this.generateBasicPainPoints(websiteTech, whatsappEnabled),
        marketing_readiness: this.assessMarketingReadiness(scoringFactors),
        automation_opportunities: this.identifyAutomationOpportunities(
          websiteTech,
          socialMediaInfo,
          whatsappEnabled
        ),
        next_steps: this.generateBasicNextSteps(potentialTag),
      },
    }
  }

  private calculateTotalScore(factors: any): number {
    return Math.round(
      factors.website_quality +
        factors.social_activity +
        factors.tech_readiness +
        factors.business_maturity +
        factors.automation_potential
    )
  }

  private determinePotentialTag(score: number): 'HIGH' | 'MEDIUM' | 'LOW' {
    if (score >= 70) return 'HIGH'
    if (score >= 40) return 'MEDIUM'
    return 'LOW'
  }

  private generateBasicNotes(score: number, factors: any): string {
    if (score >= 70) {
      return `Strong lead with high potential. Excellent ${
        factors.business_maturity > 15 ? 'business maturity' : 'digital presence'
      } and clear automation opportunities.`
    } else if (score >= 40) {
      return `Moderate potential. Shows promise in ${
        factors.tech_readiness > 10 ? 'technology adoption' : 'business development'
      }. May benefit from targeted outreach.`
    } else {
      return `Lower priority lead. Limited digital presence or early-stage business. May require more nurturing.`
    }
  }

  private generateBasicApproach(tag: string, whatsappEnabled?: boolean): string {
    const approaches = {
      HIGH: `Direct outreach recommended. Focus on ROI and efficiency gains. ${
        !whatsappEnabled ? 'Emphasize WhatsApp Business API benefits.' : 'Offer advanced automation features.'
      }`,
      MEDIUM: `Educational approach. Share case studies and demonstrate value. Build relationship before hard sell.`,
      LOW: `Long-term nurturing strategy. Provide valuable content and wait for growth signals.`,
    }
    return approaches[tag as keyof typeof approaches]
  }

  private generateBasicPainPoints(websiteTech?: WebsiteTechData, whatsappEnabled?: boolean): string[] {
    const painPoints: string[] = []

    if (!whatsappEnabled) {
      painPoints.push('Missing modern customer communication channels')
    }
    if (!websiteTech?.analytics || websiteTech.analytics.length === 0) {
      painPoints.push('Limited data-driven decision making')
    }
    if (!websiteTech?.ecommerce) {
      painPoints.push('Potential for online sales channel expansion')
    }

    return painPoints.length > 0 ? painPoints : ['General business growth and efficiency']
  }

  private assessMarketingReadiness(factors: any): string {
    const total = factors.social_activity + factors.tech_readiness
    if (total >= 30) return 'High - Active digital presence and tech-savvy'
    if (total >= 15) return 'Medium - Some digital adoption, room for improvement'
    return 'Low - Early stages of digital marketing adoption'
  }

  private identifyAutomationOpportunities(
    websiteTech?: WebsiteTechData,
    socialMediaInfo?: SocialMediaInfo,
    whatsappEnabled?: boolean
  ): string[] {
    const opportunities: string[] = []

    if (!whatsappEnabled) {
      opportunities.push('WhatsApp Business API for customer communication')
    }
    if (websiteTech?.ecommerce) {
      opportunities.push('E-commerce automation and cart recovery')
    }
    if (socialMediaInfo && Object.keys(socialMediaInfo).length > 0) {
      opportunities.push('Social media management and engagement automation')
    }
    if (!websiteTech?.analytics || websiteTech.analytics.length === 0) {
      opportunities.push('Marketing analytics and tracking implementation')
    }

    return opportunities
  }

  private generateBasicNextSteps(tag: string): string[] {
    const steps = {
      HIGH: [
        'Schedule discovery call within 48 hours',
        'Prepare customized solution proposal',
        'Share relevant case studies',
        'Offer free consultation or demo',
      ],
      MEDIUM: [
        'Add to nurture campaign',
        'Send educational content',
        'Monitor for buying signals',
        'Schedule follow-up in 2 weeks',
      ],
      LOW: [
        'Add to long-term nurture list',
        'Send monthly newsletter',
        'Track for company growth indicators',
        'Re-evaluate in 3 months',
      ],
    }
    return steps[tag as keyof typeof steps]
  }
}
