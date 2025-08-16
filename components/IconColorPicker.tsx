'use client'

import { useState, useMemo } from 'react'
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
  // aceita sem '#'
  if (/^[0-9a-fA-F]{6}$/.test(s)) return `#${s}`
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
  const initialColor = useMemo(() => normalizeHex(defaultColorHex), [def]()
