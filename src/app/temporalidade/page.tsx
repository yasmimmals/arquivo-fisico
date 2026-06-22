'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface ItemTemporalidade {
  id: string
  nomeDocumento: string
  dataInicial: string
  dataVencimento: string
  caixa: { etiqueta: string; cliente: { nome: string }; endereco: { enderecoCodigo: string } | null }
  tipoDocumento: { nome: string; tempGuardaAnos: number }
}

interface DadosAPI {
  vencidos: ItemTemporalidade[]
  aVencer: ItemTemporalidade[]
  regulares: ItemTemporalidade[]
}

const NAV = [
  { icon: '📊', label: 'Dashboard', href: '/dashboard' },
  { icon: '🔍', label: 'Busca', href: '/' },
  { icon: '📦', label: 'Caixas', href: '/caixas' },
  { icon: '📬', label: 'Solicitações', href: '/solicitacoes' },
  { icon: '🗺️', label: 'Mapa do barracão', href: '/mapa' },
  { icon: '📋', label: 'Tipos de documento', href: '/tipos-documento' },
  { icon: '⏳', label: 'Temporalidade', href: '/temporalidade' },
  { icon: '⚙️', label: 'Administração', href: '/admin' },
]

export default function TemporalidadePage() {
  const router = useRouter()
  const [dados, setDados] = useState<DadosAPI>({ vencidos: [], aVencer: [], regulares: [] })
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    async function carregar() {
      const res = await fetch('/api/temporalidade')
      const json = await res.json()
      setDados(json)
      setCarregando(false)
    }
    carregar()
  }, [])

  function formatarData(dataISO: string) {
    return new Date(dataISO).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
  }

  // Componente interno para os Cards para o código não ficar gigante
  const CardDocumento = ({ item, cor, badgeBg, badgeText }: { item: ItemTemporalidade, cor: string, badgeBg: string, badgeText: string }) => (
    <div style={{ background: '#fff', border: `1px solid ${cor}40`, borderLeft: `4px solid ${cor}`, borderRadius: 8, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>📦 Caixa {item.caixa.etiqueta}</div>
        <span style={{ fontSize: 11, fontWeight: 700, color: cor, background: badgeBg, padding: '2px 8px', borderRadius: 12 }}>
          {badgeText}
        </span>
      </div>
      
      <div style={{ fontSize: 13, color: '#475569', marginBottom: 4 }}>🏢 {item.caixa.cliente.nome}</div>
      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>📄 {item.tipoDocumento.nome}</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, background: '#f8fafc', padding: 8, borderRadius: 6, border: '1px solid #f1f5f9' }}>
        <div>
          <div style={{ fontSize: 10, textTransform: 'uppercase', color: '#94a3b8', fontWeight: 600 }}>Início do Doc</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>{formatarData(item.dataInicial)}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, textTransform: 'uppercase', color: '#94a3b8', fontWeight: 600 }}>Vencimento Legal</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: cor }}>{formatarData(item.dataVencimento)}</div>
        </div>
      </div>
      
      {item.caixa.endereco && (
        <div style={{ marginTop: 10, fontSize: 11, color: '#2563eb', fontFamily: 'monospace' }}>
          📍 Local: {item.caixa.endereco.enderecoCodigo}
        </div>
      )}
    </div>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Sidebar */}
      <aside style={{ width: 220, minWidth: 220, background: '#fff', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', padding: '24px 0', minHeight: '100vh' }}>
        <div style={{ padding: '0 20px 24px', borderBottom: '1px solid #f3f4f6', marginBottom: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>📦 ArquivoFísico</div>
          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>Sistema de gestão</div>
        </div>
        {NAV.map(item => {
          const active = item.href === '/temporalidade'
          return (
            <button key={item.label} onClick={() => router.push(item.href)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px', fontSize: 14, fontWeight: active ? 600 : 400, color: active ? '#2563eb' : '#6b7280', background: active ? '#eff6ff' : 'transparent', borderLeft: active ? '3px solid #2563eb' : '3px solid transparent', cursor: 'pointer', border: 'none', width: '100%', textAlign: 'left' }}>
              {item.icon} {item.label}
            </button>
          )
        })}
      </aside>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <header style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>Controle de Temporalidade e Expurgo</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>Acompanhe o prazo legal dos documentos para descarte de caixas</div>
          </div>
          
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 16px' }}>
              <div style={{ fontSize: 11, color: '#dc2626', textTransform: 'uppercase', fontWeight: 600 }}>Prontos p/ Expurgo</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#991b1b' }}>{dados.vencidos.length} docs</div>
            </div>
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '8px 16px' }}>
              <div style={{ fontSize: 11, color: '#d97706', textTransform: 'uppercase', fontWeight: 600 }}>Atenção (90 dias)</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#b45309' }}>{dados.aVencer.length} docs</div>
            </div>
          </div>
        </header>

        <div style={{ flex: 1, padding: '24px 32px', overflowX: 'auto', display: 'flex', gap: 24, alignItems: 'flex-start' }}>
          {carregando ? (
            <div style={{ margin: 'auto', color: '#9ca3af' }}>Analisando datas do barracão...</div>
          ) : (
            <>
              {/* Coluna 1: Vencidos */}
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, width: 340, minWidth: 340, maxHeight: '100%', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '16px', borderBottom: '1px solid #fecaca', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#991b1b' }}>🔴 Prontos p/ Expurgo</div>
                  <div style={{ background: '#fee2e2', color: '#dc2626', padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 700 }}>{dados.vencidos.length}</div>
                </div>
                <div style={{ padding: 16, overflowY: 'auto', flex: 1 }}>
                  {dados.vencidos.length === 0 ? <div style={{ textAlign: 'center', color: '#f87171', fontSize: 13, padding: 20 }}>Nenhum documento vencido!</div> : null}
                  {dados.vencidos.map(item => (
                    <CardDocumento key={item.id} item={item} cor="#dc2626" badgeBg="#fee2e2" badgeText="VENCIDO" />
                  ))}
                </div>
              </div>

              {/* Coluna 2: A Vencer */}
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, width: 340, minWidth: 340, maxHeight: '100%', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '16px', borderBottom: '1px solid #fde68a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#b45309' }}>🟡 Próximos 90 dias</div>
                  <div style={{ background: '#fef3c7', color: '#d97706', padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 700 }}>{dados.aVencer.length}</div>
                </div>
                <div style={{ padding: 16, overflowY: 'auto', flex: 1 }}>
                  {dados.aVencer.length === 0 ? <div style={{ textAlign: 'center', color: '#fbbf24', fontSize: 13, padding: 20 }}>Nenhum vencimento próximo.</div> : null}
                  {dados.aVencer.map(item => (
                    <CardDocumento key={item.id} item={item} cor="#d97706" badgeBg="#fef3c7" badgeText="A VENCER" />
                  ))}
                </div>
              </div>

              {/* Coluna 3: Regulares */}
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, width: 340, minWidth: 340, maxHeight: '100%', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '16px', borderBottom: '1px solid #bbf7d0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#15803d' }}>🟢 Regulares (No Prazo)</div>
                  <div style={{ background: '#dcfce7', color: '#16a34a', padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 700 }}>{dados.regulares.length}</div>
                </div>
                <div style={{ padding: 16, overflowY: 'auto', flex: 1 }}>
                  {dados.regulares.length === 0 ? <div style={{ textAlign: 'center', color: '#4ade80', fontSize: 13, padding: 20 }}>Sem documentos no prazo.</div> : null}
                  {dados.regulares.map(item => (
                    <CardDocumento key={item.id} item={item} cor="#16a34a" badgeBg="#dcfce7" badgeText="NO PRAZO" />
                  ))}
                </div>
              </div>
              
            </>
          )}
        </div>
      </main>
    </div>
  )
}