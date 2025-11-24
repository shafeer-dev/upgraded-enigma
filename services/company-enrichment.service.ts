import { ApiClient } from '@/lib/api-client'
import { CompanyEnrichmentData } from '@/types'
import axios from 'axios'

export class CompanyEnrichmentService {
  private clearbitClient: ApiClient | null = null

  constructor() {
    const apiKey = process.env.CLEARBIT_API_KEY
    if (apiKey) {
      this.clearbitClient = new ApiClient('https://company.clearbit.com', {
        'Authorization': `Bearer ${apiKey}`,
      })
    }
  }

  async enrichCompanyData(
    companyName: string,
    websiteUrl?: string,
    location?: string,
    industry?: string
  ): Promise<CompanyEnrichmentData> {
    let enrichedData: CompanyEnrichmentData = {
      name: companyName,
      domain: websiteUrl ? new URL(websiteUrl).hostname : undefined,
    }

    try {
      // Try Clearbit first
      if (this.clearbitClient && websiteUrl) {
        const clearbitData = await this.fetchFromClearbit(websiteUrl)
        enrichedData = { ...enrichedData, ...clearbitData }
      }

      // Enhance with additional sources if needed
      if (!enrichedData.description || !enrichedData.employees) {
        const googleData = await this.fetchFromGooglePlaces(companyName, location)
        enrichedData = { ...enrichedData, ...googleData }
      }

      // Add provided data if not already present
      if (location && !enrichedData.address) {
        enrichedData.address = location
      }
      if (industry && !enrichedData.category) {
        enrichedData.category = industry
      }

      return enrichedData
    } catch (error) {
      console.error('Company enrichment error:', error)
      return enrichedData
    }
  }

  private async fetchFromClearbit(websiteUrl: string): Promise<Partial<CompanyEnrichmentData>> {
    try {
      const domain = new URL(websiteUrl).hostname

      const response = await this.clearbitClient!.get<any>(`/v2/companies/find?domain=${domain}`)

      return {
        name: response.name,
        domain: response.domain,
        description: response.description,
        category: response.category?.industry,
        size: this.categorizeCompanySize(response.metrics?.employees),
        founded: response.foundedYear?.toString(),
        employees: response.metrics?.employees,
        revenue: response.metrics?.estimatedAnnualRevenue,
        email: response.email,
        phone: response.phone,
        address: this.formatAddress(response.geo),
        linkedin_url: response.linkedin?.handle
          ? `https://www.linkedin.com/company/${response.linkedin.handle}`
          : undefined,
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.log('Company not found in Clearbit')
        return {}
      }
      throw error
    }
  }

  private async fetchFromGooglePlaces(
    companyName: string,
    location?: string
  ): Promise<Partial<CompanyEnrichmentData>> {
    try {
      // Note: This would require Google Places API key
      // For now, returning empty object as placeholder
      // In production, implement actual Google Places API call

      const query = location ? `${companyName} ${location}` : companyName

      // Placeholder for Google Places API integration
      // const response = await googlePlacesClient.get(`/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(query)}&inputtype=textquery&fields=name,formatted_address,formatted_phone_number,rating,user_ratings_total,website&key=${GOOGLE_API_KEY}`)

      return {}
    } catch (error) {
      console.error('Google Places error:', error)
      return {}
    }
  }

  private async searchLinkedInCompany(companyName: string): Promise<string | undefined> {
    try {
      // Use SerpAPI or direct search to find LinkedIn company page
      const searchQuery = `${companyName} site:linkedin.com/company`

      // This is a simplified version - in production you'd use SerpAPI or LinkedIn API
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`

      // For now, generate a likely URL
      const handle = companyName.toLowerCase().replace(/[^a-z0-9]/g, '-')
      return `https://www.linkedin.com/company/${handle}`
    } catch {
      return undefined
    }
  }

  private categorizeCompanySize(employees?: number): string | undefined {
    if (!employees) return undefined

    if (employees < 10) return 'Small (1-10)'
    if (employees < 50) return 'Small (11-50)'
    if (employees < 200) return 'Medium (51-200)'
    if (employees < 1000) return 'Medium (201-1000)'
    if (employees < 5000) return 'Large (1001-5000)'
    return 'Enterprise (5000+)'
  }

  private formatAddress(geo?: any): string | undefined {
    if (!geo) return undefined

    const parts = [geo.streetAddress, geo.city, geo.state, geo.country].filter(Boolean)

    return parts.length > 0 ? parts.join(', ') : undefined
  }

  async extractEmailFromWebsite(websiteUrl: string): Promise<string | null> {
    try {
      const response = await axios.get(websiteUrl, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; LeadGenBot/1.0)',
        },
      })

      const html = response.data

      // Email patterns
      const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
      const matches = html.match(emailPattern)

      if (matches && matches.length > 0) {
        // Filter out common non-contact emails
        const filtered = matches.filter(
          (email: string) =>
            !email.includes('example.com') &&
            !email.includes('sentry') &&
            !email.includes('wixpress') &&
            !email.includes('jsdelivr')
        )

        // Prioritize contact/info/sales emails
        const priority = filtered.find(
          (email: string) =>
            email.includes('contact') ||
            email.includes('info') ||
            email.includes('sales') ||
            email.includes('hello')
        )

        return priority || filtered[0] || null
      }

      return null
    } catch (error) {
      console.error('Email extraction error:', error)
      return null
    }
  }

  async findKeyContacts(companyName: string, linkedinUrl?: string): Promise<Array<{
    name: string
    role: string
    linkedin?: string
  }>> {
    // This would require LinkedIn Sales Navigator API or web scraping
    // For now, returning empty array as placeholder
    // In production, implement actual contact discovery

    return []
  }
}
