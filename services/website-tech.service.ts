import { ApiClient } from '@/lib/api-client'
import { WebsiteTechData } from '@/types'
import * as cheerio from 'cheerio'
import axios from 'axios'

export class WebsiteTechService {
  private builtWithClient: ApiClient | null = null

  constructor() {
    const apiKey = process.env.BUILTWITH_API_KEY
    if (apiKey) {
      this.builtWithClient = new ApiClient('https://api.builtwith.com', {
        'Authorization': `Bearer ${apiKey}`,
      })
    }
  }

  async detectTechnology(websiteUrl: string): Promise<WebsiteTechData> {
    try {
      // Try BuiltWith API first if available
      if (this.builtWithClient) {
        return await this.detectWithBuiltWith(websiteUrl)
      }

      // Fallback to basic detection
      return await this.detectWithScraping(websiteUrl)
    } catch (error) {
      console.error('Technology detection error:', error)
      return await this.detectWithScraping(websiteUrl)
    }
  }

  private async detectWithBuiltWith(websiteUrl: string): Promise<WebsiteTechData> {
    try {
      const domain = new URL(websiteUrl).hostname
      const response = await this.builtWithClient!.get<any>(
        `/v20/api.json?KEY=${process.env.BUILTWITH_API_KEY}&LOOKUP=${domain}`
      )

      const technologies: string[] = []
      const analytics: string[] = []
      const frameworks: string[] = []
      let platform = 'Unknown'
      let cms = undefined
      let ecommerce = undefined
      let hosting = undefined

      if (response.Results && response.Results[0]) {
        const result = response.Results[0]

        // Parse technologies
        if (result.Result?.Paths) {
          result.Result.Paths.forEach((path: any) => {
            if (path.Technologies) {
              path.Technologies.forEach((tech: any) => {
                technologies.push(tech.Name)

                // Categorize
                if (tech.Tag === 'cms') cms = tech.Name
                if (tech.Tag === 'ecommerce') ecommerce = tech.Name
                if (tech.Tag === 'analytics') analytics.push(tech.Name)
                if (tech.Tag === 'framework') frameworks.push(tech.Name)
                if (tech.Tag === 'hosting') hosting = tech.Name
              })
            }
          })
        }

        if (cms) platform = cms
        else if (ecommerce) platform = ecommerce
      }

      return {
        platform,
        technologies,
        cms,
        ecommerce,
        analytics,
        frameworks,
        hosting,
      }
    } catch (error) {
      throw error
    }
  }

  private async detectWithScraping(websiteUrl: string): Promise<WebsiteTechData> {
    try {
      const response = await axios.get(websiteUrl, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; LeadGenBot/1.0)',
        },
      })

      const html = response.data
      const $ = cheerio.load(html)
      const technologies: string[] = []
      const analytics: string[] = []
      const frameworks: string[] = []
      let platform = 'Custom'
      let cms = undefined
      let ecommerce = undefined

      // Detect common platforms
      if (html.includes('wp-content') || html.includes('wordpress')) {
        platform = 'WordPress'
        cms = 'WordPress'
        technologies.push('WordPress')
      }
      if (html.includes('shopify') || html.includes('cdn.shopify')) {
        platform = 'Shopify'
        ecommerce = 'Shopify'
        technologies.push('Shopify')
      }
      if (html.includes('wix.com') || html.includes('_wix')) {
        platform = 'Wix'
        cms = 'Wix'
        technologies.push('Wix')
      }
      if (html.includes('squarespace')) {
        platform = 'Squarespace'
        cms = 'Squarespace'
        technologies.push('Squarespace')
      }

      // Detect analytics
      if (html.includes('google-analytics') || html.includes('gtag')) {
        analytics.push('Google Analytics')
        technologies.push('Google Analytics')
      }
      if (html.includes('facebook-pixel') || html.includes('fbq')) {
        analytics.push('Facebook Pixel')
        technologies.push('Facebook Pixel')
      }

      // Detect frameworks
      if ($('script[src*="react"]').length > 0 || html.includes('__NEXT_DATA__')) {
        frameworks.push('React')
        technologies.push('React')
      }
      if (html.includes('__NEXT_DATA__')) {
        frameworks.push('Next.js')
        technologies.push('Next.js')
      }
      if ($('script[src*="vue"]').length > 0 || html.includes('__VUE__')) {
        frameworks.push('Vue.js')
        technologies.push('Vue.js')
      }
      if ($('script[src*="angular"]').length > 0) {
        frameworks.push('Angular')
        technologies.push('Angular')
      }

      return {
        platform,
        technologies: [...new Set(technologies)],
        cms,
        ecommerce,
        analytics,
        frameworks,
      }
    } catch (error) {
      console.error('Web scraping error:', error)
      return {
        platform: 'Unknown',
        technologies: [],
        analytics: [],
        frameworks: [],
      }
    }
  }

  async isWebsiteAccessible(url: string): Promise<boolean> {
    try {
      const response = await axios.head(url, {
        timeout: 5000,
        validateStatus: (status) => status < 500,
      })
      return response.status < 400
    } catch {
      return false
    }
  }
}
