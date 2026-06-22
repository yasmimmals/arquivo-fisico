'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import jsPDF from 'jspdf'
import JsBarcode from 'jsbarcode'

interface Cliente { id: string; nome: string }
interface Endereco { enderecoCodigo: string }
interface Caixa {
  id: string
  etiqueta: string
  status: string
  observacao: string | null
  criadoEm: string
  cliente: Cliente
  endereco: Endereco | null
  _count: { documentos: number }
}
interface Campo {
  id: string
  nome: string
  label: string
  tipo: string
  obrigatorio: boolean
  opcoes?: string
}
interface TipoDocumento {
  id: string
  nome: string
  tempGuardaAnos: number
  campos: Campo[]
}

const statusLabel: Record<string, { label: string; color: string; bg: string }> = {
  ATIVA:     { label: 'Ativa',     color: '#15803d', bg: '#f0fdf4' },
  RETIRADA:  { label: 'Retirada',  color: '#b45309', bg: '#fffbeb' },
  ARQUIVADA: { label: 'Arquivada', color: '#6b7280', bg: '#f3f4f6' },
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

export default function CaixasPage() {
  const router = useRouter()
  const [caixas, setCaixas] = useState<Caixa[]>([])
  const [total, setTotal] = useState(0)
  const [pagina, setPagina] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [busca, setBusca] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [modalAberto, setModalAberto] = useState(false)
  const [caixaSelecionada, setCaixaSelecionada] = useState<Caixa | null>(null)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [tipos, setTipos] = useState<TipoDocumento[]>([])

  // Form
  const [novaEtiqueta, setNovaEtiqueta] = useState('')
  const [novoClienteId, setNovoClienteId] = useState('')
  const [novoEndereco, setNovoEndereco] = useState('')
  const [novaObs, setNovaObs] = useState('')
  const [tipoDocId, setTipoDocId] = useState('')
  const [camposValores, setCamposValores] = useState<Record<string, string>>({})
  const [dataInicioDoc, setDataInicioDoc] = useState('')
  const [dataFimDoc, setDataFimDoc] = useState('')
  const [solicitante, setSolicitante] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  async function carregar(p = 1) {
    setCarregando(true)
    const params = new URLSearchParams()
    params.set('pagina', String(p))
    if (busca) params.set('busca', busca)
    const res = await fetch(`/api/caixas?${params}`)
    const data = await res.json()
    setCaixas(data.caixas)
    setTotal(data.total)
    setTotalPaginas(data.totalPaginas)
    setPagina(p)
    setCarregando(false)
  }

  useEffect(() => { carregar(1) }, [])
  useEffect(() => {
    fetch('/api/filtros').then(r => r.json()).then(d => setClientes(d.clientes))
  }, [])
  useEffect(() => {
    fetch('/api/tipos-documento').then(r => r.json()).then(setTipos)
  }, [])

  function abrirModal(caixa?: Caixa) {
    setCaixaSelecionada(caixa || null)
    setNovaEtiqueta(caixa?.etiqueta || '')
    setNovoClienteId(caixa?.cliente.id || '')
    setNovoEndereco(caixa?.endereco?.enderecoCodigo || '')
    setNovaObs(caixa?.observacao || '')
    setTipoDocId('')
    setCamposValores({})
    setDataInicioDoc('')
    setDataFimDoc('')
    setSolicitante('')
    setErro('')
    setModalAberto(true)
  }

  async function salvar() {
    if (!novoClienteId) { setErro('O cliente é obrigatório.'); return }
    if (caixaSelecionada && !novaEtiqueta) { setErro('A etiqueta não pode ficar em branco na edição.'); return }
    
    setSalvando(true); setErro('')
    const body = {
      etiqueta: novaEtiqueta, // Se for vazia e for nova caixa, o backend se vira
      clienteId: novoClienteId,
      enderecoCodigo: novoEndereco,
      observacao: novaObs,
      tipoDocumentoId: tipoDocId || null,
      camposValores,
      dataInicial: dataInicioDoc || null,
      dataFinal: dataFimDoc || null,
      solicitante: solicitante || null,
    }
    const res = await fetch(
      caixaSelecionada ? `/api/caixas/${caixaSelecionada.id}` : '/api/caixas',
      { method: caixaSelecionada ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
    )
    if (res.ok) { setModalAberto(false); carregar(pagina) }
    else { const d = await res.json(); setErro(d.error || 'Erro ao salvar.') }
    setSalvando(false)
  }

  async function arquivar(id: string) {
    if (!confirm('Arquivar esta caixa?')) return
    await fetch(`/api/caixas/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'ARQUIVADA' }) })
    carregar(pagina)
  }

  function gerarEtiqueta(cx: Caixa) {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [100, 140] })
    doc.setFillColor(255, 255, 255)
    doc.rect(0, 0, 100, 140, 'F')
    doc.setDrawColor(0, 0, 0)
    doc.setLineWidth(0.5)
    doc.rect(2, 2, 96, 136)
    if (cx.endereco) {
      const canvas = document.createElement('canvas')
      // @ts-ignore
      JsBarcode(canvas, cx.endereco.enderecoCodigo, { format: 'CODE128', width: 2, height: 50, displayValue: false, margin: 0 })
      doc.addImage(canvas.toDataURL('image/png'), 'PNG', 8, 5, 84, 25)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(26)
      doc.setTextColor(0, 0, 0)
      doc.text(cx.endereco.enderecoCodigo, 50, 40, { align: 'center' })
    }
    doc.setLineWidth(0.8)
    doc.line(2, 45, 98, 45)
    const canvas2 = document.createElement('canvas')
    // @ts-ignore
    JsBarcode(canvas2, String(cx.etiqueta), { format: 'CODE128', width: 2, height: 30, displayValue: false, margin: 0 })
    doc.addImage(canvas2.toDataURL('image/png'), 'PNG', 15, 48, 70, 16)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(80, 80, 80)
    doc.text(String(cx.etiqueta), 50, 69, { align: 'center' })
    doc.setLineWidth(0.3)
    doc.line(2, 73, 98, 73)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(120, 120, 120)
    doc.text('CLIENTE', 6, 80)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(0, 0, 0)
    doc.text(cx.cliente.nome.toUpperCase(), 6, 87)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(120, 120, 120)
    doc.text('Nº CAIXA', 6, 97)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(0, 0, 0)
    doc.text(String(cx.etiqueta), 6, 104)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(120, 120, 120)
    doc.text('ENDEREÇO', 6, 114)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(2, 132, 199)
    doc.text(cx.endereco?.enderecoCodigo || 'SEM ENDEREÇO', 6, 122)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(6); doc.setTextColor(160, 160, 160)
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 50, 135, { align: 'center' })
    doc.save(`etiqueta-${cx.etiqueta}.pdf`)
  }

  const tipoAtivo = tipos.find(t => t.id === tipoDocId)

  const dataVencimento = tipoAtivo && dataInicioDoc
    ? new Date(new Date(dataInicioDoc).setFullYear(new Date(dataInicioDoc).getFullYear() + tipoAtivo.tempGuardaAnos)).toLocaleDateString('pt-BR')
    : null

  const s = {
    page: { display: 'flex', minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif' } as React.CSSProperties,
    sidebar: { width: 220, minWidth: 220, background: '#fff', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column' as const, padding: '24px 0', minHeight: '100vh' },
    main: { flex: 1, display: 'flex', flexDirection: 'column' as const },
    header: { background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky' as const, top: 0, zIndex: 10 },
    content: { flex: 1, padding: 32 },
    card: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: 24, marginBottom: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' },
    btnPrimary: { background: '#2563eb', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' } as React.CSSProperties,
    btnSecondary: { background: '#fff', color: '#6b7280', border: '1.5px solid #e5e7eb', borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer' } as React.CSSProperties,
    btnDanger: { background: '#fff', color: '#dc2626', border: '1.5px solid #fecaca', borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer' } as React.CSSProperties,
    input: { width: '100%', border: '1.5px solid #e5e7eb', borderRadius: 10, padding: '10px 12px', fontSize: 14, outline: 'none', boxSizing: 'border-box' as const },
    label: { display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 6 } as React.CSSProperties,
    overlay: { position: 'fixed' as const, inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 20px', overflowY: 'auto' as const },
    modal: { background: '#fff', borderRadius: 20, padding: 32, width: 560, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', marginTop: 'auto', marginBottom: 'auto' } as React.CSSProperties,
  }

  return (
    <div style={s.page}>
      {/* Sidebar */}
      <aside style={s.sidebar}>
        <div style={{ padding: '0 20px 24px', borderBottom: '1px solid #f3f4f6', marginBottom: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>📦 ArquivoFísico</div>
          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>Sistema de gestão</div>
        </div>
        {NAV.map(item => {
          const active = item.href === '/caixas'
          return (
            <button key={item.label} onClick={() => router.push(item.href)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px', fontSize: 14, fontWeight: active ? 600 : 400, color: active ? '#2563eb' : '#6b7280', background: active ? '#eff6ff' : 'transparent', borderLeft: active ? '3px solid #2563eb' : '3px solid transparent', cursor: 'pointer', border: 'none', width: '100%', textAlign: 'left' }}>
              {item.icon} {item.label}
            </button>
          )
        })}
      </aside>

      <main style={s.main}>
        <header style={s.header}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>Caixas</div>
            <div style={{ fontSize: 12, color: '#9ca3af' }}>Gerencie as caixas do barracão</div>
          </div>
          <button onClick={() => abrirModal()} style={s.btnPrimary}>+ Nova caixa</button>
        </header>

        <div style={s.content}>
          <div style={s.card}>
            <div style={{ display: 'flex', gap: 12 }}>
              <input placeholder="Buscar por etiqueta, cliente ou endereço..." value={busca}
                onChange={e => setBusca(e.target.value)} onKeyDown={e => e.key === 'Enter' && carregar(1)}
                style={{ ...s.input, flex: 1 }} />
              <button onClick={() => carregar(1)} style={s.btnPrimary}>Buscar</button>
              {busca && <button onClick={() => { setBusca(''); carregar(1) }} style={s.btnSecondary}>Limpar</button>}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
            {[
              { label: 'Total de caixas', value: total.toLocaleString('pt-BR'), icon: '📦' },
              { label: 'Página atual', value: `${pagina} / ${totalPaginas}`, icon: '📄' },
              { label: 'Caixas nesta página', value: caixas.length, icon: '👁️' },
            ].map(stat => (
              <div key={stat.label} style={{ ...s.card, marginBottom: 0, display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ fontSize: 28 }}>{stat.icon}</div>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>{stat.value}</div>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>{stat.label}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={s.card}>
            {carregando ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>Carregando...</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f3f4f6' }}>
                    {['Etiqueta', 'Cliente', 'Endereço', 'Documentos', 'Status', 'Ações'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {caixas.map((cx, i) => (
                    <tr key={cx.id} style={{ borderBottom: '1px solid #f9fafb', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                      <td style={{ padding: '12px', fontSize: 13, fontFamily: 'monospace', fontWeight: 700, color: '#374151' }}>{cx.etiqueta}</td>
                      <td style={{ padding: '12px', fontSize: 13, color: '#374151' }}>{cx.cliente.nome}</td>
                      <td style={{ padding: '12px' }}>
                        {cx.endereco
                          ? <span style={{ fontSize: 13, fontFamily: 'monospace', fontWeight: 700, color: '#2563eb' }}>{cx.endereco.enderecoCodigo}</span>
                          : <span style={{ fontSize: 12, color: '#f59e0b' }}>⚠ Sem endereço</span>}
                      </td>
                      <td style={{ padding: '12px', fontSize: 13, color: '#6b7280' }}>{cx._count.documentos} doc{cx._count.documentos !== 1 ? 's' : ''}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: statusLabel[cx.status]?.color, background: statusLabel[cx.status]?.bg, padding: '3px 10px', borderRadius: 20 }}>
                          {statusLabel[cx.status]?.label}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => gerarEtiqueta(cx)} style={{ ...s.btnSecondary, color: '#0284c7', borderColor: '#bae6fd' }}>🏷️ Etiqueta</button>
                          <button onClick={() => abrirModal(cx)} style={s.btnSecondary}>✏️ Editar</button>
                          {cx.status !== 'ARQUIVADA' && (
                            <button onClick={() => arquivar(cx.id)} style={s.btnDanger}>🗄️ Arquivar</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {totalPaginas > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 24, paddingTop: 20, borderTop: '1px solid #f3f4f6' }}>
                <button onClick={() => carregar(pagina - 1)} disabled={pagina === 1} style={{ ...s.btnSecondary, opacity: pagina === 1 ? 0.4 : 1 }}>← Anterior</button>
                <span style={{ fontSize: 13, color: '#6b7280' }}>{pagina} / {totalPaginas}</span>
                <button onClick={() => carregar(pagina + 1)} disabled={pagina === totalPaginas} style={{ ...s.btnSecondary, opacity: pagina === totalPaginas ? 0.4 : 1 }}>Próxima →</button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal */}
      {modalAberto && (
        <div style={s.overlay} onClick={e => { if (e.target === e.currentTarget) setModalAberto(false) }}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 24 }}>
              {caixaSelecionada ? '✏️ Editar caixa' : '📦 Nova caixa'}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxHeight: '65vh', overflowY: 'auto', paddingRight: 4 }}>

              <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dados da caixa</div>

              <div>
                <label style={s.label}>Etiqueta / Número {caixaSelecionada ? '*' : '(deixe em branco para gerar automático)'}</label>
                <input 
                  value={novaEtiqueta} 
                  onChange={e => setNovaEtiqueta(e.target.value)} 
                  style={s.input} 
                  placeholder={caixaSelecionada ? "Ex: 2282853" : "Gerado automaticamente..."} 
                />
              </div>
              <div>
                <label style={s.label}>Cliente *</label>
                <select value={novoClienteId} onChange={e => setNovoClienteId(e.target.value)} style={s.input}>
                  <option value="">Selecione um cliente</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
              <div>
                <label style={s.label}>Endereço</label>
                <input value={novoEndereco} onChange={e => setNovoEndereco(e.target.value.toUpperCase())} style={s.input} placeholder="Ex: 10A010101" />
              </div>

              <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 8 }}>Dados do documento</div>

              <div>
                <label style={s.label}>Tipo de documento</label>
                <select value={tipoDocId} onChange={e => { setTipoDocId(e.target.value); setCamposValores({}) }} style={s.input}>
                  <option value="">Selecione um tipo</option>
                  {tipos.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
                </select>
              </div>

              {tipoAtivo?.campos.map(campo => (
                <div key={campo.id}>
                  <label style={s.label}>{campo.label}{campo.obrigatorio ? ' *' : ''}</label>
                  {campo.tipo === 'SELECAO' ? (
                    <select value={camposValores[campo.nome] || ''} onChange={e => setCamposValores({ ...camposValores, [campo.nome]: e.target.value })} style={s.input}>
                      <option value="">Selecione...</option>
                      {campo.opcoes?.split(',').map(op => <option key={op.trim()} value={op.trim()}>{op.trim()}</option>)}
                    </select>
                  ) : campo.tipo === 'BOOLEAN' ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input type="checkbox" checked={camposValores[campo.nome] === 'true'} onChange={e => setCamposValores({ ...camposValores, [campo.nome]: String(e.target.checked) })} />
                      <span style={{ fontSize: 13, color: '#374151' }}>{campo.label}</span>
                    </div>
                  ) : (
                    <input type={campo.tipo === 'DATA' ? 'date' : campo.tipo === 'NUMERO' ? 'number' : 'text'}
                      value={camposValores[campo.nome] || ''} onChange={e => setCamposValores({ ...camposValores, [campo.nome]: e.target.value })} style={s.input} />
                  )}
                </div>
              ))}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={s.label}>Data início</label>
                  <input type="date" value={dataInicioDoc} onChange={e => setDataInicioDoc(e.target.value)} style={s.input} />
                </div>
                <div>
                  <label style={s.label}>Data fim</label>
                  <input type="date" value={dataFimDoc} onChange={e => setDataFimDoc(e.target.value)} style={s.input} />
                </div>
              </div>

              <div>
                <label style={s.label}>Solicitante</label>
                <input value={solicitante} onChange={e => setSolicitante(e.target.value)} style={s.input} placeholder="Nome de quem solicitou o armazenamento" />
              </div>

              {tipoAtivo && (
                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#1d4ed8' }}>
                  ⏱️ Tempo de guarda: <b>{tipoAtivo.tempGuardaAnos} {tipoAtivo.tempGuardaAnos === 1 ? 'ano' : 'anos'}</b>
                  {dataVencimento && <span> — vence em <b>{dataVencimento}</b></span>}
                </div>
              )}

              <div>
                <label style={s.label}>Observação</label>
                <input value={novaObs} onChange={e => setNovaObs(e.target.value)} style={s.input} placeholder="Opcional" />
              </div>
            </div>

            {erro && <div style={{ marginTop: 12, fontSize: 13, color: '#dc2626', background: '#fef2f2', padding: '8px 12px', borderRadius: 8 }}>{erro}</div>}

            <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
              <button onClick={() => setModalAberto(false)} style={s.btnSecondary}>Cancelar</button>
              <button onClick={salvar} disabled={salvando} style={{ ...s.btnPrimary, opacity: salvando ? 0.6 : 1 }}>
                {salvando ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}