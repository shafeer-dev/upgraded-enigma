import { NormalizedData, WebsiteTechData, SocialMediaInfo, CompanyEnrichmentData } from '@/types'
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js'
import validator from 'validator'

export class DataNormalizationService {
  normalizeLeadData(
    companyName: string,
    websiteUrl?: string,
    location?: string,
    websiteTech?: WebsiteTechData,
    socialMediaInfo?: SocialMediaInfo,
    companyInfo?: CompanyEnrichmentData,
    whatsappEnabled?: boolean
  ): NormalizedData {
    return {
      company_name: this.normalizeCompanyName(companyName),
      website_url: this.normalizeUrl(websiteUrl),
      formatted_phone: this.normalizePhone(companyInfo?.phone),
      formatted_email: this.normalizeEmail(companyInfo?.email),
      location: this.parseLocation(location || companyInfo?.address),
      industry_category: this.normalizeIndustry(companyInfo?.category),
      tech_stack: this.normalizeTechStack(websiteTech),
      social_presence_score: this.calculateSocialScore(socialMediaInfo),
      whatsapp_enabled: whatsappEnabled || false,
    }
  }

  private normalizeCompanyName(name: string): string {
    // Remove common suffixes and clean up
    let normalized = name.trim()

    // Remove legal entity suffixes
    const suffixes = [
      'Inc.',
      'Inc',
      'LLC',
      'Ltd.',
      'Ltd',
      'Corporation',
      'Corp.',
      'Corp',
      'Company',
      'Co.',
      'Co',
      'LP',
      'LLP',
      'PLC',
    ]

    suffixes.forEach((suffix) => {
      const regex = new RegExp(`\\s*,?\\s*${suffix}\\s*$`, 'i')
      normalized = normalized.replace(regex, '')
    })

    // Capitalize properly
    return normalized
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }

  private normalizeUrl(url?: string): string | undefined {
    if (!url) return undefined

    try {
      // Ensure URL has protocol
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url
      }

      const parsed = new URL(url)

      // Remove trailing slash
      let normalized = parsed.origin + parsed.pathname
      if (normalized.endsWith('/')) {
        normalized = normalized.slice(0, -1)
      }

      return normalized
    } catch {
      return url
    }
  }

  private normalizePhone(phone?: string): string | undefined {
    if (!phone) return undefined

    try {
      if (isValidPhoneNumber(phone)) {
        const parsed = parsePhoneNumber(phone)
        return parsed.formatInternational()
      }

      // Try to clean and parse
      let cleaned = phone.replace(/[\s\-\(\)\.]/g, '')
      if (!cleaned.startsWith('+')) {
        cleaned = '+' + cleaned
      }

      if (isValidPhoneNumber(cleaned)) {
        const parsed = parsePhoneNumber(cleaned)
        return parsed.formatInternational()
      }

      return phone
    } catch {
      return phone
    }
  }

  private normalizeEmail(email?: string): string | undefined {
    if (!email) return undefined

    try {
      const normalized = email.trim().toLowerCase()

      if (validator.isEmail(normalized)) {
        return normalized
      }

      return undefined
    } catch {
      return undefined
    }
  }

  private parseLocation(location?: string): {
    city?: string
    state?: string
    country?: string
  } {
    if (!location) return {}

    // Split by comma and clean parts
    const parts = location.split(',').map((p) => p.trim())

    if (parts.length === 1) {
      return { city: parts[0] }
    } else if (parts.length === 2) {
      return {
        city: parts[0],
        country: parts[1],
      }
    } else if (parts.length >= 3) {
      return {
        city: parts[0],
        state: parts[1],
        country: parts[parts.length - 1],
      }
    }

    return {}
  }

  private normalizeIndustry(category?: string): string | undefined {
    if (!category) return undefined

    // Map to standard industry categories
    const industryMap: Record<string, string> = {
      'technology': 'Technology',
      'tech': 'Technology',
      'software': 'Software & Technology',
      'saas': 'Software & Technology',
      'ecommerce': 'E-commerce & Retail',
      'retail': 'E-commerce & Retail',
      'healthcare': 'Healthcare',
      'health': 'Healthcare',
      'finance': 'Financial Services',
      'fintech': 'Financial Services',
      'education': 'Education',
      'manufacturing': 'Manufacturing',
      'consulting': 'Professional Services',
      'marketing': 'Marketing & Advertising',
      'advertising': 'Marketing & Advertising',
      'real estate': 'Real Estate',
      'hospitality': 'Hospitality & Tourism',
      'food': 'Food & Beverage',
      'automotive': 'Automotive',
      'construction': 'Construction',
      'legal': 'Legal Services',
    }

    const normalized = category.toLowerCase()

    for (const [key, value] of Object.entries(industryMap)) {
      if (normalized.includes(key)) {
        return value
      }
    }

    return category
  }

  private normalizeTechStack(websiteTech?: WebsiteTechData): string[] {
    if (!websiteTech) return []

    const techStack: Set<string> = new Set()

    // Add platform
    if (websiteTech.platform && websiteTech.platform !== 'Unknown') {
      techStack.add(websiteTech.platform)
    }

    // Add CMS
    if (websiteTech.cms) {
      techStack.add(websiteTech.cms)
    }

    // Add ecommerce
    if (websiteTech.ecommerce) {
      techStack.add(websiteTech.ecommerce)
    }

    // Add frameworks
    websiteTech.frameworks?.forEach((fw) => techStack.add(fw))

    // Add analytics (limit to major ones)
    websiteTech.analytics
      ?.filter((a) => ['Google Analytics', 'Facebook Pixel', 'Mixpanel', 'Segment'].includes(a))
      .forEach((a) => techStack.add(a))

    return Array.from(techStack)
  }

  private calculateSocialScore(socialMediaInfo?: SocialMediaInfo): number {
    if (!socialMediaInfo) return 0

    let score = 0
    const platforms = Object.keys(socialMediaInfo)

    // 10 points per platform
    score += platforms.length * 10

    // Additional points for metrics
    platforms.forEach((platform) => {
      const metrics = socialMediaInfo[platform as keyof SocialMediaInfo]

      if (metrics?.verified) {
        score += 15
      }

      if (metrics?.followers) {
        if (metrics.followers > 100000) score += 20
        else if (metrics.followers > 10000) score += 15
        else if (metrics.followers > 1000) score += 10
        else score += 5
      }
    })

    return Math.min(score, 100)
  }

  validateLeadData(data: any): {
    isValid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    // Required fields
    if (!data.company_name || data.company_name.trim() === '') {
      errors.push('Company name is required')
    }

    // Validate URL if provided
    if (data.website_url) {
      try {
        new URL(data.website_url.startsWith('http') ? data.website_url : 'https://' + data.website_url)
      } catch {
        errors.push('Invalid website URL')
      }
    }

    // Validate email if provided
    if (data.email && !validator.isEmail(data.email)) {
      errors.push('Invalid email address')
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  sanitizeForDatabase(data: any): any {
    // Remove any potentially harmful characters or scripts
    const sanitized: any = {}

    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        // Remove HTML tags and scripts
        sanitized[key] = value
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<[^>]+>/g, '')
          .trim()
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeForDatabase(value)
      } else {
        sanitized[key] = value
      }
    }

    return sanitized
  }
}
