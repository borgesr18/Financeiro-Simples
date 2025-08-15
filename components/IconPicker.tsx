// components/IconPicker.tsx
"use client";

import { useState } from "react";
import { ICON_OPTIONS, IconSlug } from "./icons";

export function IconPicker({
  value,
  onChange,
}: {
  value?: IconSlug | string | null;
  onChange: (v: IconSlug) => void;
}) {
  const [selected, setSelected] = useState<IconSlug | undefined>(
    (value as IconSlug) ?? undefined
  );

  return (
    <div className="grid grid-cols-8 gap-2">
      {ICON_OPTIONS.map(({ slug, Comp, label }) => {
        const active = selected === slug;
        return (
          <button
            key={slug}
            type="button"
            onClick={() => {
              setSelected(slug);
              onChange(slug);
            }}
            className={`p-2 rounded-xl border hover:shadow-sm ${
              active ? "ring-2 ring-offset-2 ring-indigo-500" : ""
            }`}
            title={label}
            aria-label={label}
          >
            <Comp className="w-5 h-5" />
          </button>
        );
      })}
    </div>
  );
}

