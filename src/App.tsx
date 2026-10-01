import { useState, useCallback } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './views/Dashboard'
import AnalysisView from './views/AnalysisView'
import PropertiesView from './views/PropertiesView'
import FinancingCalculator from './views/FinancingCalculator'
import RentalAnalysis from './views/RentalAnalysis'
import OperationalView from './views/OperationalView'

export type View = 'dashboard' | 'analysis' | 'properties' | 'financing' | 'rental' | 'operational' | 'settings'

// ── Entity 1: Physical asset ──────────────────────────────────────────────
export interface Property {
  id: string
  name: string
  status: 'ready' | 'under_construction'
  city: string
  address?: string
  area: number
  bedrooms: number
  suites: number
  parkingSpots: number
  finishingStandard: string
  constructionYear: string
  monthlyCondo: number
  monthlyIPTU: number
  // Pronto / Usado
  needsRenovation: boolean
  renovationCosts: number
  renovationMonths: number
  // Na Planta
  deliveryMonths: number
  inccRate: number
  installmentsCount: number
  installmentValue: number
  createdAt: string
}

// ── Entity 2: Financial simulation linked to a property ───────────────────
export interface SavedAnalysis {
  id: string
  propertyId: string | null
  name: string
  date: string
  irr: number
  npv: number
  capRate: number
  roi: number
  ownCapital: number
}

// ── localStorage persistence hook ─────────────────────────────────────────
function usePersistedState<T>(key: string, initial: T): [T, (v: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(`vir:${key}`)
      return stored ? (JSON.parse(stored) as T) : initial
    } catch { return initial }
  })

  const set = useCallback(
    (v: T | ((prev: T) => T)) => {
      setState(prev => {
        const next = typeof v === 'function' ? (v as (p: T) => T)(prev) : v
        try { localStorage.setItem(`vir:${key}`, JSON.stringify(next)) } catch { /* quota */ }
        return next
      })
    },
    [key],
  )

  return [state, set]
}

const INITIAL_PROPERTIES: Property[] = [
  {
    id: 'p1',
    name: 'Apto Pinheiros 2Q',
    status: 'ready',
    city: 'São Paulo, SP',
    area: 72,
    bedrooms: 2,
    suites: 1,
    parkingSpots: 1,
    finishingStandard: 'Alto',
    constructionYear: '2019',
    monthlyCondo: 650,
    monthlyIPTU: 220,
    needsRenovation: false,
    renovationCosts: 0,
    renovationMonths: 0,
    deliveryMonths: 0,
    inccRate: 6,
    installmentsCount: 0,
    installmentValue: 0,
    createdAt: '2025-11-10',
  },
  {
    id: 'p2',
    name: 'Studio Airbnb Itaim',
    status: 'ready',
    city: 'São Paulo, SP',
    area: 38,
    bedrooms: 1,
    suites: 1,
    parkingSpots: 0,
    finishingStandard: 'Luxo',
    constructionYear: '2022',
    monthlyCondo: 480,
    monthlyIPTU: 130,
    needsRenovation: true,
    renovationCosts: 28000,
    renovationMonths: 2,
    deliveryMonths: 0,
    inccRate: 6,
    installmentsCount: 0,
    installmentValue: 0,
    createdAt: '2025-11-05',
  },
]

const INITIAL_ANALYSES: SavedAnalysis[] = [
  { id: '1', propertyId: 'p1', name: 'Apto Pinheiros 2Q', date: '2025-11-10', irr: 18.2, npv: 275782, capRate: 10.0, roi: 355.1, ownCapital: 312000 },
  { id: '2', propertyId: 'p2', name: 'Studio Airbnb Itaim', date: '2025-11-05', irr: 22.4, npv: 184300, capRate: 12.5, roi: 428.3, ownCapital: 198000 },
]

