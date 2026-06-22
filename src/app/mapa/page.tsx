'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Endereco {
  id: string
  enderecoCodigo: string
  corredor: string
  prateleira: number
  andar: number
  posicao: number
  caixa: { etiqueta: string; status: string; cliente: { nome: string } } | null
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

export default function MapaPage() {
  const router = useRouter()
  const [enderecos, setEnderecos] = useState<Endereco[]>([])
  const [carregando, setCarregando] = useState(true)
  const [corredorAtivo, setCorredorAtivo] = useState<string>('')
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number; end: Endereco } | null>(null)

  useEffect(() => {
    fetch('/api/mapa')
      .then(r => r.json())
      .then(data => {
        setEnderecos(data.enderecos)
        if (data.enderecos.length > 0) {
          const corredores = [...new Set(data.enderecos.map((e: Endereco) => e.corredor))] as string[]
          setCorredorAtivo(corredores[0])
        }
        setCarregando(false)
      })
  }, [])

  const corredores = [...new Set(enderecos.map(e => e.corredor))].sort()
  const enderecosDoCorredor = enderecos.filter(e => e.corredor === corredorAtivo)
  const prateleiras = [...new Set(enderecosDoCorredor.map(e => e.prateleira))].sort((a, b) => a - b)

  const livres = enderecos.filter(e => !e.caixa).length
  const ocupadas = enderecos.filter(e => e.caixa && e.caixa.status !== 'RETIRADA').length
  const retiradas = enderecos.filter(e => e.caixa && e.caixa.status === 'RETIRADA').length
  const pct = enderecos.length > 0 ? Math.round(((ocupadas + retiradas) / enderecos.length) * 100) : 0

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Sidebar */}
      <aside style={{ width: 220, minWidth: 220, background: '#fff', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', padding: '24px 0', minHeight: '100vh' }}>
        <div style={{ padding: '0 20px 24px', borderBottom: '1px solid #f3f4f6', marginBottom: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>📦 ArquivoFísico</div>
          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>Sistema de gestão</div>
        </div>
        {NAV.map(item => {
          const active = item.href === '/mapa'
          return (
            <button key={item.label} onClick={() => router.push(item.href)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px', fontSize: 14, fontWeight: active ? 600 : 400, color: active ? '#2563eb' : '#6b7280', background: active ? '#eff6ff' : 'transparent', borderLeft: active ? '3px solid #2563eb' : '3px solid transparent', cursor: 'pointer', border: 'none', width: '100%', textAlign: 'left' }}>
              {item.icon} {item.label}
            </button>
          )
        })}
      </aside>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>Mapa do Barracão</div>
            <div style={{ fontSize: 12, color: '#9ca3af' }}>Visualização das posições ocupadas, retiradas e livres</div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '6px 14px', fontSize: 13 }}>
              <span style={{ color: '#15803d', fontWeight: 700 }}>{livres}</span>
              <span style={{ color: '#6b7280', marginLeft: 4 }}>livres</span>
            </div>
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '6px 14px', fontSize: 13 }}>
              <span style={{ color: '#dc2626', fontWeight: 700 }}>{ocupadas}</span>
              <span style={{ color: '#6b7280', marginLeft: 4 }}>ocupadas</span>
            </div>
            <div style={{ background: '#fef9c3', border: '1px solid #fde047', borderRadius: 10, padding: '6px 14px', fontSize: 13 }}>
              <span style={{ color: '#854d0e', fontWeight: 700 }}>{retiradas}</span>
              <span style={{ color: '#6b7280', marginLeft: 4 }}>retiradas</span>
            </div>
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '6px 14px', fontSize: 13 }}>
              <span style={{ color: '#2563eb', fontWeight: 700 }}>{pct}%</span>
              <span style={{ color: '#6b7280', marginLeft: 4 }}>alocação</span>
            </div>
          </div>
        </header>

        <div style={{ flex: 1, padding: 32 }}>
          {carregando ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af' }}>Carregando mapa...</div>
          ) : (
            <>
              {/* Abas de corredor */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
                {corredores.map(c => (
                  <button key={c} onClick={() => setCorredorAtivo(c)}
                    style={{ padding: '8px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', border: '1.5px solid', borderColor: corredorAtivo === c ? '#2563eb' : '#e5e7eb', background: corredorAtivo === c ? '#2563eb' : '#fff', color: corredorAtivo === c ? '#fff' : '#6b7280', transition: 'all 0.15s' }}>
                    Corredor {c}
                  </button>
                ))}
              </div>

              {/* Legenda */}
              <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
                {[
                  { color: '#dcfce7', border: '#86efac', label: 'Livre' },
                  { color: '#fee2e2', border: '#fca5a5', label: 'Ocupada' },
                  { color: '#fef9c3', border: '#fde047', label: 'Retirada' },
                ].map(l => (
                  <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 16, height: 16, borderRadius: 4, background: l.color, border: `1.5px solid ${l.border}` }} />
                    <span style={{ fontSize: 12, color: '#6b7280' }}>{l.label}</span>
                  </div>
                ))}
              </div>

              {/* Grade por prateleira */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {prateleiras.map(prat => {
                  const endsDaPrat = enderecosDoCorredor.filter(e => e.prateleira === prat)
                  const andares = [...new Set(endsDaPrat.map(e => e.andar))].sort((a, b) => b - a)

                  return (
                    <div key={prat} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 14 }}>
                        Prateleira {String(prat).padStart(2, '0')}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {andares.map(andar => {
                          const endsDoAndar = endsDaPrat.filter(e => e.andar === andar).sort((a, b) => a.posicao - b.posicao)
                          return (
                            <div key={andar} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ fontSize: 11, color: '#9ca3af', width: 50, flexShrink: 0 }}>Andar {andar}</div>
                              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                {endsDoAndar.map(end => {
                                  // Lógica para as 3 cores
                                  const cor = !end.caixa
                                    ? { bg: '#dcfce7', border: '#86efac', text: '#15803d' }
                                    : end.caixa.status === 'RETIRADA'
                                      ? { bg: '#fef9c3', border: '#fde047', text: '#854d0e' }
                                      : { bg: '#fee2e2', border: '#fca5a5', text: '#dc2626' }

                                  return (
                                    <div key={end.id}
                                      onMouseEnter={e => setTooltipPos({ x: e.clientX, y: e.clientY, end })}
                                      onMouseLeave={() => setTooltipPos(null)}
                                      onClick={() => end.caixa && router.push(`/caixas?busca=${end.caixa.etiqueta}`)}
                                      style={{
                                        width: 36, height: 36, borderRadius: 6, cursor: end.caixa ? 'pointer' : 'default',
                                        background: cor.bg,
                                        border: `1.5px solid ${cor.border}`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 9, fontWeight: 600, color: cor.text,
                                        transition: 'transform 0.1s',
                                      }}
                                      onMouseOver={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.15)' }}
                                      onMouseOut={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; setTooltipPos(null) }}
                                    >
                                      {end.posicao}
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Tooltip */}
      {tooltipPos && (
        <div style={{ position: 'fixed', left: tooltipPos.x + 12, top: tooltipPos.y - 10, background: '#1e293b', color: '#fff', padding: '8px 12px', borderRadius: 8, fontSize: 12, zIndex: 100, pointerEvents: 'none', maxWidth: 200 }}>
          <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{tooltipPos.end.enderecoCodigo}</div>
          {tooltipPos.end.caixa ? (
            <>
              <div>📦 Caixa: {tooltipPos.end.caixa.etiqueta}</div>
              <div>🏢 {tooltipPos.end.caixa.cliente.nome}</div>
              {tooltipPos.end.caixa.status === 'RETIRADA' && (
                <div style={{ color: '#fde047', marginTop: 4, fontWeight: 'bold' }}>⚠️ Caixa Retirada</div>
              )}
            </>
          ) : (
            <div style={{ color: '#86efac' }}>✓ Livre</div>
          )}
        </div>
      )}
    </div>
  )
}