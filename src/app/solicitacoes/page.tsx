'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Usuario { id: string; nome: string; email: string }
interface Endereco { enderecoCodigo: string }
interface Cliente { nome: string }
interface Caixa { etiqueta: string; cliente: Cliente; endereco: Endereco | null }
interface Solicitacao {
  id: string
  tipo: string
  status: string
  motivo: string | null
  localEntrega: string | null
  prazoHoras: number
  criadoEm: string
  atendidoEm: string | null
  caixa: Caixa
  usuario: Usuario | null
  nomeSolicitante: string | null
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

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  PENDENTE:  { label: 'Pendente',   color: '#b45309', bg: '#fffbeb' },
  APROVADA:  { label: 'Aprovada',   color: '#0369a1', bg: '#e0f2fe' },
  EM_ROTA:   { label: 'Em rota',    color: '#7c3aed', bg: '#f5f3ff' },
  ENTREGUE:  { label: 'Entregue',   color: '#15803d', bg: '#f0fdf4' },
  DEVOLVIDA: { label: 'Devolvida',  color: '#6b7280', bg: '#f3f4f6' },
  CANCELADA: { label: 'Cancelada',  color: '#dc2626', bg: '#fef2f2' },
}

const tipoConfig: Record<string, { label: string; color: string; bg: string }> = {
  NORMAL:  { label: 'Normal (24h)',  color: '#374151', bg: '#f3f4f6' },
  URGENTE: { label: 'Urgente (4h)', color: '#dc2626', bg: '#fef2f2' },
}

// Configuração das colunas do Kanban
const KANBAN_COLS = [
  { id: 'PENDENTE', title: '⏳ Pendentes', aceita: ['PENDENTE'] },
  { id: 'APROVADA', title: '👍 Aprovadas', aceita: ['APROVADA'] },
  { id: 'EM_ROTA', title: '🚚 Em Rota', aceita: ['EM_ROTA'] },
  { id: 'CONCLUIDAS', title: '✅ Concluídas', aceita: ['ENTREGUE', 'DEVOLVIDA', 'CANCELADA'] },
]

function calcularSLA(criadoEm: string, prazoHoras: number, status: string) {
  if (['ENTREGUE', 'DEVOLVIDA', 'CANCELADA'].includes(status)) return null
  const criado = new Date(criadoEm)
  const prazo = new Date(criado.getTime() + prazoHoras * 60 * 60 * 1000)
  const agora = new Date()
  const diffMs = prazo.getTime() - agora.getTime()
  const diffHoras = Math.floor(diffMs / (1000 * 60 * 60))
  const diffMin = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

  if (diffMs < 0) return { texto: 'Atrasado', cor: '#dc2626', bg: '#fef2f2' }
  if (diffHoras < 2) return { texto: `${diffHoras}h ${diffMin}m`, cor: '#b45309', bg: '#fffbeb' }
  return { texto: `${diffHoras}h ${diffMin}m`, cor: '#15803d', bg: '#f0fdf4' }
}

