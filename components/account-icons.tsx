// components/account-icons.tsx
// Arquivo "server-safe" (sem 'use client') para mapear slugs -> ícones
import { IconType } from 'react-icons'
import {
  FaWallet,
  FaBuildingColumns,
  FaCreditCard,
  FaPiggyBank,
  FaHouse,
  FaCartShopping,
} from 'react-icons/fa6'

const MAP: Record<string, IconType> = {
  'wallet': FaWallet,
  'bank': FaBuildingColumns,
  'credit-card': FaCreditCard,
  'piggy': FaPiggyBank,
  'house': FaHouse,
  'shopping': FaCartShopping,
}

export function getAccountIcon(slug?: string | null): IconType {
  return MAP[slug ?? ''] ?? FaWallet
}

export function AccountIcon(
  { slug, className }: { slug?: string | null; className?: string }
) {
  const Ico = getAccountIcon(slug)
  return <Ico className={className ?? ''} />
}
