'use client'

import { useState, useEffect } from 'react'
import {
  ArrowLeft,
  Globe,
  MapPin,
  Briefcase,
  Star,
  MessageSquare,
  Phone,
  Mail,
} from 'lucide-react'

interface LeadDetailsProps {
  leadId: string
  onBack: () => void
}

export function LeadDetails({ leadId, onBack }: LeadDetailsProps) {
  const [lead, setLead] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLead()
  }, [leadId])

  const fetchLead = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/leads/${leadId}`)
      const data = await response.json()

      if (data.success) {
        setLead(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch lead:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading lead details...</p>
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="text-center py-12 text-gray-600">
        <p>Lead not found</p>
        <button onClick={onBack} className="mt-4 text-primary-600 hover:text-primary-700">
          Go Back
        </button>
      </div>
    )
  }

  const websiteTech = lead.websiteTech || {}
  const socialMedia = lead.socialMediaInfo || {}
  const companyInfo = lead.companyInfo || {}
  const normalizedData = lead.normalizedData || {}
  const insights = lead.enrichedInsights || {}

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-primary-600 hover:text-primary-700 mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Leads</span>
        </button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{lead.companyName}</h1>
            {lead.websiteUrl && (
              <a
                href={lead.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-primary-600 hover:text-primary-700 mt-2"
              >
                <Globe className="w-4 h-4" />
                <span>{lead.websiteUrl}</span>
              </a>
            )}
          </div>

          <div className="text-right">
            <div className="text-4xl font-bold text-primary-600">
              {lead.leadScore || 0}
            </div>
            <div className="text-sm text-gray-600">Lead Score</div>
            <span
              className={`mt-2 inline-block px-4 py-1 rounded-full text-sm font-medium ${
                lead.potentialTag === 'HIGH'
                  ? 'bg-green-100 text-green-800'
                  : lead.potentialTag === 'MEDIUM'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {lead.potentialTag || 'N/A'} POTENTIAL
            </span>
          </div>
        </div>

        {lead.scoringNotes && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">{lead.scoringNotes}</p>
          </div>
        )}
      </div>

      {/* Company Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Company Information</h2>
          <div className="space-y-3">
            {lead.location && (
              <div className="flex items-center space-x-2 text-gray-700">
                <MapPin className="w-5 h-5 text-gray-400" />
                <span>{lead.location}</span>
              </div>
            )}
            {lead.industry && (
              <div className="flex items-center space-x-2 text-gray-700">
                <Briefcase className="w-5 h-5 text-gray-400" />
                <span>{lead.industry}</span>
              </div>
            )}
            {companyInfo.email && (
              <div className="flex items-center space-x-2 text-gray-700">
                <Mail className="w-5 h-5 text-gray-400" />
                <span>{companyInfo.email}</span>
              </div>
            )}
            {companyInfo.phone && (
              <div className="flex items-center space-x-2 text-gray-700">
                <Phone className="w-5 h-5 text-gray-400" />
                <span>{companyInfo.phone}</span>
              </div>
            )}
            {companyInfo.description && (
              <div className="mt-4">
                <p className="text-sm text-gray-600">{companyInfo.description}</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Website Technology</h2>
          <div className="space-y-2">
            <div>
              <span className="text-sm font-medium text-gray-600">Platform:</span>
              <span className="ml-2 text-gray-900">{websiteTech.platform || 'Unknown'}</span>
            </div>
            {websiteTech.cms && (
              <div>
                <span className="text-sm font-medium text-gray-600">CMS:</span>
                <span className="ml-2 text-gray-900">{websiteTech.cms}</span>
              </div>
            )}
            {websiteTech.ecommerce && (
              <div>
                <span className="text-sm font-medium text-gray-600">E-commerce:</span>
                <span className="ml-2 text-gray-900">{websiteTech.ecommerce}</span>
              </div>
            )}
            {normalizedData.tech_stack && normalizedData.tech_stack.length > 0 && (
              <div className="mt-3">
                <span className="text-sm font-medium text-gray-600">Tech Stack:</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {normalizedData.tech_stack.map((tech: string, index: number) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Social Media & Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Social Media Presence</h2>
          <div className="space-y-2">
            <div>
              <span className="text-sm font-medium text-gray-600">Social Score:</span>
              <span className="ml-2 text-gray-900 font-semibold">
                {normalizedData.social_presence_score || 0}/100
              </span>
            </div>
            {Object.keys(socialMedia).length > 0 ? (
              <div className="mt-3 space-y-2">
                {Object.entries(socialMedia).map(([platform, data]: [string, any]) => (
                  <div key={platform} className="flex items-center justify-between">
                    <span className="text-sm capitalize">{platform}:</span>
                    {data.url ? (
                      <a
                        href={data.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:text-primary-700 text-sm"
                      >
                        View Profile
                      </a>
                    ) : (
                      <span className="text-gray-400 text-sm">Found</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 mt-2">No social media profiles found</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Key Insights</h2>
          {insights.likely_pain_points && insights.likely_pain_points.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Pain Points:</h3>
              <ul className="space-y-1">
                {insights.likely_pain_points.map((point: string, index: number) => (
                  <li key={index} className="text-sm text-gray-600 flex items-start">
                    <span className="mr-2">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {insights.automation_opportunities && insights.automation_opportunities.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Automation Opportunities:
              </h3>
              <ul className="space-y-1">
                {insights.automation_opportunities.map((opp: string, index: number) => (
                  <li key={index} className="text-sm text-gray-600 flex items-start">
                    <span className="mr-2">•</span>
                    <span>{opp}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Sales Approach & Next Steps */}
      {insights.suggested_sales_approach && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recommended Sales Approach</h2>
          <p className="text-gray-700">{insights.suggested_sales_approach}</p>

          {insights.next_steps && insights.next_steps.length > 0 && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Next Steps:</h3>
              <ul className="space-y-2">
                {insights.next_steps.map((step: string, index: number) => (
                  <li key={index} className="flex items-start text-gray-700">
                    <span className="mr-2 text-primary-600 font-bold">{index + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
