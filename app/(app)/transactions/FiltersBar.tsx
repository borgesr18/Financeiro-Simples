// app/(app)/transactions/FiltersBar.tsx
"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function FiltersBar({ categories }: { categories: { id: string; name: string }[] }) {
  const sp = useSearchParams();
  const router = useRouter();

  const [from, setFrom] = useState(sp.get("from") ?? "");
  const [to, setTo] = useState(sp.get("to") ?? "");
  const [type, setType] = useState(sp.get("type") ?? "");
  const [cat, setCat] = useState(sp.get("cat") ?? "");
  const [min, setMin] = useState(sp.get("min") ?? "");
  const [max, setMax] = useState(sp.get("max") ?? "");

  useEffect(() => {
    setFrom(sp.get("from") ?? "");
    setTo(sp.get("to") ?? "");
    setType(sp.get("type") ?? "");
    setCat(sp.get("cat") ?? "");
    setMin(sp.get("min") ?? "");
    setMax(sp.get("max") ?? "");
  }, [sp]);

  function apply() {
    const p = new URLSearchParams();
    if (from) p.set("from", from);
    if (to) p.set("to", to);
    if (type) p.set("type", type);
    if (cat) p.set("cat", cat);
    if (min) p.set("min", min);
    if (max) p.set("max", max);
    router.push(`/transactions?${p.toString()}`);
  }

  function reset() { router.push(`/transactions`); }

  return (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-2 items-end">
      <div><label className="text-xs">De</label><input type="date" value={from} onChange={e=>setFrom(e.target.value)} className="w-full rounded border p-2" /></div>
      <div><label className="text-xs">Até</label><input type="date" value={to} onChange={e=>setTo(e.target.value)} className="w-full rounded border p-2" /></div>
      <div>
        <label className="text-xs">Tipo</label>
        <select value={type} onChange={e=>setType(e.target.value)} className="w-full rounded border p-2">
          <option value="">Todos</option>
          <option value="expense">Despesa</option>
          <option value="income">Receita</option>
        </select>
      </div>
      <div>
        <label className="text-xs">Categoria</label>
        <select value={cat} onChange={e=>setCat(e.target.value)} className="w-full rounded border p-2">
          <option value="">Todas</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div><label className="text-xs">Mín (R$)</label><input inputMode="decimal" value={min} onChange={e=>setMin(e.target.value)} className="w-full rounded border p-2" /></div>
      <div><label className="text-xs">Máx (R$)</label><input inputMode="decimal" value={max} onChange={e=>setMax(e.target.value)} className="w-full rounded border p-2" /></div>

      <div className="col-span-2 md:col-span-6 flex gap-2">
        <button onClick={apply} className="px-3 py-2 rounded bg-indigo-600 text-white">Aplicar</button>
        <button onClick={reset} className="px-3 py-2 rounded border">Limpar</button>
      </div>
    </div>
  );
}
