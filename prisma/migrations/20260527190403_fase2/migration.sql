/*
  Warnings:

  - You are about to drop the column `tipoDocumento` on the `documentos` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "TipoCampo" AS ENUM ('TEXTO', 'NUMERO', 'DATA', 'SELECAO', 'BOOLEAN');

-- CreateEnum
CREATE TYPE "TipoSolicitacao" AS ENUM ('NORMAL', 'URGENTE');

-- CreateEnum
CREATE TYPE "StatusSolicitacao" AS ENUM ('PENDENTE', 'APROVADA', 'EM_ROTA', 'ENTREGUE', 'DEVOLVIDA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "StatusDescarte" AS ENUM ('PENDENTE', 'APROVADO', 'EXECUTADO', 'CANCELADO');

-- AlterTable
ALTER TABLE "documentos" DROP COLUMN "tipoDocumento",
ADD COLUMN     "dataFimGuarda" TIMESTAMP(3),
ADD COLUMN     "nomeDocumento" TEXT,
ADD COLUMN     "solicitante" TEXT,
ADD COLUMN     "tipoDocumentoId" TEXT;

-- CreateTable
CREATE TABLE "tipos_documento" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "tempGuardaAnos" INTEGER NOT NULL DEFAULT 5,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tipos_documento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campos_tipo_documento" (
    "id" TEXT NOT NULL,
    "tipoDocumentoId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "tipo" "TipoCampo" NOT NULL DEFAULT 'TEXTO',
    "obrigatorio" BOOLEAN NOT NULL DEFAULT false,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "opcoes" TEXT,

    CONSTRAINT "campos_tipo_documento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "solicitacoes" (
    "id" TEXT NOT NULL,
    "caixaId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "tipo" "TipoSolicitacao" NOT NULL DEFAULT 'NORMAL',
    "status" "StatusSolicitacao" NOT NULL DEFAULT 'PENDENTE',
    "motivo" TEXT,
    "localEntrega" TEXT,
    "prazoHoras" INTEGER NOT NULL DEFAULT 24,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atendidoEm" TIMESTAMP(3),

    CONSTRAINT "solicitacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entregas" (
    "id" TEXT NOT NULL,
    "solicitacaoId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "observacao" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "entregas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "descartes" (
    "id" TEXT NOT NULL,
    "status" "StatusDescarte" NOT NULL DEFAULT 'PENDENTE',
    "motivo" TEXT,
    "metodo" TEXT,
    "aprovadoPor" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "executadoEm" TIMESTAMP(3),

    CONSTRAINT "descartes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "caixas_descarte" (
    "id" TEXT NOT NULL,
    "descarteId" TEXT NOT NULL,
    "caixaId" TEXT NOT NULL,

    CONSTRAINT "caixas_descarte_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissoes_usuarios" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "clienteId" TEXT,
    "setorId" TEXT,

    CONSTRAINT "permissoes_usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tipos_documento_nome_key" ON "tipos_documento"("nome");

-- AddForeignKey
ALTER TABLE "campos_tipo_documento" ADD CONSTRAINT "campos_tipo_documento_tipoDocumentoId_fkey" FOREIGN KEY ("tipoDocumentoId") REFERENCES "tipos_documento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_tipoDocumentoId_fkey" FOREIGN KEY ("tipoDocumentoId") REFERENCES "tipos_documento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacoes" ADD CONSTRAINT "solicitacoes_caixaId_fkey" FOREIGN KEY ("caixaId") REFERENCES "caixas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacoes" ADD CONSTRAINT "solicitacoes_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entregas" ADD CONSTRAINT "entregas_solicitacaoId_fkey" FOREIGN KEY ("solicitacaoId") REFERENCES "solicitacoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "caixas_descarte" ADD CONSTRAINT "caixas_descarte_descarteId_fkey" FOREIGN KEY ("descarteId") REFERENCES "descartes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "caixas_descarte" ADD CONSTRAINT "caixas_descarte_caixaId_fkey" FOREIGN KEY ("caixaId") REFERENCES "caixas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permissoes_usuarios" ADD CONSTRAINT "permissoes_usuarios_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permissoes_usuarios" ADD CONSTRAINT "permissoes_usuarios_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permissoes_usuarios" ADD CONSTRAINT "permissoes_usuarios_setorId_fkey" FOREIGN KEY ("setorId") REFERENCES "setores"("id") ON DELETE SET NULL ON UPDATE CASCADE;
