import type { View } from '../App'

interface Props {
  currentView: View
  onNav: (v: View) => void
  onNewAnalysis: () => void
  onClose?: () => void
  collapsed?: boolean
  onToggleCollapse?: () => void
}

function HouseArrowIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M16 3L3 14h3v14h7v-8h6v8h7V14h3L16 3z" stroke="#B85B38" strokeWidth="2" strokeLinejoin="round" fill="rgba(184,91,56,0.15)" />
      <path d="M16 20v-7m0 0l-3 3m3-3l3 3" stroke="#B85B38" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function NavIcon({ path }: { path: string }) {
  return (
    <svg className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
  )
}

interface NavItem { id: View; label: string; sub?: string; icon: React.ReactNode; group?: string }

const NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Visão Geral',
    sub: 'Portfólio & indicadores',
    icon: <NavIcon path="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />,
  },
  {
    id: 'analysis',
    label: 'Viabilidade de Compra',
    sub: 'Análise VIR · 7 blocos',
    icon: <NavIcon path="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
    group: 'Ferramentas',
  },
  {
    id: 'rental',
    label: 'Análise de Locação',
    sub: 'Airbnb vs. Tradicional',
    icon: <NavIcon path="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />,
  },
  {
    id: 'operational',
    label: 'Gestão Operacional',
    sub: 'DRE Real Airbnb',
    icon: <NavIcon path="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />,
  },
  {
    id: 'financing',
    label: 'Calculadora',
    sub: 'SAC · PRICE · Consórcio',
    icon: <NavIcon path="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />,
  },
  {
    id: 'properties',
    label: 'Meus Imóveis',
    sub: 'Carteira & comparação',
    icon: <NavIcon path="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10" />,
    group: 'Carteira',
  },
]

export default function Sidebar({ currentView, onNav, onNewAnalysis, onClose, collapsed = false, onToggleCollapse }: Props) {
  let lastGroup = ''
  const w = collapsed ? '60px' : '224px'

  return (
    <aside
      className="flex flex-col h-full overflow-hidden transition-[width] duration-200"
      style={{ background: '#232E22', width: w, minWidth: w }}
    >
      {/* Header */}
      <div className={`px-3 pt-5 pb-4 ${collapsed ? 'flex flex-col items-center' : ''}`}>
        {collapsed ? (
          // Collapsed: just the house icon
          <div className="flex flex-col items-center gap-3 mb-4">
            <HouseArrowIcon size={28} />
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="p-1.5 rounded-lg transition-colors"
                title="Expandir menu"
                style={{ color: 'rgba(248,246,241,0.5)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(248,246,241,0.08)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3 mb-4">
            <HouseArrowIcon size={28} />
            <div className="flex-1 min-w-0">
              <div className="text-base font-bold leading-none" style={{ color: '#F8F6F1' }}>VIR</div>
              <div className="text-[10px] mt-0.5 tracking-widest uppercase font-medium" style={{ color: 'rgba(248,246,241,0.40)' }}>
                Imóveis
              </div>
            </div>
            {/* Desktop collapse button */}
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="hidden md:flex p-1.5 rounded-lg transition-colors"
                title="Recolher menu"
                style={{ color: 'rgba(248,246,241,0.45)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(248,246,241,0.08)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7M19 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            {/* Mobile close button */}
            {onClose && (
              <button
                onClick={onClose}
                className="md:hidden p-1.5 rounded-lg"
                style={{ color: 'rgba(248,246,241,0.5)' }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Nova Análise CTA */}
        {collapsed ? (
          <button
            onClick={onNewAnalysis}
            title="Nova Análise"
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
            style={{ background: '#B85B38', color: '#fff' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#A04E2F')}
            onMouseLeave={e => (e.currentTarget.style.background = '#B85B38')}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        ) : (
          <button
            onClick={onNewAnalysis}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-semibold transition-all"
            style={{ background: '#B85B38', color: '#fff' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#A04E2F')}
            onMouseLeave={e => (e.currentTarget.style.background = '#B85B38')}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nova Análise
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className={`flex-1 overflow-y-auto overflow-x-hidden py-1 ${collapsed ? 'px-2' : 'px-3'}`}>
        {NAV_ITEMS.map((item) => {
          const showGroup = !collapsed && item.group && item.group !== lastGroup
          if (item.group && item.group !== lastGroup) lastGroup = item.group!
          const active = currentView === item.id

          return (
            <div key={item.id}>
              {showGroup && (
                <p className="text-[9px] font-bold uppercase tracking-widest px-3 pt-5 pb-2" style={{ color: 'rgba(248,246,241,0.28)' }}>
                  {item.group}
                </p>
              )}
              <button
                onClick={() => onNav(item.id)}
                title={collapsed ? item.label : undefined}
                className={`w-full rounded-lg text-left mb-0.5 transition-all group/nav ${collapsed ? 'flex items-center justify-center p-2.5' : 'flex items-start gap-3 px-3 py-2.5'}`}
                style={{ background: active ? 'rgba(184,91,56,0.18)' : 'transparent' }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(248,246,241,0.06)' }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
              >
                <span className="shrink-0" style={{ color: active ? '#B85B38' : 'rgba(248,246,241,0.48)' }}>
                  {item.icon}
                </span>
                {!collapsed && (
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold leading-tight truncate" style={{ color: active ? '#F8F6F1' : 'rgba(248,246,241,0.72)' }}>
                      {item.label}
                    </div>
                    {item.sub && (
                      <div className="text-[10px] mt-0.5 truncate" style={{ color: 'rgba(248,246,241,0.32)' }}>
                        {item.sub}
                      </div>
                    )}
                  </div>
                )}
              </button>
            </div>
          )
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="px-5 py-4" style={{ borderTop: '1px solid rgba(248,246,241,0.07)', paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
          <p className="text-[10px]" style={{ color: 'rgba(248,246,241,0.28)' }}>VIR · Viabilidade Imobiliária de Renda</p>
          <p className="text-[10px] mt-0.5" style={{ color: 'rgba(248,246,241,0.18)' }}>Análise educacional — sem promessa de retorno</p>
        </div>
      )}
    </aside>
  )
}
