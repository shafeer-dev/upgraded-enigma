import { ApiClient } from '@/lib/api-client'
import { WhatsAppStatus } from '@/types'
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js'

export class WhatsAppService {
  private whatsappClient: ApiClient | null = null

  constructor() {
    const apiKey = process.env.WHATSAPP_API_KEY
    if (apiKey) {
      this.whatsappClient = new ApiClient('https://graph.facebook.com/v18.0', {
        'Authorization': `Bearer ${apiKey}`,
      })
    }
  }

  async checkWhatsAppStatus(phoneNumber?: string, companyName?: string): Promise<WhatsAppStatus> {
    const defaultStatus: WhatsAppStatus = {
      has_business_account: false,
      is_verified: false,
      api_enabled: false,
    }

    if (!phoneNumber) {
      return defaultStatus
    }

    try {
      // Normalize phone number
      const normalizedPhone = this.normalizePhoneNumber(phoneNumber)

      if (!normalizedPhone) {
        return defaultStatus
      }

      // Check if WhatsApp API is available
      if (this.whatsappClient) {
        return await this.checkWithWhatsAppAPI(normalizedPhone, companyName)
      }

      // Fallback to basic check
      return {
        ...defaultStatus,
        phone_number: normalizedPhone,
      }
    } catch (error) {
      console.error('WhatsApp status check error:', error)
      return defaultStatus
    }
  }

  private async checkWithWhatsAppAPI(
    phoneNumber: string,
    companyName?: string
  ): Promise<WhatsAppStatus> {
    try {
      const businessId = process.env.WHATSAPP_BUSINESS_ID

      if (!businessId) {
        throw new Error('WhatsApp Business ID not configured')
      }

      // Check if phone number is registered on WhatsApp Business
      const response = await this.whatsappClient!.post<any>(
        `/${businessId}/phone_numbers`,
        {
          phone_number: phoneNumber,
        }
      )

      const hasBusinessAccount = response.verified_name !== undefined
      const isVerified = response.code_verification_status === 'VERIFIED'

      return {
        has_business_account: hasBusinessAccount,
        is_verified: isVerified,
        phone_number: phoneNumber,
        business_name: response.verified_name || companyName,
        api_enabled: response.quality_rating !== undefined,
      }
    } catch (error: any) {
      // If error indicates phone not found, return negative status
      if (error.response?.status === 404 || error.response?.data?.error) {
        return {
          has_business_account: false,
          is_verified: false,
          phone_number: phoneNumber,
          api_enabled: false,
        }
      }

      throw error
    }
  }

  private normalizePhoneNumber(phoneNumber: string): string | null {
    try {
      // Remove common formatting characters
      let cleaned = phoneNumber.replace(/[\s\-\(\)\.]/g, '')

      // If it doesn't start with +, try to parse it
      if (!cleaned.startsWith('+')) {
        cleaned = '+' + cleaned
      }

      // Validate and parse
      if (isValidPhoneNumber(cleaned)) {
        const parsed = parsePhoneNumber(cleaned)
        return parsed.format('E.164')
      }

      return null
    } catch {
      return null
    }
  }

  async extractPhoneFromWebsite(websiteUrl: string): Promise<string | null> {
    try {
      const axios = require('axios')
      const cheerio = require('cheerio')

      const response = await axios.get(websiteUrl, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; LeadGenBot/1.0)',
        },
      })

      const $ = cheerio.load(response.data)
      const text = $('body').text()

      // Phone number patterns
      const patterns = [
        /\+?\d{1,3}[\s\-]?\(?\d{1,4}\)?[\s\-]?\d{1,4}[\s\-]?\d{1,9}/g,
        /tel:([+\d\-\s\(\)]+)/gi,
        /\d{3}[\s\-]?\d{3}[\s\-]?\d{4}/g,
      ]

      for (const pattern of patterns) {
        const matches = text.match(pattern)
        if (matches && matches.length > 0) {
          // Return the first valid phone number found
          for (const match of matches) {
            const normalized = this.normalizePhoneNumber(match.replace('tel:', ''))
            if (normalized) {
              return normalized
            }
          }
        }
      }

      // Also check href attributes
      $('a[href^="tel:"]').each((_, elem) => {
        const href = $(elem).attr('href')
        if (href) {
          const phone = href.replace('tel:', '')
          const normalized = this.normalizePhoneNumber(phone)
          if (normalized) {
            return normalized
          }
        }
      })

      return null
    } catch (error) {
      console.error('Phone extraction error:', error)
      return null
    }
  }
}
