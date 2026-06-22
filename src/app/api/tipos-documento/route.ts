import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const tipos = await prisma.tipoDocumento.findMany({
    where: { ativo: true },
    include: { campos: { orderBy: { ordem: 'asc' } } },
    orderBy: { nome: 'asc' },
  })
  return NextResponse.json(tipos)
}

export async function POST(request: NextRequest) {
  try {
    const { nome, descricao, tempGuardaAnos, campos } = await request.json()

    const tipo = await prisma.tipoDocumento.create({
      data: {
        nome,
        descricao,
        tempGuardaAnos: parseInt(tempGuardaAnos) || 5,
        campos: {
          create: campos?.map((c: any, i: number) => ({
            nome: c.nome,
            label: c.label,
            tipo: c.tipo,
            obrigatorio: c.obrigatorio || false,
            ordem: i,
            opcoes: c.opcoes || null,
          })) || [],
        },
      },
      include: { campos: true },
    })

    return NextResponse.json(tipo, { status: 201 })
  } catch (e: any) {
    if (e.code === 'P2002') return NextResponse.json({ error: 'Tipo já cadastrado.' }, { status: 400 })
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}