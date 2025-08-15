// components/IconPicker.tsx
import { useState } from "react";
import { FaUtensils, FaCar, FaBolt, FaPiggyBank, FaShoppingCart, FaHeart, FaGraduationCap, FaHome } from "react-icons/fa6";

const ICONS = {
  utensils: FaUtensils,
  car: FaCar,
  bolt: FaBolt,
  piggy: FaPiggyBank,
  cart: FaShoppingCart,
  heart: FaHeart,
  grad: FaGraduationCap,
  home: FaHome,
} as const;

type IconKey = keyof typeof ICONS;

export function IconPicker({
  value,
  onChange,
}: { value?: IconKey | null; onChange: (v: IconKey) => void }) {
  const [selected, setSelected] = useState<IconKey | undefined>(value ?? undefined);
  return (
    <div className="grid grid-cols-8 gap-2">
      {Object.entries(ICONS).map(([slug, Comp]) => {
        const active = selected === slug;
        return (
          <button
            key={slug}
            type="button"
            onClick={() => { setSelected(slug as IconKey); onChange(slug as IconKey); }}
            className={`p-2 rounded-xl border hover:shadow-sm ${active ? "ring-2 ring-offset-2 ring-indigo-500" : ""}`}
            title={slug}
          >
            <Comp className="w-5 h-5" />
          </button>
        );
      })}
    </div>
  );
}

export function resolveIcon(slug?: string | null) {
  if (!slug) return FaShoppingCart;
  const Comp = (ICONS as any)[slug] ?? FaShoppingCart;
  return Comp;
}
