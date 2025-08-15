// components/CategoryBadge.tsx
import { resolveIcon } from "./icons";

export function CategoryBadge({
  name,
  color,
  icon,
}: {
  name: string;
  color?: string | null;
  icon?: string | null;
}) {
  const Icon = resolveIcon(icon ?? undefined);
  const bg = (color ?? "#64748b") + "20"; // transparência simples
  const fg = color ?? "#64748b";

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium"
      style={{ backgroundColor: bg, color: fg }}
      title={name}
    >
      <Icon className="h-3.5 w-3.5" />
      {name}
    </span>
  );
}
