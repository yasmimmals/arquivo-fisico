import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const enderecos = await prisma.endereco.findMany({
    include: {
      caixa: {
        include: { cliente: true },
      },
    },
    orderBy: [
      { corredor: 'asc' },
      { prateleira: 'asc' },
      { andar: 'asc' },
      { posicao: 'asc' },
    ],
  })

  return NextResponse.json({ enderecos })
}