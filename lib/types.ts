export type AccountType = 'wallet' | 'checking' | 'savings' | 'credit'
export type CategoryKind = 'income' | 'expense'

export interface BudgetSummary {
  category: string
  planned: number
  realized: number
  variance: number
  progress: number // 0..1+
}
