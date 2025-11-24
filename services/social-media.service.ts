import { ApiClient } from '@/lib/api-client'
import { SocialMediaInfo, SocialMediaMetrics } from '@/types'
import axios from 'axios'

export class SocialMediaService {
  private serpApiClient: ApiClient | null = null

  constructor() {
    const apiKey = process.env.SERPAPI_KEY
    if (apiKey) {
      this.serpApiClient = new ApiClient('https://serpapi.com', {})
    }
  }

  async fetchSocialMediaPresence(
    companyName: string,
    websiteUrl?: string
  ): Promise<SocialMediaInfo> {
    const socialMediaInfo: SocialMediaInfo = {}

    try {
      // Search for social media profiles
      const platforms = ['instagram', 'facebook', 'linkedin', 'tiktok', 'twitter']

      await Promise.all(
        platforms.map(async (platform) => {
          try {
            const data = await this.searchPlatformProfile(companyName, platform, websiteUrl)
            if (data) {
              socialMediaInfo[platform as keyof SocialMediaInfo] = data
            }
          } catch (error) {
            console.error(`Error fetching ${platform} data:`, error)
          }
        })
      )

      return socialMediaInfo
    } catch (error) {
      console.error('Social media fetch error:', error)
      return socialMediaInfo
    }
  }

  private async searchPlatformProfile(
    companyName: string,
    platform: string,
    websiteUrl?: string
  ): Promise<SocialMediaMetrics | null> {
    if (this.serpApiClient) {
      return await this.searchWithSerpApi(companyName, platform, websiteUrl)
    } else {
      return await this.searchWithBasicMethod(companyName, platform)
    }
  }

  private async searchWithSerpApi(
    companyName: string,
    platform: string,
    websiteUrl?: string
  ): Promise<SocialMediaMetrics | null> {
    try {
      const query = `${companyName} ${platform}`
      const response = await this.serpApiClient!.get<any>(
        `/search?q=${encodeURIComponent(query)}&engine=google&api_key=${process.env.SERPAPI_KEY}`
      )

      // Parse results to find social media profile
      const organicResults = response.organic_results || []

      for (const result of organicResults) {
        const link = result.link || ''

        if (this.isPlatformUrl(link, platform)) {
          // Extract basic metrics from snippet if available
          const snippet = result.snippet || ''

          return {
            platform,
            url: link,
            followers: this.extractFollowerCount(snippet),
            verified: snippet.toLowerCase().includes('verified'),
          }
        }
      }

      return null
    } catch (error) {
      console.error(`SerpAPI error for ${platform}:`, error)
      return null
    }
  }

  private async searchWithBasicMethod(
    companyName: string,
    platform: string
  ): Promise<SocialMediaMetrics | null> {
    // Generate potential URLs for each platform
    const companyHandle = companyName.toLowerCase().replace(/[^a-z0-9]/g, '')

    const platformUrls: Record<string, string> = {
      instagram: `https://www.instagram.com/${companyHandle}`,
      facebook: `https://www.facebook.com/${companyHandle}`,
      linkedin: `https://www.linkedin.com/company/${companyHandle}`,
      tiktok: `https://www.tiktok.com/@${companyHandle}`,
      twitter: `https://twitter.com/${companyHandle}`,
    }

    const url = platformUrls[platform]
    if (!url) return null

    try {
      // Check if URL exists
      const response = await axios.head(url, {
        timeout: 5000,
        maxRedirects: 5,
        validateStatus: (status) => status < 500,
      })

      if (response.status === 200) {
        return {
          platform,
          url,
        }
      }

      return null
    } catch {
      return null
    }
  }

  private isPlatformUrl(url: string, platform: string): boolean {
    const platformDomains: Record<string, string[]> = {
      instagram: ['instagram.com'],
      facebook: ['facebook.com', 'fb.com'],
      linkedin: ['linkedin.com'],
      tiktok: ['tiktok.com'],
      twitter: ['twitter.com', 'x.com'],
    }

    const domains = platformDomains[platform] || []
    return domains.some((domain) => url.includes(domain))
  }

  private extractFollowerCount(text: string): number | undefined {
    // Try to extract follower count from text
    const patterns = [
      /(\d+(?:\.\d+)?[KMB]?)\s*(?:followers|following)/i,
      /(\d+(?:,\d+)*)\s*(?:followers|following)/i,
    ]

    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match) {
        return this.parseNumber(match[1])
      }
    }

    return undefined
  }

  private parseNumber(value: string): number {
    const cleanValue = value.replace(/,/g, '')

    if (cleanValue.endsWith('K')) {
      return parseFloat(cleanValue) * 1000
    } else if (cleanValue.endsWith('M')) {
      return parseFloat(cleanValue) * 1000000
    } else if (cleanValue.endsWith('B')) {
      return parseFloat(cleanValue) * 1000000000
    }

    return parseFloat(cleanValue)
  }

  calculateSocialPresenceScore(socialMediaInfo: SocialMediaInfo): number {
    let score = 0
    const platforms = Object.keys(socialMediaInfo)

    // Base score for having profiles
    score += platforms.length * 10

    // Additional score for verified accounts
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
}