export default function SolicitacoesPage() {
  const router = useRouter()
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([])
  const [carregando, setCarregando] = useState(false)
  const [modalNova, setModalNova] = useState(false)
  const [modalAcao, setModalAcao] = useState<Solicitacao | null>(null)

  // Drag and drop state
  const [draggedId, setDraggedId] = useState<string | null>(null)

  // Form nova solicitação
  const [buscaCaixa, setBuscaCaixa] = useState('')
  const [caixaEncontrada, setCaixaEncontrada] = useState<any>(null)
  const [buscando, setBuscando] = useState(false)
  const [tipoSol, setTipoSol] = useState('NORMAL')
  const [motivoSol, setMotivoSol] = useState('')
  const [localSol, setLocalSol] = useState('')
  const [nomeSolicitante, setNomeSolicitante] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  // Ação
  const [novoStatus, setNovoStatus] = useState('')
  const [obsAcao, setObsAcao] = useState('')

  // No Kanban, costumamos carregar todas as solicitações ativas ou um lote maior,
  // aqui estou pegando a página 1 com 100 registros para o quadro funcionar bem.
  async function carregar() {
    setCarregando(true)
    const res = await fetch(`/api/solicitacoes?pagina=1&porPagina=100`)
    const data = await res.json()
    setSolicitacoes(data.solicitacoes)
    setCarregando(false)
  }

  useEffect(() => { carregar() }, [])

  async function buscarCaixa() {
    if (!buscaCaixa) return
    setBuscando(true)
    const res = await fetch(`/api/caixas?busca=${buscaCaixa}&pagina=1`)
    const data = await res.json()
    setCaixaEncontrada(data.caixas?.[0] || null)
    setBuscando(false)
  }

  async function criarSolicitacao() {
    if (!caixaEncontrada || !nomeSolicitante.trim()) { 
      setErro('Selecione uma caixa e informe o nome do solicitante.')
      return 
    }
    
    setSalvando(true); setErro('')
    const res = await fetch('/api/solicitacoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caixaId: caixaEncontrada.id, nomeSolicitante, tipo: tipoSol, motivo: motivoSol, localEntrega: localSol }),
    })
    
    if (res.ok) { 
      setModalNova(false)
      setNomeSolicitante(''); setMotivoSol(''); setLocalSol('')
      carregar() 
    } else { 
      const d = await res.json()
      setErro(d.error || 'Erro ao criar solicitação.') 
    }
    setSalvando(false)
  }

  async function atualizarStatus(idAtualizacao?: string, statusDireto?: string) {
    const targetId = idAtualizacao || modalAcao?.id
    const targetStatus = statusDireto || novoStatus
    
    if (!targetId || !targetStatus) return
    setSalvando(true)
    
    // Atualização Otimista (Muda na tela antes do banco para sensação de rapidez)
    setSolicitacoes(prev => prev.map(s => s.id === targetId ? { ...s, status: targetStatus } : s))

    await fetch(`/api/solicitacoes/${targetId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: targetStatus, observacao: obsAcao }),
    })
    
    if (modalAcao) setModalAcao(null)
    setObsAcao('')
    setSalvando(false)
    carregar()
  }

  // --- Funções de Drag & Drop ---
  function handleDragStart(e: React.DragEvent, id: string) {
    e.dataTransfer.setData('sol_id', id)
    setDraggedId(id)
  }

  function handleDrop(e: React.DragEvent, colId: string) {
    e.preventDefault()
    setDraggedId(null)
    const id = e.dataTransfer.getData('sol_id')
    if (!id) return

    const sol = solicitacoes.find(s => s.id === id)
    if (!sol) return

    // Se arrastou para a mesma coluna, ignora
    const colAtual = KANBAN_COLS.find(c => c.aceita.includes(sol.status))
    if (colAtual?.id === colId) return

    // Define o novo status baseando-se na coluna de destino
    let statusDestino = colId
    if (colId === 'CONCLUIDAS') statusDestino = 'ENTREGUE' // Por padrão, arrastar para cá finaliza como ENTREGUE

    atualizarStatus(id, statusDestino)
  }

  const s = {
    input: { width: '100%', border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '10px 12px', fontSize: 14, outline: 'none', boxSizing: 'border-box' as const },
    label: { display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 6 } as React.CSSProperties,
    btnPrimary: { background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' } as React.CSSProperties,
    btnSecondary: { background: '#fff', color: '#6b7280', border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: 'pointer' } as React.CSSProperties,
    overlay: { position: 'fixed' as const, inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    modal: { background: '#fff', borderRadius: 16, padding: 32, width: 520, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', maxHeight: '85vh', overflowY: 'auto' as const },
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <aside style={{ width: 220, minWidth: 220, background: '#fff', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', padding: '24px 0', minHeight: '100vh' }}>
        <div style={{ padding: '0 20px 24px', borderBottom: '1px solid #f3f4f6', marginBottom: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>📦 ArquivoFísico</div>
          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>Sistema de gestão</div>
        </div>
        {NAV.map(item => {
          const active = item.href === '/solicitacoes'
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
            <div style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>Quadro de Solicitações</div>
            <div style={{ fontSize: 12, color: '#9ca3af' }}>Arraste os cartões para atualizar o status</div>
          </div>
          <button onClick={() => { setModalNova(true); setCaixaEncontrada(null); setBuscaCaixa(''); setErro('') }} style={s.btnPrimary}>
            + Nova solicitação
          </button>
        </header>

        {/* Quadro Kanban */}
        <div style={{ flex: 1, padding: '24px 32px', overflowX: 'auto', display: 'flex', gap: 20, alignItems: 'flex-start' }}>
          {carregando ? (
            <div style={{ margin: 'auto', color: '#9ca3af' }}>Carregando quadro...</div>
          ) : (
            KANBAN_COLS.map(col => {
              const solDaColuna = solicitacoes.filter(s => col.aceita.includes(s.status))
              
              return (
                <div 
                  key={col.id}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => handleDrop(e, col.id)}
                  style={{ 
                    background: '#f1f5f9', 
                    borderRadius: 12, 
                    width: 320, 
                    minWidth: 320, 
                    maxHeight: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    border: '1px solid #e2e8f0'
                  }}
                >
                  <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#334155' }}>{col.title}</div>
                    <div style={{ fontSize: 12, background: '#e2e8f0', color: '#475569', padding: '2px 8px', borderRadius: 12, fontWeight: 600 }}>
                      {solDaColuna.length}
                    </div>
                  </div>

                  <div style={{ padding: 12, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {solDaColuna.map(sol => {
                      const sla = calcularSLA(sol.criadoEm, sol.prazoHoras, sol.status)
                      const isDragging = draggedId === sol.id

                      return (
                        <div 
                          key={sol.id}
                          draggable
                          onDragStart={e => handleDragStart(e, sol.id)}
                          onDragEnd={() => setDraggedId(null)}
                          onClick={() => { setModalAcao(sol); setNovoStatus(sol.status); setObsAcao('') }}
                          style={{ 
                            background: '#fff', 
                            borderRadius: 8, 
                            padding: 16, 
                            cursor: 'grab',
                            boxShadow: isDragging ? '0 10px 15px -3px rgba(0,0,0,0.1)' : '0 1px 2px 0 rgba(0,0,0,0.05)',
                            border: '1px solid #e5e7eb',
                            borderLeft: `4px solid ${tipoConfig[sol.tipo]?.color}`,
                            opacity: isDragging ? 0.5 : 1,
                            transition: 'all 0.2s',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: tipoConfig[sol.tipo]?.color, background: tipoConfig[sol.tipo]?.bg, padding: '2px 6px', borderRadius: 4 }}>
                              {sol.tipo === 'URGENTE' ? '🚨 URGENTE' : 'NORMAL'}
                            </span>
                            {sla && (
                              <span style={{ fontSize: 10, fontWeight: 600, color: sla.cor, display: 'flex', alignItems: 'center', gap: 4 }}>
                                ⏱ {sla.texto}
                              </span>
                            )}
                          </div>
                          
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>
                            Caixa {sol.caixa.etiqueta}
                          </div>
                          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {sol.caixa.cliente.nome}
                          </div>
                          
                          <div style={{ fontSize: 11, color: '#94a3b8', borderTop: '1px solid #f1f5f9', paddingTop: 8 }}>
                            Solicitante: <b>{sol.nomeSolicitante || sol.usuario?.nome || 'Não informado'}</b>
                            {sol.caixa.endereco && <div style={{ color: '#2563eb', marginTop: 4 }}>📍 {sol.caixa.endereco.enderecoCodigo}</div>}
                          </div>
                        </div>
                      )
                    })}
                    {solDaColuna.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '20px 0', color: '#94a3b8', fontSize: 13, border: '1px dashed #cbd5e1', borderRadius: 8 }}>
                        Nenhuma solicitação
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </main>

      {/* Modal Nova Solicitação */}
      {modalNova && (
        <div style={s.overlay} onClick={() => setModalNova(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 24 }}>📬 Nova solicitação</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={s.label}>Buscar caixa</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input value={buscaCaixa} onChange={e => setBuscaCaixa(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && buscarCaixa()}
                    style={{ ...s.input, flex: 1 }} placeholder="Digite a etiqueta ou cliente..." />
                  <button onClick={buscarCaixa} disabled={buscando}
                    style={{ ...s.btnPrimary, padding: '10px 16px', opacity: buscando ? 0.6 : 1 }}>
                    {buscando ? '...' : '🔍'}
                  </button>
                </div>
              </div>

              {caixaEncontrada && (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '12px 16px' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#15803d' }}>✓ Caixa encontrada</div>
                  <div style={{ fontSize: 13, color: '#374151', marginTop: 4 }}>
                    <b>{caixaEncontrada.etiqueta}</b> — {caixaEncontrada.cliente.nome}
                  </div>
                </div>
              )}

              <div>
                <label style={s.label}>Nome do solicitante</label>
                <input 
                  value={nomeSolicitante} 
                  onChange={e => setNomeSolicitante(e.target.value)} 
                  style={s.input} 
                  placeholder="Ex: João da Contabilidade" 
                />
              </div>

              <div>
                <label style={s.label}>Tipo de solicitação</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    { value: 'NORMAL', label: '📋 Normal', sub: 'Prazo de 24h' },
                    { value: 'URGENTE', label: '🚨 Urgente', sub: 'Prazo de 4h' },
                  ].map(t => (
                    <div key={t.value} onClick={() => setTipoSol(t.value)}
                      style={{ border: `2px solid ${tipoSol === t.value ? '#2563eb' : '#e5e7eb'}`, borderRadius: 8, padding: '12px', cursor: 'pointer', background: tipoSol === t.value ? '#eff6ff' : '#fff' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: tipoSol === t.value ? '#2563eb' : '#374151' }}>{t.label}</div>
                      <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{t.sub}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label style={s.label}>Local de entrega</label>
                <input value={localSol} onChange={e => setLocalSol(e.target.value)} style={s.input} placeholder="Ex: Sala 302..." />
              </div>

              <div>
                <label style={s.label}>Motivo</label>
                <input value={motivoSol} onChange={e => setMotivoSol(e.target.value)} style={s.input} placeholder="Opcional" />
              </div>
            </div>

            {erro && <div style={{ marginTop: 12, fontSize: 13, color: '#dc2626', background: '#fef2f2', padding: '8px 12px', borderRadius: 8 }}>{erro}</div>}

            <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
              <button onClick={() => setModalNova(false)} style={s.btnSecondary}>Cancelar</button>
              <button onClick={criarSolicitacao} disabled={salvando} style={{ ...s.btnPrimary, opacity: salvando ? 0.6 : 1 }}>
                {salvando ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Atualizar Status (Click no Card) */}
      {modalAcao && (
        <div style={s.overlay} onClick={() => setModalAcao(null)}>
          <div style={{ ...s.modal, width: 400 }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Detalhes do Cartão</div>
            <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 24 }}>
              Caixa <b>{modalAcao.caixa.etiqueta}</b>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={s.label}>Status atualizado</label>
                <select value={novoStatus} onChange={e => setNovoStatus(e.target.value)} style={s.input}>
                  {Object.entries(statusConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div>
                <label style={s.label}>Observação</label>
                <input value={obsAcao} onChange={e => setObsAcao(e.target.value)} style={s.input} placeholder="Opcional" />
              </div>
              
              {modalAcao.motivo && (
                <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, fontSize: 12, color: '#475569', border: '1px solid #e2e8f0' }}>
                  <b>Motivo original:</b> {modalAcao.motivo}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
              <button onClick={() => setModalAcao(null)} style={s.btnSecondary}>Fechar</button>
              <button onClick={() => atualizarStatus()} disabled={salvando} style={{ ...s.btnPrimary, opacity: salvando ? 0.6 : 1 }}>
                {salvando ? 'Salvando...' : 'Atualizar Manualmente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}