// lib/format.ts
export const BRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
})

export const formatBRL = (n: number | null | undefined) => BRL.format(n ?? 0)
