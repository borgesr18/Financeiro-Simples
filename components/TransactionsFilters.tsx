'use client'

export default function TransactionsFilters({ type }: { type: 'all'|'income'|'expense' }) {
  return (
    <div className="bg-white rounded-xl shadow-card p-4 mb-4 flex items-center gap-2">
      <form className="flex items-center gap-2" onChange={(e) => e.preventDefault()}>
        <select
          name="type"
          defaultValue={type}
          className="border border-neutral-200 rounded-lg px-3 py-2 text-sm"
          onChange={(e) => {
            const val = e.currentTarget.value
            const url = new URL(window.location.href)
            url.searchParams.set('type', val)
            url.searchParams.set('page', '1')
            window.location.assign(url.toString())
          }}
        >
          <option value="all">Todos</option>
          <option value="income">Entradas</option>
          <option value="expense">Saídas</option>
        </select>
      </form>
    </div>
  )
}
