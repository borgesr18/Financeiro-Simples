// components/ColorField.tsx
export function ColorField({
  value,
  onChange,
}: { value?: string | null; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="color"
        value={value ?? "#6b7280"}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-14 rounded border"
      />
      <span className="text-sm text-gray-600">Escolha a cor</span>
    </div>
  );
}
