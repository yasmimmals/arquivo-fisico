import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET() {
  const usuarios = await prisma.usuario.findMany({ orderBy: { criadoEm: 'desc' } })
  return NextResponse.json(usuarios)
}

export async function POST(request: NextRequest) {
  try {
    const { nome, email, senha, perfil } = await request.json()
    const hash = await bcrypt.hash(senha, 10)
    const usuario = await prisma.usuario.create({ data: { nome, email, senha: hash, perfil } })
    return NextResponse.json(usuario, { status: 201 })
  } catch (e: any) {
    if (e.code === 'P2002') return NextResponse.json({ error: 'Email já cadastrado.' }, { status: 400 })
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}