export default function App() {
  const [view, setView] = useState<View>('dashboard')
  const [analysisId, setAnalysisId] = useState<string | null>(null)
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const [properties, setProperties] = usePersistedState<Property[]>('properties', INITIAL_PROPERTIES)
  const [savedAnalyses, setSavedAnalyses] = usePersistedState<SavedAnalysis[]>('analyses', INITIAL_ANALYSES)

  function startNewAnalysis(propertyId?: string) {
    setAnalysisId(null)
    setSelectedPropertyId(propertyId ?? null)
    setView('analysis')
    setSidebarOpen(false)
  }

  function openAnalysis(id: string) {
    const a = savedAnalyses.find(x => x.id === id)
    setAnalysisId(id)
    setSelectedPropertyId(a?.propertyId ?? null)
    setView('analysis')
  }

  function duplicateAnalysis(id: string) {
    const src = savedAnalyses.find(a => a.id === id)
    if (!src) return
    setSavedAnalyses(prev => [
      { ...src, id: Date.now().toString(), name: `${src.name} (cópia)`, date: new Date().toISOString().split('T')[0] },
      ...prev,
    ])
  }

  function deleteAnalysis(id: string) {
    setSavedAnalyses(prev => prev.filter(a => a.id !== id))
  }

  function saveAnalysis(a: SavedAnalysis) {
    setSavedAnalyses(prev => {
      const exists = prev.find(p => p.id === a.id)
      return exists ? prev.map(p => p.id === a.id ? a : p) : [a, ...prev]
    })
  }

  function saveProperty(p: Property) {
    setProperties(prev => {
      const exists = prev.find(x => x.id === p.id)
      return exists ? prev.map(x => x.id === p.id ? p : x) : [p, ...prev]
    })
  }

  function deleteProperty(id: string) {
    setProperties(prev => prev.filter(p => p.id !== id))
    // Unlink analyses
    setSavedAnalyses(prev => prev.map(a => a.propertyId === id ? { ...a, propertyId: null } : a))
  }

  function handleNav(v: View) { setView(v); setSidebarOpen(false) }

  const selectedProperty = properties.find(p => p.id === selectedPropertyId) ?? null

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#F8F6F1' }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ background: 'rgba(0,0,0,0.45)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={[
          'fixed inset-y-0 left-0 z-50 md:relative md:flex md:shrink-0',
          'transition-transform duration-300 md:transition-none',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        ].join(' ')}
      >
        <Sidebar
          currentView={view}
          onNav={handleNav}
          onNewAnalysis={() => startNewAnalysis()}
          onClose={() => setSidebarOpen(false)}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(c => !c)}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <div
          className="flex items-center gap-3 px-4 py-3 md:hidden shrink-0"
          style={{ background: '#232E22', borderBottom: '1px solid rgba(248,246,241,0.08)' }}
        >
          <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-lg" style={{ color: 'rgba(248,246,241,0.8)' }}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-sm font-semibold" style={{ color: '#F8F6F1' }}>VIR · Imóveis</span>
          <div className="flex-1" />
          <button
            onClick={() => startNewAnalysis()}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold"
            style={{ background: '#B85B38', color: '#fff' }}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nova
          </button>
        </div>

        <main className="flex-1 overflow-auto">
          {view === 'dashboard' && (
            <Dashboard
              savedAnalyses={savedAnalyses}
              properties={properties}
              onNewAnalysis={() => startNewAnalysis()}
              onOpenAnalysis={openAnalysis}
              onDuplicate={duplicateAnalysis}
              onDelete={deleteAnalysis}
            />
          )}
          {view === 'analysis' && (
            <AnalysisView
              analysisId={analysisId}
              selectedProperty={selectedProperty}
              properties={properties}
              onSave={saveAnalysis}
              onSelectProperty={setSelectedPropertyId}
            />
          )}
          {view === 'properties' && (
            <PropertiesView
              savedAnalyses={savedAnalyses}
              properties={properties}
              onOpenAnalysis={openAnalysis}
              onDelete={deleteAnalysis}
              onDuplicate={duplicateAnalysis}
              onSaveProperty={saveProperty}
              onDeleteProperty={deleteProperty}
              onNewAnalysis={startNewAnalysis}
            />
          )}
          {view === 'financing' && <FinancingCalculator />}
          {view === 'rental' && <RentalAnalysis />}
          {view === 'operational' && <OperationalView />}
          {view === 'settings' && (
            <div className="p-6 md:p-8">
              <h1 className="text-2xl md:text-3xl font-semibold mb-2" style={{ color: '#1F2A1E' }}>Configurações</h1>
              <p style={{ color: '#52504A' }}>Em breve</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
