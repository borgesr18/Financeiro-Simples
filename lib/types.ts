export type TxType = 'income' | 'expense'

export interface Transaction {
  id: string
  user_id: string
  created_at: string
  date: string
  description: string
  amount: number // positivo = income; negativo = expense
  category: string | null
  type: TxType
}
