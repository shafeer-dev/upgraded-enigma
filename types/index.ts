// Core types for the Lead Generation Platform

export interface LeadInput {
  company_name: string
  website_url?: string
  location?: string
  industry?: string
}

export interface WebsiteTechData {
  platform?: string
  technologies: string[]
  cms?: string
  ecommerce?: string
  analytics: string[]
  frameworks: string[]
  hosting?: string
}

export interface SocialMediaMetrics {
  platform: string
  url?: string
  followers?: number
  posts?: number
  engagement_rate?: number
  last_post_date?: string
  verified?: boolean
}

export interface SocialMediaInfo {
  instagram?: SocialMediaMetrics
  facebook?: SocialMediaMetrics
  linkedin?: SocialMediaMetrics
  tiktok?: SocialMediaMetrics
  twitter?: SocialMediaMetrics
}

export interface WhatsAppStatus {
  has_business_account: boolean
  is_verified: boolean
  phone_number?: string
  business_name?: string
  api_enabled: boolean
}

export interface CompanyEnrichmentData {
  name: string
  domain?: string
  description?: string
  category?: string
  size?: string
  founded?: string
  employees?: number
  funding?: string
  revenue?: string
  email?: string
  phone?: string
  address?: string
  linkedin_url?: string
  key_contacts?: Array<{
    name: string
    role: string
    linkedin?: string
  }>
}

export interface NormalizedData {
  company_name: string
  website_url?: string
  formatted_phone?: string
  formatted_email?: string
  location: {
    city?: string
    state?: string
    country?: string
  }
  industry_category?: string
  tech_stack: string[]
  social_presence_score: number
  whatsapp_enabled: boolean
}

export interface LeadScoringResult {
  score: number
  potential_tag: 'HIGH' | 'MEDIUM' | 'LOW'
  scoring_factors: {
    website_quality: number
    social_activity: number
    tech_readiness: number
    business_maturity: number
    automation_potential: number
  }
  notes: string
  recommended_approach: string
}

export interface EnrichedInsights {
  suggested_sales_approach: string
  likely_pain_points: string[]
  marketing_readiness: string
  competitor_activity?: string
  industry_trends?: string[]
  automation_opportunities: string[]
  next_steps: string[]
}

export interface ProcessingStep {
  step_name: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  data?: any
  error?: string
  started_at?: Date
  completed_at?: Date
}

export interface LeadProcessingResult {
  lead_id: string
  company_name: string
  website_url?: string
  website_tech?: WebsiteTechData
  social_media_info?: SocialMediaInfo
  whatsapp_status?: WhatsAppStatus
  company_info_enriched?: CompanyEnrichmentData
  normalized_data?: NormalizedData
  lead_score_and_notes?: LeadScoringResult
  enriched_insights?: EnrichedInsights
  processing_steps: ProcessingStep[]
  status: 'pending' | 'processing' | 'completed' | 'failed'
  created_at: Date
  updated_at: Date
}
