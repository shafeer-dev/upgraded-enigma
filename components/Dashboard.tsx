'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, Users, Target, Award } from 'lucide-react'

interface DashboardProps {
  refreshKey: number
}

export function Dashboard({ refreshKey }: DashboardProps) {
  const [stats, setStats] = useState({
    total: 0,
    high: 0,
    medium: 0,
    low: 0,
    avgScore: 0,
    completed: 0,
    processing: 0,
  })
  const [topLeads, setTopLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [refreshKey])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/leads')
      const data = await response.json()

      if (data.success) {
        const leads = data.data

        const high = leads.filter((l: any) => l.potentialTag === 'HIGH').length
        const medium = leads.filter((l: any) => l.potentialTag === 'MEDIUM').length
        const low = leads.filter((l: any) => l.potentialTag === 'LOW').length
        const completed = leads.filter((l: any) => l.status === 'COMPLETED').length
        const processing = leads.filter((l: any) => l.status === 'PROCESSING').length

        const avgScore =
          leads.reduce((sum: number, l: any) => sum + (l.leadScore || 0), 0) /
            leads.length || 0

        setStats({
          total: leads.length,
          high,
          medium,
          low,
          avgScore: Math.round(avgScore),
          completed,
          processing,
        })

        const top = leads
          .filter((l: any) => l.status === 'COMPLETED')
          .sort((a: any, b: any) => (b.leadScore || 0) - (a.leadScore || 0))
          .slice(0, 5)

        setTopLeads(top)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading dashboard...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Leads</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <div className="bg-primary-100 p-3 rounded-full">
              <Users className="w-8 h-8 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">High Potential</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{stats.high}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <Target className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Average Score</p>
              <p className="text-3xl font-bold text-primary-600 mt-1">{stats.avgScore}</p>
            </div>
            <div className="bg-primary-100 p-3 rounded-full">
              <TrendingUp className="w-8 h-8 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">{stats.completed}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Award className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Potential Distribution */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Lead Potential Distribution</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-4xl font-bold text-green-600">{stats.high}</div>
            <div className="text-sm text-gray-600 mt-1">High Potential</div>
            <div className="mt-2 bg-green-200 rounded-full h-2">
              <div
                className="bg-green-600 rounded-full h-2"
                style={{ width: `${(stats.high / stats.total) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="text-center">
            <div className="text-4xl font-bold text-yellow-600">{stats.medium}</div>
            <div className="text-sm text-gray-600 mt-1">Medium Potential</div>
            <div className="mt-2 bg-yellow-200 rounded-full h-2">
              <div
                className="bg-yellow-600 rounded-full h-2"
                style={{ width: `${(stats.medium / stats.total) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="text-center">
            <div className="text-4xl font-bold text-red-600">{stats.low}</div>
            <div className="text-sm text-gray-600 mt-1">Low Potential</div>
            <div className="mt-2 bg-red-200 rounded-full h-2">
              <div
                className="bg-red-600 rounded-full h-2"
                style={{ width: `${(stats.low / stats.total) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Leads */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Top 5 Leads</h2>
        {topLeads.length === 0 ? (
          <p className="text-gray-600 text-center py-8">
            No completed leads yet. Add leads to see them here.
          </p>
        ) : (
          <div className="space-y-3">
            {topLeads.map((lead, index) => (
              <div
                key={lead.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
              >
                <div className="flex items-center space-x-4">
                  <div className="bg-primary-100 text-primary-600 font-bold w-8 h-8 rounded-full flex items-center justify-center">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{lead.companyName}</div>
                    <div className="text-sm text-gray-600">{lead.industry || 'N/A'}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary-600">
                      {lead.leadScore || 0}
                    </div>
                    <div className="text-xs text-gray-600">Score</div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      lead.potentialTag === 'HIGH'
                        ? 'bg-green-100 text-green-800'
                        : lead.potentialTag === 'MEDIUM'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {lead.potentialTag}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
