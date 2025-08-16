'use client'

import { useMemo, useState } from 'react'
import IconPicker from '@/components/IconPicker'
import ColorField from '@/components/ColorField'

type Props = {
  /** name do input hidden para o ícone (default: "icon_slug") */
  nameIcon?: string
  /** name do input hidden para a cor (default: "color_hex") */
  nameColor?: string
  /** valor inicial do ícone (slug), ex: "FaCreditCard" */
  defaultIconSlug?: string | null
  /** valor inicial da cor (hex), ex: "#8b5cf6" */
  defaultColorHex?: string | null
  /** rótulo do grupo */
  label?: string
  /** dica curta abaixo do label */
  hint?: string
}

function normalizeHex(v: string | null | undefined, fallback = '#6b7280') {
  if (!v) return fallback
  const s = v.trim()
  if (/^#[0-9a-fA-F]{6}$/.test(s)) return s
  if (/^[0-9a-fA-F]{6}$/.test(s)) return `#${s}` // aceita sem '#'
  return fallback
}

export default function IconColorPicker({
  nameIcon = 'icon_slug',
  nameColor = 'color_hex',
  defaultIconSlug = 'FaCreditCard',
  defaultColorHex = '#6b7280',
  label = 'Aparência',
  hint,
}: Props) {
  const initialColor = useMemo(() => normalizeHex(defaultColorHex), [defaultColorHex])
  const [icon, setIcon] = useState<string>(defaultIconSlug ?? 'FaCreditCard')
  const [color, setColor] = useState<string>(initialColor)

  return (
    <div className="space-y-2">
      <div>
        <label className="block text-sm font-medium text-neutral-800">{label}</label>
        {hint && <p className="text-xs text-neutral-500 mt-0.5">{hint}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <div className="text-xs text-neutral-500 mb-1">Ícone</div>
          <IconPicker value={icon as any} onChange={(v: any) => setIcon(v)} />
        </div>

        <div>
          <div className="text-xs text-neutral-500 mb-1">Cor</div>
          <ColorField value={color} onChange={(v: string) => setColor(normalizeHex(v))} />
        </div>
      </div>

      {/* valores para a server action */}
      <input type="hidden" name={nameIcon} value={icon ?? ''} />
      <input type="hidden" name={nameColor} value={color ?? ''} />
    </div>
  )
}

