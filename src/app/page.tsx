'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

// ─── Tipos ──────────────────────────────────────────────────
interface Option { id: string; nome: string }
interface CampoMeta { nome: string; label: string; valores: string[] }
interface Endereco { enderecoCodigo: string }
interface Caixa { etiqueta: string; endereco: Endereco | null; cliente: { nome: string } }
interface Documento {
  id: string
  nomeDocumento: string | null
  dataInicial: string | null
  dataFinal: string | null
  metadata: Record<string, any>
  caixa: Caixa
  setor: { nome: string }
}
interface Resultado {
  total: number
  pagina: number
  totalPaginas: number
  documentos: Documento[]
}

const NAV = [
  { icon: '📊', label: 'Dashboard', href: '/dashboard' },
  { icon: '🔍', label: 'Busca', href: '/' },
  { icon: '📦', label: 'Caixas', href: '/caixas' },
  { icon: '📬', label: 'Solicitações', href: '/solicitacoes' },
  { icon: '🗺️', label: 'Mapa do barracão', href: '/mapa' },
  { icon: '📋', label: 'Tipos de documento', href: '/tipos-documento' },
  { icon: '⚙️', label: 'Administração', href: '/admin' },
]

// ─── Chip ────────────────────────────────────────────────────
function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 20, padding: '4px 10px 4px 12px', fontSize: 13, color: '#374151', fontWeight: 500 }}>
      {label}
      <button onClick={onRemove} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 16, lineHeight: 1, padding: 0, display: 'flex', alignItems: 'center' }}>×</button>
    </div>
  )
}

