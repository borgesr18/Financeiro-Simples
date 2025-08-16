// components/IconPicker.tsx
'use client'

import { useState, useMemo } from 'react'
import {
  FaWallet,
  FaBuildingColumns,
  FaCreditCard,
  FaPiggyBank,
  FaHouse,
  FaCartShopping,
} from 'react-icons/fa6'

type Props = {
  name?: string          // nome do campo para o form (default: "icon_slug")
  value?: string | null  // slug atual
  onChange?: (v: string) => void
  label?: string
}

const ICONS = [
  { slug: 'wallet',       label: 'Carteira',     Icon: FaWallet },
  { slug: 'bank',         label: 'Banco',        Icon: FaBuildingColumns },
  { slug: 'credit-card',  label: 'Cartão',       Icon: FaCreditCard },
  { slug: 'piggy',        label: 'Cofrinho',     Icon: FaPiggyBank },
  { slug: 'house',        label: 'Casa',         Icon: FaHouse },
  { slug: 'shopping',     label: 'Compras',      Icon: FaCartShopping },
] as const

export function iconSlugToComponent(slug?: string | null) {
  const found = ICONS.find(i => i.slug === slug)
  return found?.Icon ?? FaWallet
}

export default function IconPicker({ name = 'icon_slug', value, onChange, label = 'Ícone' }: Props) {
  const [selected, setSelected] = useState<string>(value ?? 'wallet')

  // Mantém input hidden sincronizado com o form
  const hiddenName = useMemo(() => name, [name])

  function select(slug: string) {
    setSelected(slug)
    onChange?.(slug)
  }

  return (
    <div>
      <label className="block text-sm mb-1">{label}</label>
      <input type="hidden" name={hiddenName} value={selected} />
      <div className="grid grid-cols-6 gap-2">
        {ICONS.map(({ slug, label, Icon }) => {
          const active = selected === slug
          return (
            <button
              key={slug}
              type="button"
              onClick={() => select(slug)}
              className={`flex flex-col items-center gap-1 border rounded-lg px-2 py-2 hover:bg-neutral-50
                ${active ? 'border-sky-500 ring-2 ring-sky-200' : 'border-neutral-200'}`}
              title={label}
            >
              <Icon className="text-xl" />
              <span className="text-[11px] text-neutral-600">{label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}


