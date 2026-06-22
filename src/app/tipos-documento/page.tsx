'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Campo {
  id?: string
  nome: string
  label: string
  tipo: 'TEXTO' | 'NUMERO' | 'DATA' | 'SELECAO' | 'BOOLEAN'
  obrigatorio: boolean
  opcoes?: string
}

interface TipoDocumento {
  id: string
  nome: string
  descricao: string | null
  tempGuardaAnos: number
  ativo: boolean
  campos: Campo[]
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

const tiposCampo = [
  { value: 'TEXTO', label: '📝 Texto Livre' },
  { value: 'NUMERO', label: '🔢 Número' },
  { value: 'DATA', label: '📅 Data' },
  { value: 'SELECAO', label: '🗂️ Lista de Seleção' },
  { value: 'BOOLEAN', label: '✅ Sim/Não' },
]

export default function TiposDocumentoPage() {
  const router = useRouter()
  const [tipos, setTipos] = useState<TipoDocumento[]>([])
  const [carregando, setCarregando] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [tipoSel, setTipoSel] = useState<TipoDocumento | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  // Form
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [tempGuarda, setTempGuarda] = useState('5')
  const [campos, setCampos] = useState<Campo[]>([])

  useEffect(() => { carregar() }, [])

  async function carregar() {
    setCarregando(true)
    const res = await fetch('/api/tipos-documento')
    setTipos(await res.json())
    setCarregando(false)
  }

  function abrirModal(tipo?: TipoDocumento) {
    setTipoSel(tipo || null)
    setNome(tipo?.nome || '')
    setDescricao(tipo?.descricao || '')
    setTempGuarda(String(tipo?.tempGuardaAnos || 5))
    setCampos(tipo?.campos || [])
    setErro('')
    setModalAberto(true)
  }

  function adicionarCampo() {
    setCampos([...campos, { nome: '', label: '', tipo: 'TEXTO', obrigatorio: false }])
  }

  function atualizarCampo(i: number, field: keyof Campo, value: any) {
    const novos = [...campos]
    novos[i] = { ...novos[i], [field]: value }
    setCampos(novos)
  }

  function removerCampo(i: number) {
    setCampos(campos.filter((_, idx) => idx !== i))
  }

  async function salvar() {
    if (!nome) { setErro('Nome é obrigatório.'); return }
    setSalvando(true); setErro('')

    const body = { nome, descricao, tempGuardaAnos: parseInt(tempGuarda), campos }
    const res = await fetch(
      tipoSel ? `/api/tipos-documento/${tipoSel.id}` : '/api/tipos-documento',
      { method: tipoSel ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
    )

    if (res.ok) { setModalAberto(false); carregar() }
    else { const d = await res.json(); setErro(d.error || 'Erro ao salvar.') }
    setSalvando(false)
  }

  const s = {
    input: { width: '100%', border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '10px 12px', fontSize: 14, outline: 'none', boxSizing: 'border-box' as const },
    label: { display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 } as React.CSSProperties,
    btnPrimary: { background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
    btnSecondary: { background: '#fff', color: '#475569', border: '1px solid #cbd5e1', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer' },
    btnDanger: { background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' },
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
          const active = item.href === '/tipos-documento'
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
            <div style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>Tipos de Documento</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>Configure as regras de arquivamento, metadados e prazos legais</div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button 
              onClick={async () => {
                if(!confirm('Isso vai ler todas as caixas antigas e gerar os Tipos de Documento. Continuar?')) return;
                setCarregando(true);
                const res = await fetch('/api/admin/sincronizar-tipos', { method: 'POST' });
                const d = await res.json();
                alert(d.message || d.error);
                carregar();
              }} 
              style={{ ...s.btnSecondary, background: '#f8fafc', borderColor: '#cbd5e1' }}
            >
              🔄 Sincronizar Banco Antigo
            </button>
            <button onClick={() => abrirModal()} style={s.btnPrimary}>+ Novo Tipo</button>
          </div>
        </header>

        <div style={{ flex: 1, padding: 32 }}>
          {carregando ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af' }}>Carregando configurações...</div>
          ) : tipos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af', background: '#fff', borderRadius: 16, border: '1px dashed #cbd5e1' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Nenhum tipo configurado</div>
              <div style={{ fontSize: 13, marginBottom: 16 }}>Comece cadastrando documentos como "Notas Fiscais", "Prontuários", etc.</div>
              <button onClick={() => abrirModal()} style={s.btnPrimary}>Cadastrar Primeiro Tipo</button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 20 }}>
              {tipos.map(tipo => (
                <div key={tipo.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{tipo.nome}</div>
                      {tipo.descricao && <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>{tipo.descricao}</div>}
                    </div>
                    <button onClick={() => abrirModal(tipo)} style={s.btnSecondary}>✏️ Editar</button>
                  </div>

                  <div style={{ display: 'flex', gap: 12, marginBottom: 20, background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #f1f5f9' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Prazo Legal</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#0369a1', marginTop: 2 }}>{tipo.tempGuardaAnos} {tipo.tempGuardaAnos === 1 ? 'ano' : 'anos'}</div>
                    </div>
                    <div style={{ width: 1, background: '#e2e8f0' }}></div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Metadados</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#15803d', marginTop: 2 }}>{tipo.campos.length} campos</div>
                    </div>
                  </div>

                  {tipo.campos.length > 0 && (
                    <div style={{ marginTop: 'auto' }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 8 }}>Campos exigidos na caixa:</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {tipo.campos.map((c, i) => (
                          <span key={i} style={{ fontSize: 11, fontWeight: 500, color: '#475569', background: '#f1f5f9', border: '1px solid #e2e8f0', padding: '4px 8px', borderRadius: 4 }}>
                            {c.label} {c.obrigatorio ? <span style={{ color: '#dc2626' }}>*</span> : ''}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal */}
      {modalAberto && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 50, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 20px', overflowY: 'auto' }}
          onClick={e => { if (e.target === e.currentTarget) setModalAberto(false) }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, width: 680, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
              {tipoSel ? 'Editar Configurações do Documento' : 'Novo Tipo de Documento'}
            </div>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>
              Defina como este documento será guardado e quais informações devem ser extraídas.
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 24 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={s.label}>Nome do Documento (Ex: Prontuário Médico, NF-e) *</label>
                <input value={nome} onChange={e => setNome(e.target.value)} style={s.input} placeholder="Digite o nome..." />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={s.label}>Descrição Interna</label>
                <input value={descricao} onChange={e => setDescricao(e.target.value)} style={s.input} placeholder="Para que serve este documento? (Opcional)" />
              </div>
              <div style={{ gridColumn: '1 / -1', background: '#f0f9ff', border: '1px solid #bae6fd', padding: 16, borderRadius: 8 }}>
                <label style={{ ...s.label, color: '#0369a1' }}>Temporalidade / Prazo de Guarda (Anos) *</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <input type="number" value={tempGuarda} onChange={e => setTempGuarda(e.target.value)} style={{ ...s.input, width: 100, borderColor: '#bae6fd' }} min="1" max="100" />
                  <span style={{ fontSize: 12, color: '#0284c7' }}>Anos após a data do documento para que ele seja <b>Expurgado (destruído)</b>.</span>
                </div>
              </div>
            </div>

            {/* Campos dinâmicos */}
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 24, marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Metadados (Campos Dinâmicos)</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>Quais informações o operador deve preencher na hora de guardar a caixa?</div>
                </div>
                <button onClick={adicionarCampo} style={{ ...s.btnPrimary, background: '#10b981', fontSize: 13 }}>+ Adicionar Campo</button>
              </div>

              {campos.length === 0 && (
                <div style={{ textAlign: 'center', padding: '30px 0', background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: 8, color: '#64748b', fontSize: 13 }}>
                  Nenhum campo configurado. Clique em "+ Adicionar Campo".
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {campos.map((campo, i) => (
                  <div key={i} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 16, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, marginBottom: 12 }}>
                      <div>
                        <label style={s.label}>Nome do Campo (Visível ao Usuário)</label>
                        <input value={campo.label} onChange={e => {
                          atualizarCampo(i, 'label', e.target.value);
                          if (!campo.nome) atualizarCampo(i, 'nome', e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '_'));
                        }} style={s.input} placeholder="Ex: Nome do Funcionário" />
                      </div>
                      <div>
                        <label style={s.label}>Variável Interna</label>
                        <input value={campo.nome} onChange={e => atualizarCampo(i, 'nome', e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '_'))} style={{ ...s.input, background: '#f8fafc', color: '#64748b' }} placeholder="nome_funcionario" />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 16, alignItems: 'center' }}>
                      <div>
                        <label style={s.label}>Tipo de Dado</label>
                        <select value={campo.tipo} onChange={e => atualizarCampo(i, 'tipo', e.target.value)} style={s.input}>
                          {tiposCampo.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingTop: 16 }}>
                        <input type="checkbox" id={`obrig-${i}`} checked={campo.obrigatorio} onChange={e => atualizarCampo(i, 'obrigatorio', e.target.checked)} style={{ width: 16, height: 16 }} />
                        <label htmlFor={`obrig-${i}`} style={{ fontSize: 13, fontWeight: 600, color: '#475569', cursor: 'pointer' }}>Obrigatório</label>
                      </div>

                      <div style={{ paddingTop: 16 }}>
                        <button onClick={() => removerCampo(i)} style={s.btnDanger}>Excluir</button>
                      </div>
                    </div>

                    {campo.tipo === 'SELECAO' && (
                      <div style={{ marginTop: 12, background: '#f8fafc', padding: 12, borderRadius: 6, border: '1px solid #e2e8f0' }}>
                        <label style={s.label}>Opções da Lista (Separe por vírgula)</label>
                        <input value={campo.opcoes || ''} onChange={e => atualizarCampo(i, 'opcoes', e.target.value)} style={s.input} placeholder="Ex: Admissional, Demissional, Férias" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {erro && <div style={{ marginBottom: 16, fontSize: 13, color: '#dc2626', background: '#fef2f2', padding: '12px', borderRadius: 8, border: '1px solid #fecaca' }}>{erro}</div>}

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0', paddingTop: 20 }}>
              <button onClick={() => setModalAberto(false)} style={s.btnSecondary}>Cancelar</button>
              <button onClick={salvar} disabled={salvando} style={{ ...s.btnPrimary, opacity: salvando ? 0.7 : 1 }}>
                {salvando ? 'Salvando...' : 'Salvar Configurações'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}