// ─── AutoComplete ────────────────────────────────────────────
function AutoComplete({ label, placeholder, options, value, onChange, disabled }: {
  label: string
  placeholder: string
  options: Option[]
  value: Option | null
  onChange: (v: Option | null) => void
  disabled?: boolean
}) {
  const [texto, setTexto] = useState('')
  const [aberto, setAberto] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => { if (!value) setTexto('') }, [value])

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false)
    }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  const filtrados = options.filter(o => o.nome.toLowerCase().includes(texto.toLowerCase())).slice(0, 50)

  if (value) {
    return (
      <div>
        <label style={labelStyle}>{label}</label>
        <Chip label={value.nome} onRemove={() => onChange(null)} />
      </div>
    )
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <label style={labelStyle}>{label}</label>
      <input
        type="text"
        placeholder={disabled ? 'Selecione o filtro anterior primeiro' : placeholder}
        value={texto}
        disabled={disabled}
        onChange={e => { setTexto(e.target.value); setAberto(true) }}
        onFocus={() => setAberto(true)}
        style={{ ...inputStyle, opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'text' }}
      />
      {aberto && !disabled && filtrados.length > 0 && (
        <ul style={dropdownStyle}>
          {filtrados.map((o, i) => (
            <li key={o.id}
              onMouseDown={() => { onChange(o); setTexto(''); setAberto(false) }}
              style={{ padding: '10px 14px', fontSize: 14, cursor: 'pointer', color: '#374151', borderTop: i > 0 ? '1px solid #f3f4f6' : 'none' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#eff6ff')}
              onMouseLeave={e => (e.currentTarget.style.background = '#fff')}>
              {o.nome}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ─── Estilos base ────────────────────────────────────────────
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }
const inputStyle: React.CSSProperties = { width: '100%', border: '1.5px solid #e5e7eb', borderRadius: 10, padding: '10px 14px', fontSize: 14, color: '#111827', background: '#fff', outline: 'none', boxSizing: 'border-box' }
const dropdownStyle: React.CSSProperties = { position: 'absolute', zIndex: 100, width: '100%', marginTop: 4, background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.1)', overflowY: 'auto', maxHeight: 240, padding: 0, listStyle: 'none' }

// ─── Página principal ────────────────────────────────────────
export default function Home() {
  const router = useRouter()

  // Funil
  const [clientes, setClientes] = useState<Option[]>([])
  const [setores, setSetores] = useState<Option[]>([])
  const [tipos, setTipos] = useState<string[]>([])
  const [camposMeta, setCamposMeta] = useState<CampoMeta[]>([])

  const [cliente, setCliente] = useState<Option | null>(null)
  const [setor, setSetor] = useState<Option | null>(null)
  const [tipoDoc, setTipoDoc] = useState<string | null>(null)
  const [valorMeta, setValorMeta] = useState<Record<string, string>>({})
  const [dataInicial, setDataInicial] = useState('')
  const [dataFinal, setDataFinal] = useState('')

  // Resultados
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [carregando, setCarregando] = useState(false)
  const [buscou, setBuscou] = useState(false)
  const [pagina, setPagina] = useState(1)

  // Carrega clientes na inicialização
  useEffect(() => {
    fetch('/api/busca/filtros-dinamicos')
      .then(r => r.json())
      .then(d => setClientes(d.clientes || []))
  }, [])

  // Carrega setores quando cliente muda
  useEffect(() => {
    if (!cliente) { setSetores([]); setSetor(null); return }
    fetch(`/api/busca/filtros-dinamicos?clienteId=${cliente.id}`)
      .then(r => r.json())
      .then(d => setSetores(d.setores || []))
  }, [cliente])

  // Carrega tipos quando setor muda
  useEffect(() => {
    if (!setor) { setTipos([]); setTipoDoc(null); return }
    fetch(`/api/busca/filtros-dinamicos?clienteId=${cliente?.id}&setorId=${setor.id}`)
      .then(r => r.json())
      .then(d => setTipos(d.tipos || []))
  }, [setor])

  // Carrega campos dinâmicos quando tipo muda
  useEffect(() => {
    if (!setor || !tipoDoc) { setCamposMeta([]); setValorMeta({}); return }
    fetch(`/api/busca/filtros-dinamicos?setorId=${setor.id}&tipoDocumento=${encodeURIComponent(tipoDoc)}`)
      .then(r => r.json())
      .then(d => { setCamposMeta(d.campos || []); setValorMeta({}) })
  }, [tipoDoc])

  function handleClienteChange(v: Option | null) {
    setCliente(v)
    setSetor(null)
    setTipoDoc(null)
    setCamposMeta([])
    setValorMeta({})
    setResultado(null)
    setBuscou(false)
  }

  function handleSetorChange(v: Option | null) {
    setSetor(v)
    setTipoDoc(null)
    setCamposMeta([])
    setValorMeta({})
  }

  function handleTipoChange(v: string | null) {
    setTipoDoc(v)
    setValorMeta({})
  }

  async function buscar(p = 1) {
    setCarregando(true); setBuscou(true); setPagina(p)
    const params = new URLSearchParams()
    if (cliente) params.set('clienteId', cliente.id)
    if (setor) params.set('setorId', setor.id)
    if (tipoDoc) params.set('tipoDocumento', tipoDoc)
    if (dataInicial) params.set('dataInicial', dataInicial)
    if (dataFinal) params.set('dataFinal', dataFinal)
    Object.entries(valorMeta).forEach(([k, v]) => { if (v) params.set(`meta_${k}`, v) })
    params.set('pagina', String(p))
    const res = await fetch(`/api/busca?${params}`)
    setResultado(await res.json())
    setCarregando(false)
  }

  function limpar() {
    setCliente(null); setSetor(null); setTipoDoc(null)
    setValorMeta({}); setDataInicial(''); setDataFinal('')
    setResultado(null); setBuscou(false)
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Sidebar */}
      <aside style={{ width: 220, minWidth: 220, background: '#fff', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', padding: '24px 0', minHeight: '100vh' }}>
        <div style={{ padding: '0 20px 24px', borderBottom: '1px solid #f3f4f6', marginBottom: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>📦 ArquivoFísico</div>
          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>Sistema de gestão</div>
        </div>
        {NAV.map(item => {
          const active = item.href === '/'
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
            <div style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>Pesquisa de Registros</div>
            <div style={{ fontSize: 12, color: '#9ca3af' }}>Busca avançada com filtros hierárquicos</div>
          </div>
          {resultado && (
            <div style={{ fontSize: 13, color: '#6b7280', background: '#f3f4f6', padding: '6px 14px', borderRadius: 20 }}>
              {resultado.total.toLocaleString('pt-BR')} resultado{resultado.total !== 1 ? 's' : ''}
            </div>
          )}
        </header>

        <div style={{ flex: 1, padding: 32 }}>
          {/* Painel de filtros */}
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: 24, marginBottom: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>

            {/* Linha 1: funil principal */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
              <AutoComplete
                label="Cliente"
                placeholder="Digite o cliente..."
                options={clientes}
                value={cliente}
                onChange={handleClienteChange}
              />
              <AutoComplete
                label="Setor"
                placeholder="Digite o setor..."
                options={setores}
                value={setor}
                onChange={handleSetorChange}
                disabled={!cliente}
              />

              {/* Tipo de documento — chip ou input */}
              <div>
                <label style={labelStyle}>Tipo de documento</label>
                {tipoDoc ? (
                  <Chip label={tipoDoc} onRemove={() => handleTipoChange(null)} />
                ) : (
                  <TipoAutoComplete
                    options={tipos}
                    disabled={!setor}
                    onChange={handleTipoChange}
                  />
                )}
              </div>
            </div>

            {/* Linha 2: campos dinâmicos do metadata */}
            {camposMeta.length > 0 && (
              <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 16, marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
                  Campos específicos — {tipoDoc}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
                  {camposMeta.map(campo => (
                    <div key={campo.nome}>
                      <label style={labelStyle}>{campo.label}</label>
                      {campo.valores.length > 0 && campo.valores.length <= 15 ? (
                        <select
                          value={valorMeta[campo.nome] || ''}
                          onChange={e => setValorMeta({ ...valorMeta, [campo.nome]: e.target.value })}
                          style={inputStyle}>
                          <option value="">Todos</option>
                          {campo.valores.map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={valorMeta[campo.nome] || ''}
                          onChange={e => setValorMeta({ ...valorMeta, [campo.nome]: e.target.value })}
                          placeholder={`Filtrar por ${campo.label}...`}
                          style={inputStyle}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Linha 3: datas */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div>
                <label style={labelStyle}>Data inicial</label>
                <input type="date" value={dataInicial} onChange={e => setDataInicial(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Data final</label>
                <input type="date" value={dataFinal} onChange={e => setDataFinal(e.target.value)} style={inputStyle} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => buscar(1)} disabled={carregando}
                style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 28px', fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: carregando ? 0.6 : 1 }}>
                {carregando ? 'Buscando...' : '🔍 Buscar'}
              </button>
              <button onClick={limpar}
                style={{ background: '#fff', color: '#6b7280', border: '1.5px solid #e5e7eb', borderRadius: 10, padding: '10px 20px', fontSize: 14, cursor: 'pointer' }}>
                Limpar
              </button>
            </div>
          </div>

          {/* Resultados */}
          {buscou && (
            carregando ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af' }}>Buscando...</div>
            ) : resultado?.documentos.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
                <div style={{ fontSize: 14 }}>Nenhum documento encontrado.</div>
              </div>
            ) : resultado ? (
              <>
                <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 14 }}>
                  <b style={{ color: '#111827' }}>{resultado.total.toLocaleString('pt-BR')}</b> documentos encontrados
                  {resultado.totalPaginas > 1 && ` — página ${resultado.pagina} de ${resultado.totalPaginas}`}
                </div>
                {resultado.documentos.map(doc => (
                  <div key={doc.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '18px 22px', marginBottom: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: '#2563eb', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 20, padding: '2px 10px' }}>{doc.caixa.cliente.nome}</span>
                          <span style={{ fontSize: 12, color: '#9ca3af' }}>•</span>
                          <span style={{ fontSize: 12, color: '#6b7280' }}>{doc.setor.nome}</span>
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 4 }}>{doc.nomeDocumento}</div>
                        {doc.dataInicial && (
                          <div style={{ fontSize: 12, color: '#9ca3af' }}>
                            📅 {new Date(doc.dataInicial).toLocaleDateString('pt-BR')}
                            {doc.dataFinal && ` — ${new Date(doc.dataFinal).toLocaleDateString('pt-BR')}`}
                          </div>
                        )}
                        {Object.keys(doc.metadata).length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 20px', marginTop: 10, paddingTop: 10, borderTop: '1px solid #f3f4f6' }}>
                            {Object.entries(doc.metadata)
                              .filter(([, v]) => v !== null && v !== '' && v !== 'null')
                              .slice(0, 6)
                              .map(([k, v]) => (
                                <span key={k} style={{ fontSize: 12 }}>
                                  <span style={{ color: '#9ca3af' }}>{k}: </span>
                                  <span style={{ color: '#374151' }}>{String(v)}</span>
                                </span>
                              ))}
                          </div>
                        )}
                      </div>
                      <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 12, padding: '10px 16px', textAlign: 'right', minWidth: 140, flexShrink: 0 }}>
                        <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 2 }}>Caixa nº</div>
                        <div style={{ fontSize: 13, fontFamily: 'monospace', fontWeight: 700, color: '#374151' }}>{doc.caixa.etiqueta}</div>
                        {doc.caixa.endereco ? (
                          <>
                            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 8, marginBottom: 2 }}>Endereço</div>
                            <div style={{ fontSize: 22, fontFamily: 'monospace', fontWeight: 800, color: '#0284c7', letterSpacing: 1 }}>{doc.caixa.endereco.enderecoCodigo}</div>
                          </>
                        ) : (
                          <div style={{ fontSize: 11, color: '#f59e0b', marginTop: 6 }}>⚠ Sem endereço</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {resultado.totalPaginas > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 24 }}>
                    <button onClick={() => buscar(pagina - 1)} disabled={pagina === 1}
                      style={{ background: '#fff', color: '#6b7280', border: '1.5px solid #e5e7eb', borderRadius: 10, padding: '8px 16px', fontSize: 13, cursor: 'pointer', opacity: pagina === 1 ? 0.4 : 1 }}>← Anterior</button>
                    <span style={{ fontSize: 13, color: '#6b7280' }}>{pagina} / {resultado.totalPaginas}</span>
                    <button onClick={() => buscar(pagina + 1)} disabled={pagina === resultado.totalPaginas}
                      style={{ background: '#fff', color: '#6b7280', border: '1.5px solid #e5e7eb', borderRadius: 10, padding: '8px 16px', fontSize: 13, cursor: 'pointer', opacity: pagina === resultado.totalPaginas ? 0.4 : 1 }}>Próxima →</button>
                  </div>
                )}
              </>
            ) : null
          )}
        </div>
      </main>
    </div>
  )
}

// ─── TipoAutoComplete (string, não Option) ───────────────────
function TipoAutoComplete({ options, disabled, onChange }: {
  options: string[]
  disabled?: boolean
  onChange: (v: string) => void
}) {
  const [texto, setTexto] = useState('')
  const [aberto, setAberto] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false)
    }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  const filtrados = options.filter(o => o.toLowerCase().includes(texto.toLowerCase())).slice(0, 50)

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <input
        type="text"
        placeholder={disabled ? 'Selecione um setor primeiro' : 'Digite o tipo de documento...'}
        value={texto}
        disabled={disabled}
        onChange={e => { setTexto(e.target.value); setAberto(true) }}
        onFocus={() => setAberto(true)}
        style={{ ...inputStyle, opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'text' }}
      />
      {aberto && !disabled && filtrados.length > 0 && (
        <ul style={dropdownStyle}>
          {filtrados.map((o, i) => (
            <li key={o}
              onMouseDown={() => { onChange(o); setTexto(''); setAberto(false) }}
              style={{ padding: '10px 14px', fontSize: 14, cursor: 'pointer', color: '#374151', borderTop: i > 0 ? '1px solid #f3f4f6' : 'none' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#eff6ff')}
              onMouseLeave={e => (e.currentTarget.style.background = '#fff')}>
              {o}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}