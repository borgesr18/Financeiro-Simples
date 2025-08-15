// components/icons.ts
import {
  FaUtensils,
  FaCar,
  FaBolt,
  FaPiggyBank,
  FaCartShopping, // nome correto no FA6
  FaHeart,
  FaGraduationCap,
  FaHouse,
} from "react-icons/fa6";

export const ICON_OPTIONS = [
  { slug: "utensils", label: "Alimentação", Comp: FaUtensils },
  { slug: "car",      label: "Transporte",  Comp: FaCar },
  { slug: "bolt",     label: "Energia",     Comp: FaBolt },
  { slug: "piggy",    label: "Poupança",    Comp: FaPiggyBank },
  { slug: "cart",     label: "Compras",     Comp: FaCartShopping },
  { slug: "heart",    label: "Saúde",       Comp: FaHeart },
  { slug: "grad",     label: "Educação",    Comp: FaGraduationCap },
  { slug: "home",     label: "Casa",        Comp: FaHouse },
] as const;

export type IconSlug = typeof ICON_OPTIONS[number]["slug"];

export function resolveIcon(slug?: string | null) {
  const found = ICON_OPTIONS.find((i) => i.slug === slug);
  return found?.Comp ?? FaCartShopping; // fallback
}
