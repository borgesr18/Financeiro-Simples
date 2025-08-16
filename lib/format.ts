// lib/format.ts
// Helpers de formatação (pt-BR)

export const BRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
})

// Compat: alguns arquivos importavam `brl`
export const brl = BRL

// Função conveniente
export const formatBRL = (n: number | null | undefined) => BRL.format(n ?? 0)

// Alias opcional (caso alguém prefira)
export const fmtBRL = formatBRL

