'use client'

import { useState, useEffect } from 'react'
import { LeadForm } from '@/components/LeadForm'
import { LeadsList } from '@/components/LeadsList'
import { LeadDetails } from '@/components/LeadDetails'
import { Dashboard } from '@/components/Dashboard'
import { Database, Plus, List, LayoutDashboard } from 'lucide-react'

export default function Home() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'leads' | 'add'>('dashboard')
  const [selectedLead, setSelectedLead] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleLeadCreated = () => {
    setRefreshKey((prev) => prev + 1)
    setActiveTab('leads')
  }

  const handleLeadSelected = (leadId: string) => {
    setSelectedLead(leadId)
  }

  const handleBackToList = () => {
    setSelectedLead(null)
    setRefreshKey((prev) => prev + 1)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Database className="w-8 h-8 text-primary-600" />
              <h1 className="text-2xl font-bold text-gray-900">
                AI Lead Generation Platform
              </h1>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition ${
                  activeTab === 'dashboard'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </button>
              <button
                onClick={() => setActiveTab('leads')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition ${
                  activeTab === 'leads'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <List className="w-4 h-4" />
                <span>Leads</span>
              </button>
              <button
                onClick={() => setActiveTab('add')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition ${
                  activeTab === 'add'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>Add Lead</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {selectedLead ? (
          <LeadDetails leadId={selectedLead} onBack={handleBackToList} />
        ) : (
          <>
            {activeTab === 'dashboard' && <Dashboard refreshKey={refreshKey} />}
            {activeTab === 'leads' && (
              <LeadsList
                refreshKey={refreshKey}
                onLeadSelected={handleLeadSelected}
              />
            )}
            {activeTab === 'add' && <LeadForm onLeadCreated={handleLeadCreated} />}
          </>
        )}
      </div>
    </main>
  )
}
