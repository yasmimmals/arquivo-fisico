import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const clientes = await prisma.cliente.findMany({ orderBy: { nome: 'asc' } })
  return NextResponse.json(clientes)
}

export async function POST(request: NextRequest) {
  try {
    const { nome } = await request.json()
    const cliente = await prisma.cliente.create({ data: { nome } })
    return NextResponse.json(cliente, { status: 201 })
  } catch (e: any) {
    if (e.code === 'P2002') return NextResponse.json({ error: 'Cliente já cadastrado.' }, { status: 400 })
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}