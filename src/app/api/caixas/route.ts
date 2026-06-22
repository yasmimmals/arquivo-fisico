import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const pagina = parseInt(searchParams.get('pagina') || '1')
  const busca = searchParams.get('busca') || ''
  const porPagina = 20
  const where: any = {}

  if (busca) {
    where.OR = [
      { etiqueta: { contains: busca, mode: 'insensitive' } },
      { cliente: { nome: { contains: busca, mode: 'insensitive' } } },
      { endereco: { enderecoCodigo: { contains: busca, mode: 'insensitive' } } },
    ]
  }

  const [total, caixas] = await Promise.all([
    prisma.caixa.count({ where }),
    prisma.caixa.findMany({
      where,
      include: {
        cliente: true,
        endereco: true,
        _count: { select: { documentos: true } },
      },
      orderBy: { criadoEm: 'desc' },
      skip: (pagina - 1) * porPagina,
      take: porPagina,
    }),
  ])

  return NextResponse.json({ total, pagina, totalPaginas: Math.ceil(total / porPagina), caixas })
}

export async function POST(request: NextRequest) {
  try {
    const {
      etiqueta, clienteId, enderecoCodigo, observacao,
      tipoDocumentoId, camposValores, dataInicial, dataFinal, solicitante
    } = await request.json()

    // Numeração automática se não informada
    let etiquetaFinal = etiqueta?.trim()
    if (!etiquetaFinal) {
      const ultima = await prisma.caixa.findFirst({
        orderBy: { criadoEm: 'desc' },
        select: { etiqueta: true },
      })
      const proximoNumero = ultima ? (parseInt(ultima.etiqueta) || 0) + 1 : 1
      etiquetaFinal = String(proximoNumero)
    }

    let enderecoId: string | undefined = undefined
    if (enderecoCodigo) {
      const match = enderecoCodigo.match(/^(\d+)([A-Z]+)(\d{2})(\d{2})(\d{2})$/)
      if (!match) return NextResponse.json({ error: 'Endereço inválido. Use o formato 10A010101' }, { status: 400 })

      const endereco = await prisma.endereco.upsert({
        where: { enderecoCodigo },
        update: {},
        create: {
          barracão: parseInt(match[1]),
          corredor: match[2],
          prateleira: parseInt(match[3]),
          andar: parseInt(match[4]),
          posicao: parseInt(match[5]),
          enderecoCodigo,
        },
      })
      enderecoId = endereco.id
    }

    const setor = await prisma.setor.findFirst({ where: { clienteId } })

    const caixa = await prisma.caixa.create({
      data: {
        etiqueta: etiquetaFinal,
        clienteId,
        enderecoId,
        observacao,
        status: 'ATIVA',
        documentos: {
          create: {
            setorId: setor?.id || '',
            tipoDocumentoId: tipoDocumentoId || null,
            nomeDocumento: camposValores?.nome || 'Documento Geral',
            metadata: camposValores || {},
            dataInicial: dataInicial ? new Date(dataInicial) : null,
            dataFinal: dataFinal ? new Date(dataFinal) : null,
            solicitante: solicitante || null,
          }
        }
      },
      include: { documentos: true }
    })

    return NextResponse.json(caixa, { status: 201 })
  } catch (e: any) {
    if (e.code === 'P2002') return NextResponse.json({ error: 'Etiqueta já cadastrada.' }, { status: 400 })
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}