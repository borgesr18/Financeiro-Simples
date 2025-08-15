# Financeiro Simples (MVP)

MVP de **controle de gastos pessoais** com Next.js 14 (App Router) + Supabase.

## Como rodar

1. Clone este projeto e instale dependências:
   ```bash
   npm i
   ```

2. Crie um projeto no **Supabase** e copie a URL e o Anon Key.

3. Crie `.env.local` na raiz:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   ```

4. No Supabase SQL editor: execute `sql/schema.sql`, depois `sql/policies.sql` e `sql/seed.sql`.

5. Rodar local:
   ```bash
   npm run dev
   ```

6. **Cron diário** (recorrências) – Vercel Cron chama `/api/cron/recurring` às 05:00 UTC. Edite `vercel.json` se quiser outro horário.

---

## Notas técnicas

- Auth SSR com `@supabase/ssr` (cookies HTTP-only, compatível com App Router).
- RLS: políticas por `user_id = auth.uid()` para todas as tabelas de dados.
- UI minimalista com Tailwind.
- Formulários com React Hook Form + Zod.
- Consultas agregadas via funções SQL (`month_totals`, `month_expense_by_category`, `budget_summary_current_month`).

> Referências checadas em 2025-08-15:
> - Vercel Cron + `vercel.json` (docs oficiais).  
> - PWA no App Router (docs Next).  
> - Supabase RLS e Auth com `@supabase/ssr` (docs oficiais).
