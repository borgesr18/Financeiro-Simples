export function parseMoney(input: string): number {
  const s = input.replace(/[\sR$]/g,'').replace(',','.')
  const n = Number(s)
  if (Number.isNaN(n)) throw new Error('Invalid money')
  return n
}
