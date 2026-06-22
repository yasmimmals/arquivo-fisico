'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

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

const statusLabel: Record<string, string> = {
  PENDENTE: 'Pendente', APROVADA: 'Aprovada', EM_ROTA: 'Em rota',
  ENTREGUE: 'Entregue', DEVOLVIDA: 'Devolvida', CANCELADA: 'Cancelada',
}

const CORES = ['#2563eb', '#7c3aed', '#0891b2', '#059669', '#d97706', '#dc2626']

export default function DashboardPage() {
  const router = useRouter()
  const [dados, setDados] = useState<any>(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard').then(r => r.json()).then(d => { setDados(d); setCarregando(false) })
  }, [])

  const s = {
    card: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' } as React.CSSProperties,
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <aside style={{ width: 220, minWidth: 220, background: '#fff', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', padding: '24px 0', minHeight: '100vh' }}>
        <div style={{ padding: '0 20px 24px', borderBottom: '1px solid #f3f4f6', marginBottom: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>📦 ArquivoFísico</div>
          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>Sistema de gestão</div>
        </div>
        {NAV.map(item => {
          const active = item.href === '/dashboard'
          return (
            <button key={item.label} onClick={() => router.push(item.href)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px', fontSize: 14, fontWeight: active ? 600 : 400, color: active ? '#2563eb' : '#6b7280', background: active ? '#eff6ff' : 'transparent', borderLeft: active ? '3px solid #2563eb' : '3px solid transparent', cursor: 'pointer', border: 'none', width: '100%', textAlign: 'left' }}>
              {item.icon} {item.label}
            </button>
          )
        })}
      </aside>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '16px 32px' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>Dashboard</div>
          <div style={{ fontSize: 12, color: '#9ca3af' }}>Visão geral do sistema</div>
        </header>

        {carregando ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#9ca3af' }}>Carregando dados...</div>
        ) : dados && (
          <div style={{ flex: 1, padding: 32, overflowY: 'auto' }}>

            {/* Cards de resumo */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
              {[
                { label: 'Total de caixas', value: dados.resumo.totalCaixas.toLocaleString('pt-BR'), icon: '📦', color: '#2563eb', bg: '#eff6ff' },
                { label: 'Documentos', value: dados.resumo.totalDocumentos.toLocaleString('pt-BR'), icon: '📄', color: '#7c3aed', bg: '#f5f3ff' },
                { label: 'Solicitações pendentes', value: dados.resumo.solicitacoesPendentes, icon: '📬', color: '#b45309', bg: '#fffbeb' },
                { label: 'Próximos ao expurgo', value: dados.resumo.caixasProximasExpurgo, icon: '⚠️', color: '#dc2626', bg: '#fef2f2' },
              ].map(card => (
                <div key={card.label} style={{ ...s.card, background: card.bg, border: 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 24 }}>{card.icon}</span>
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: card.color }}>{card.value}</div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{card.label}</div>
                </div>
              ))}
            </div>

            {/* Alertas */}
            {(dados.resumo.solicitacoesUrgentes > 0 || dados.resumo.caixasProximasExpurgo > 0) && (
              <div style={{ marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {dados.resumo.solicitacoesUrgentes > 0 && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 20 }}>🚨</span>
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#dc2626' }}>{dados.resumo.solicitacoesUrgentes} solicitação(ões) urgente(s) em aberto</span>
                      <span style={{ fontSize: 12, color: '#9ca3af', marginLeft: 8 }}>— prazo de 4 horas</span>
                    </div>
                    <button onClick={() => router.push('/solicitacoes')}
                      style={{ marginLeft: 'auto', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 12, cursor: 'pointer' }}>
                      Ver agora
                    </button>
                  </div>
                )}
                {dados.resumo.caixasProximasExpurgo > 0 && (
                  <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 20 }}>⏰</span>
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#b45309' }}>{dados.resumo.caixasProximasExpurgo} documento(s) com prazo de guarda vencendo em 90 dias</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Gráficos */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>

              {/* Caixas por cliente */}
              <div style={s.card}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 20 }}>Caixas por cliente</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={dados.caixasPorCliente} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                    <XAxis dataKey="nome" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="total" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Solicitações por status */}
              <div style={s.card}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 20 }}>Solicitações por status</div>
                {dados.solicitacoesPorStatus.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af', fontSize: 13 }}>Nenhuma solicitação ainda</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={dados.solicitacoesPorStatus.map((s: any) => ({ ...s, name: statusLabel[s.status] || s.status, value: s.total }))}
                        dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                        {dados.solicitacoesPorStatus.map((_: any, i: number) => <Cell key={i} fill={CORES[i % CORES.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Ocupação por corredor */}
            <div style={{ ...s.card, marginBottom: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 20 }}>Ocupação por corredor</div>
              {dados.ocupacao.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af', fontSize: 13 }}>Nenhum endereço cadastrado</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {dados.ocupacao.map((c: any) => (
                    <div key={c.corredor}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{c.corredor}</span>
                        <span style={{ fontSize: 12, color: '#6b7280' }}>{c.ocupados}/{c.total} ({c.pct}%)</span>
                      </div>
                      <div style={{ height: 8, background: '#f3f4f6', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${c.pct}%`, background: c.pct > 90 ? '#dc2626' : c.pct > 70 ? '#f59e0b' : '#2563eb', borderRadius: 4, transition: 'width 0.5s' }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Últimas solicitações */}
            <div style={s.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>Últimas solicitações</div>
                <button onClick={() => router.push('/solicitacoes')}
                  style={{ fontSize: 12, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer' }}>
                  Ver todas →
                </button>
              </div>
              {dados.ultimasSolicitacoes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 0', color: '#9ca3af', fontSize: 13 }}>Nenhuma solicitação ainda</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #f3f4f6' }}>
                      {['Caixa', 'Cliente', 'Solicitante', 'Tipo', 'Status', 'Data'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '6px 10px', fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dados.ultimasSolicitacoes.map((sol: any, i: number) => (
                      <tr key={sol.id} style={{ borderBottom: '1px solid #f9fafb', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                        <td style={{ padding: '10px', fontSize: 13, fontFamily: 'monospace', fontWeight: 700, color: '#374151' }}>{sol.caixa.etiqueta}</td>
                        <td style={{ padding: '10px', fontSize: 13, color: '#374151' }}>{sol.caixa.cliente.nome}</td>
                        <td style={{ padding: '10px', fontSize: 13, color: '#6b7280' }}>{sol.usuario.nome}</td>
                        <td style={{ padding: '10px' }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: sol.tipo === 'URGENTE' ? '#dc2626' : '#374151', background: sol.tipo === 'URGENTE' ? '#fef2f2' : '#f3f4f6', padding: '2px 8px', borderRadius: 20 }}>
                            {sol.tipo === 'URGENTE' ? 'Urgente' : 'Normal'}
                          </span>
                        </td>
                        <td style={{ padding: '10px' }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', background: '#f3f4f6', padding: '2px 8px', borderRadius: 20 }}>
                            {statusLabel[sol.status]}
                          </span>
                        </td>
                        <td style={{ padding: '10px', fontSize: 12, color: '#9ca3af' }}>{new Date(sol.criadoEm).toLocaleDateString('pt-BR')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}