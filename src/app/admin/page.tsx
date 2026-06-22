'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Usuario { id: string; nome: string; email: string; perfil: string; ativo: boolean; criadoEm: string }
interface Cliente { id: string; nome: string; ativo: boolean; criadoEm: string }

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

const perfilLabel: Record<string, { label: string; color: string; bg: string }> = {
  ADMIN:    { label: 'Admin',    color: '#7c3aed', bg: '#f5f3ff' },
  OPERADOR: { label: 'Operador', color: '#0369a1', bg: '#e0f2fe' },
  CONSULTA: { label: 'Consulta', color: '#6b7280', bg: '#f3f4f6' },
}

export default function AdminPage() {
  const router = useRouter()
  const [aba, setAba] = useState<'usuarios' | 'clientes' | 'barracao'>('usuarios')
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [carregando, setCarregando] = useState(false)

  // Modal usuário
  const [modalUsuario, setModalUsuario] = useState(false)
  const [usuarioSel, setUsuarioSel] = useState<Usuario | null>(null)
  const [uNome, setUNome] = useState('')
  const [uEmail, setUEmail] = useState('')
  const [uSenha, setUSenha] = useState('')
  const [uPerfil, setUPerfil] = useState('OPERADOR')
  const [uErro, setUErro] = useState('')
  const [uSalvando, setUSalvando] = useState(false)

  // Modal cliente
  const [modalCliente, setModalCliente] = useState(false)
  const [clienteSel, setClienteSel] = useState<Cliente | null>(null)
  const [cNome, setCNome] = useState('')
  const [cErro, setCErro] = useState('')
  const [cSalvando, setCSalvando] = useState(false)

  // Barracão
  const [bCorredor, setBCorredor] = useState('')
  const [bPrateleiras, setBPrateleiras] = useState('')
  const [bAndares, setBAndares] = useState('')
  const [bPosicoes, setBPosicoes] = useState('')
  const [bBarracão, setBBarracão] = useState('10')
  const [bGerando, setBGerando] = useState(false)
  const [bMsg, setBMsg] = useState('')

  useEffect(() => { carregarUsuarios(); carregarClientes() }, [])

  async function carregarUsuarios() {
    setCarregando(true)
    const res = await fetch('/api/admin/usuarios')
    setUsuarios(await res.json())
    setCarregando(false)
  }

  async function carregarClientes() {
    const res = await fetch('/api/admin/clientes')
    setClientes(await res.json())
  }

  function abrirModalUsuario(u?: Usuario) {
    setUsuarioSel(u || null)
    setUNome(u?.nome || ''); setUEmail(u?.email || '')
    setUSenha(''); setUPerfil(u?.perfil || 'OPERADOR'); setUErro('')
    setModalUsuario(true)
  }

  async function salvarUsuario() {
    if (!uNome || !uEmail) { setUErro('Nome e email são obrigatórios.'); return }
    if (!usuarioSel && !uSenha) { setUErro('Senha é obrigatória para novo usuário.'); return }
    setUSalvando(true); setUErro('')
    const body: any = { nome: uNome, email: uEmail, perfil: uPerfil }
    if (uSenha) body.senha = uSenha
    const res = await fetch(
      usuarioSel ? `/api/admin/usuarios/${usuarioSel.id}` : '/api/admin/usuarios',
      { method: usuarioSel ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
    )
    if (res.ok) { setModalUsuario(false); carregarUsuarios() }
    else { const d = await res.json(); setUErro(d.error || 'Erro ao salvar.') }
    setUSalvando(false)
  }

  async function toggleUsuario(id: string, ativo: boolean) {
    await fetch(`/api/admin/usuarios/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ativo: !ativo }) })
    carregarUsuarios()
  }

  function abrirModalCliente(c?: Cliente) {
    setClienteSel(c || null)
    setCNome(c?.nome || ''); setCErro('')
    setModalCliente(true)
  }

  async function salvarCliente() {
    if (!cNome) { setCErro('Nome é obrigatório.'); return }
    setCSalvando(true); setCErro('')
    const res = await fetch(
      clienteSel ? `/api/admin/clientes/${clienteSel.id}` : '/api/admin/clientes',
      { method: clienteSel ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nome: cNome }) }
    )
    if (res.ok) { setModalCliente(false); carregarClientes() }
    else { const d = await res.json(); setCErro(d.error || 'Erro ao salvar.') }
    setCSalvando(false)
  }

  async function gerarEstrutura() {
    if (!bCorredor || !bPrateleiras || !bAndares || !bPosicoes) { setBMsg('Preencha todos os campos.'); return }
    setBGerando(true); setBMsg('')
    const res = await fetch('/api/admin/barracao', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ barracão: parseInt(bBarracão), corredor: bCorredor.toUpperCase(), prateleiras: parseInt(bPrateleiras), andares: parseInt(bAndares), posicoes: parseInt(bPosicoes) })
    })
    const d = await res.json()
    setBMsg(d.message || d.error || '')
    setBGerando(false)
  }

  const s = {
    sidebar: { width: 220, minWidth: 220, background: '#fff', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column' as const, padding: '24px 0', minHeight: '100vh' },
    navBtn: (active: boolean) => ({ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px', fontSize: 14, fontWeight: active ? 600 : 400, color: active ? '#2563eb' : '#6b7280', background: active ? '#eff6ff' : 'transparent', borderLeft: active ? '3px solid #2563eb' : '3px solid transparent', cursor: 'pointer', border: 'none', width: '100%', textAlign: 'left' as const }),
    card: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' },
    btnPrimary: { background: '#2563eb', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
    btnSecondary: { background: '#fff', color: '#6b7280', border: '1.5px solid #e5e7eb', borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer' },
    input: { width: '100%', border: '1.5px solid #e5e7eb', borderRadius: 10, padding: '10px 12px', fontSize: 14, outline: 'none', boxSizing: 'border-box' as const },
    label: { display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 6 },
    overlay: { position: 'fixed' as const, inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    modal: { background: '#fff', borderRadius: 20, padding: 32, width: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' },
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <aside style={s.sidebar}>
        <div style={{ padding: '0 20px 24px', borderBottom: '1px solid #f3f4f6', marginBottom: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>📦 ArquivoFísico</div>
          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>Sistema de gestão</div>
        </div>
        {NAV.map(item => (
          <button key={item.label} onClick={() => router.push(item.href)} style={s.navBtn(item.href === '/admin')}>
            {item.icon} {item.label}
          </button>
        ))}
      </aside>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '16px 32px' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>Administração</div>
          <div style={{ fontSize: 12, color: '#9ca3af' }}>Gerencie usuários, clientes e estrutura do barracão</div>
        </header>

        <div style={{ flex: 1, padding: 32 }}>
          {/* Abas */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: '#f3f4f6', borderRadius: 12, padding: 4, width: 'fit-content' }}>
            {[
              { key: 'usuarios', label: '👤 Usuários' },
              { key: 'clientes', label: '🏢 Clientes' },
              { key: 'barracao', label: '🏗️ Barracão' },
            ].map(a => (
              <button key={a.key} onClick={() => setAba(a.key as any)}
                style={{ padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none', background: aba === a.key ? '#fff' : 'transparent', color: aba === a.key ? '#111827' : '#6b7280', boxShadow: aba === a.key ? '0 1px 4px rgba(0,0,0,0.1)' : 'none' }}>
                {a.label}
              </button>
            ))}
          </div>

          {/* Aba Usuários */}
          {aba === 'usuarios' && (
            <div style={s.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>Usuários do sistema</div>
                <button onClick={() => abrirModalUsuario()} style={s.btnPrimary}>+ Novo usuário</button>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f3f4f6' }}>
                    {['Nome', 'Email', 'Perfil', 'Status', 'Ações'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((u, i) => (
                    <tr key={u.id} style={{ borderBottom: '1px solid #f9fafb', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                      <td style={{ padding: '12px', fontSize: 13, fontWeight: 600, color: '#111827' }}>{u.nome}</td>
                      <td style={{ padding: '12px', fontSize: 13, color: '#6b7280' }}>{u.email}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: perfilLabel[u.perfil]?.color, background: perfilLabel[u.perfil]?.bg, padding: '3px 10px', borderRadius: 20 }}>
                          {perfilLabel[u.perfil]?.label}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: u.ativo ? '#15803d' : '#dc2626', background: u.ativo ? '#f0fdf4' : '#fef2f2', padding: '3px 10px', borderRadius: 20 }}>
                          {u.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => abrirModalUsuario(u)} style={s.btnSecondary}>✏️ Editar</button>
                          <button onClick={() => toggleUsuario(u.id, u.ativo)}
                            style={{ ...s.btnSecondary, color: u.ativo ? '#dc2626' : '#15803d', borderColor: u.ativo ? '#fecaca' : '#bbf7d0' }}>
                            {u.ativo ? 'Desativar' : 'Ativar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {usuarios.length === 0 && (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af', fontSize: 14 }}>Nenhum usuário cadastrado.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Aba Clientes */}
          {aba === 'clientes' && (
            <div style={s.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>Clientes cadastrados</div>
                <button onClick={() => abrirModalCliente()} style={s.btnPrimary}>+ Novo cliente</button>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f3f4f6' }}>
                    {['Nome', 'Status', 'Cadastrado em', 'Ações'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {clientes.map((c, i) => (
                    <tr key={c.id} style={{ borderBottom: '1px solid #f9fafb', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                      <td style={{ padding: '12px', fontSize: 13, fontWeight: 600, color: '#111827' }}>{c.nome}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: c.ativo ? '#15803d' : '#dc2626', background: c.ativo ? '#f0fdf4' : '#fef2f2', padding: '3px 10px', borderRadius: 20 }}>
                          {c.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td style={{ padding: '12px', fontSize: 13, color: '#6b7280' }}>{new Date(c.criadoEm).toLocaleDateString('pt-BR')}</td>
                      <td style={{ padding: '12px' }}>
                        <button onClick={() => abrirModalCliente(c)} style={s.btnSecondary}>✏️ Editar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Aba Barracão */}
          {aba === 'barracao' && (
            <div style={s.card}>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 8 }}>Gerar estrutura do barracão</div>
              <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 24 }}>
                Cadastra automaticamente todos os endereços de um corredor. Use para registrar posições livres no mapa.
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, maxWidth: 480 }}>
                <div>
                  <label style={s.label}>Barracão</label>
                  <input value={bBarracão} onChange={e => setBBarracão(e.target.value)} style={s.input} placeholder="Ex: 10" />
                </div>
                <div>
                  <label style={s.label}>Corredor</label>
                  <input value={bCorredor} onChange={e => setBCorredor(e.target.value.toUpperCase())} style={s.input} placeholder="Ex: A" maxLength={2} />
                </div>
                <div>
                  <label style={s.label}>Nº de prateleiras</label>
                  <input type="number" value={bPrateleiras} onChange={e => setBPrateleiras(e.target.value)} style={s.input} placeholder="Ex: 30" />
                </div>
                <div>
                  <label style={s.label}>Andares por prateleira</label>
                  <input type="number" value={bAndares} onChange={e => setBAndares(e.target.value)} style={s.input} placeholder="Ex: 5" />
                </div>
                <div>
                  <label style={s.label}>Posições por andar</label>
                  <input type="number" value={bPosicoes} onChange={e => setBPosicoes(e.target.value)} style={s.input} placeholder="Ex: 10" />
                </div>
              </div>
              <div style={{ marginTop: 20 }}>
                <button onClick={gerarEstrutura} disabled={bGerando} style={{ ...s.btnPrimary, opacity: bGerando ? 0.6 : 1 }}>
                  {bGerando ? 'Gerando...' : '🏗️ Gerar endereços'}
                </button>
              </div>
              {bMsg && (
                <div style={{ marginTop: 16, fontSize: 13, color: bMsg.includes('erro') ? '#dc2626' : '#15803d', background: bMsg.includes('erro') ? '#fef2f2' : '#f0fdf4', padding: '10px 16px', borderRadius: 10 }}>
                  {bMsg}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Modal Usuário */}
      {modalUsuario && (
        <div style={s.overlay} onClick={e => { if (e.target === e.currentTarget) setModalUsuario(false) }}>
          <div style={s.modal}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 24 }}>
              {usuarioSel ? '✏️ Editar usuário' : '👤 Novo usuário'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div><label style={s.label}>Nome *</label><input value={uNome} onChange={e => setUNome(e.target.value)} style={s.input} /></div>
              <div><label style={s.label}>Email *</label><input type="email" value={uEmail} onChange={e => setUEmail(e.target.value)} style={s.input} /></div>
              <div><label style={s.label}>Senha {usuarioSel ? '(deixe em branco para manter)' : '*'}</label><input type="password" value={uSenha} onChange={e => setUSenha(e.target.value)} style={s.input} /></div>
              <div>
                <label style={s.label}>Perfil</label>
                <select value={uPerfil} onChange={e => setUPerfil(e.target.value)} style={s.input}>
                  <option value="ADMIN">Admin</option>
                  <option value="OPERADOR">Operador</option>
                  <option value="CONSULTA">Consulta</option>
                </select>
              </div>
            </div>
            {uErro && <div style={{ marginTop: 12, fontSize: 13, color: '#dc2626', background: '#fef2f2', padding: '8px 12px', borderRadius: 8 }}>{uErro}</div>}
            <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
              <button onClick={() => setModalUsuario(false)} style={s.btnSecondary}>Cancelar</button>
              <button onClick={salvarUsuario} disabled={uSalvando} style={{ ...s.btnPrimary, opacity: uSalvando ? 0.6 : 1 }}>{uSalvando ? 'Salvando...' : 'Salvar'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cliente */}
      {modalCliente && (
        <div style={s.overlay} onClick={e => { if (e.target === e.currentTarget) setModalCliente(false) }}>
          <div style={s.modal}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 24 }}>
              {clienteSel ? '✏️ Editar cliente' : '🏢 Novo cliente'}
            </div>
            <div><label style={s.label}>Nome do cliente *</label><input value={cNome} onChange={e => setCNome(e.target.value)} style={s.input} /></div>
            {cErro && <div style={{ marginTop: 12, fontSize: 13, color: '#dc2626', background: '#fef2f2', padding: '8px 12px', borderRadius: 8 }}>{cErro}</div>}
            <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
              <button onClick={() => setModalCliente(false)} style={s.btnSecondary}>Cancelar</button>
              <button onClick={salvarCliente} disabled={cSalvando} style={{ ...s.btnPrimary, opacity: cSalvando ? 0.6 : 1 }}>{cSalvando ? 'Salvando...' : 'Salvar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}