// components/ColorField.tsx
'use client'

import { useEffect, useMemo, useState } from 'react'

type Props = {
  name?: string          // nome do campo para o form (default: "color_hex")
  value?: string | null  // ex: "#22c55e"
  onChange?: (hex: string) => void
  label?: string
}

const PALETTE = ['#22c55e', '#0ea5e9', '#f97316', '#ef4444', '#a855f7', '#eab308', '#14b8a6', '#64748b']

export default function ColorField({ name = 'color_hex', value, onChange, label = 'Cor' }: Props) {
  const [hex, setHex] = useState<string>(value && /^#/.test(value) ? value : (value ?? ''))

  useEffect(() => {
    onChange?.(hex)
  }, [hex, onChange])

  const hiddenName = useMemo(() => name, [name])

  return (
    <div>
      <label className="block text-sm mb-1">{label}</label>
      {/* hidden para o form receber sempre o valor atual */}
      <input type="hidden" name={hiddenName} value={hex || ''} />
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={hex || '#22c55e'}
          onChange={(e) => setHex(e.target.value)}
          className="h-10 w-10 cursor-pointer rounded border"
          title="Seletor de cor"
        />
        <input
          value={hex}
          onChange={(e) => setHex(e.target.value)}
          placeholder="#22c55e"
          className="flex-1 rounded border px-3 py-2"
        />
      </div>
      <div className="flex flex-wrap gap-2 mt-2">
        {PALETTE.map(c => (
          <button
            key={c}
            type="button"
            onClick={() => setHex(c)}
            className="h-7 w-7 rounded-full border"
            style={{ background: c }}
            title={c}
          />
        ))}
      </div>
    </div>
  )
}
