import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { barracão, corredor, prateleiras, andares, posicoes } = await request.json()
    let criados = 0

    for (let p = 1; p <= prateleiras; p++) {
      for (let a = 1; a <= andares; a++) {
        for (let pos = 1; pos <= posicoes; pos++) {
          const codigo = `${barracão}${corredor}${String(p).padStart(2, '0')}${String(a).padStart(2, '0')}${String(pos).padStart(2, '0')}`
          await prisma.endereco.upsert({
            where: { enderecoCodigo: codigo },
            update: {},
            create: { barracão, corredor, prateleira: p, andar: a, posicao: pos, enderecoCodigo: codigo },
          })
          criados++
        }
      }
    }

    return NextResponse.json({ message: `✅ ${criados} endereços gerados com sucesso para o Corredor ${corredor}!` })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}