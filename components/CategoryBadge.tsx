// components/CategoryBadge.tsx
import { resolveIcon } from "./IconPicker";

export function CategoryBadge({
  name,
  color_hex,
  icon_slug,
}: { name: string; color_hex?: string | null; icon_slug?: string | null }) {
  const Icon = resolveIcon(icon_slug);
  const color = color_hex ?? "#64748b";
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium"
      style={{ backgroundColor: `${color}20`, color }}
    >
      <Icon className="h-3.5 w-3.5" />
      {name}
    </span>
  );
}
