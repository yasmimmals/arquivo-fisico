import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Busca os documentos que têm data inicial e um tipo com tempo de guarda configurado
    const documentos = await prisma.documento.findMany({
      where: {
        dataInicial: { not: null },
        tipoDocumento: { isNot: null }
      },
      include: {
        caixa: { include: { cliente: true, endereco: true } },
        tipoDocumento: true
      }
    })

    const hoje = new Date()
    const noventaDias = new Date()
    noventaDias.setDate(hoje.getDate() + 90)

    const vencidos: any[] = []
    const aVencer: any[] = []
    const regulares: any[] = []

    documentos.forEach((doc: any) => {
      if (!doc.dataInicial || !doc.tipoDocumento) return

      // Calcula a data de vencimento (Data Inicial + Anos de Guarda)
      const dataVencimento = new Date(doc.dataInicial)
      dataVencimento.setFullYear(dataVencimento.getFullYear() + doc.tipoDocumento.tempGuardaAnos)

      const item = { ...doc, dataVencimento }

      // Separa nas listas corretas
      if (dataVencimento < hoje) {
        vencidos.push(item)
      } else if (dataVencimento <= noventaDias) {
        aVencer.push(item)
      } else {
        regulares.push(item)
      }
    })

    // Ordena as listas (os que venceram há mais tempo primeiro)
    vencidos.sort((a, b) => a.dataVencimento - b.dataVencimento)
    aVencer.sort((a, b) => a.dataVencimento - b.dataVencimento)
    regulares.sort((a, b) => a.dataVencimento - b.dataVencimento)

    return NextResponse.json({ vencidos, aVencer, regulares })
  } catch (erro: any) {
    return NextResponse.json({ error: erro.message }, { status: 500 })
  }
}