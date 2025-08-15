// ...
import BudgetRowActions from '@/components/BudgetRowActions'
// ...

      {/* Lista de categorias */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {lines.length ? (
          lines.map((l) => (
            <div key={`${l.category}-${l.id ?? 'noid'}`} className="space-y-2">
              <BudgetBar
                category={l.category}
                amount={l.amount}
                spent={l.spent}
                percent={l.percent}
                over={l.over}
              />

              {l.hasBudget && l.id ? (
                <BudgetRowActions id={l.id} />
              ) : (
                <div className="flex justify-end">
                  <a
                    href={`/budgets/new?category=${encodeURIComponent(l.category)}&year=${y}&month=${m}&amount=${l.spent || 0}`}
                    className="text-sm text-primary-600 hover:underline"
                  >
                    Criar meta para “{l.category}”
                  </a>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="md:col-span-2 lg:col-span-3">
            <div className="p-6 bg-white border border-neutral-200 rounded-xl text-neutral-600">
              Nenhuma meta definida para este mês.
            </div>
          </div>
        )}
      </section>

