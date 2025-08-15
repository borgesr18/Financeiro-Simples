'use client'

type Option = { id: string; name: string; color?: string | null; icon?: string | null }

export default function CategorySelect({
  options,
  name = 'category_id',
  defaultValue,
  required = true,
}: {
  options: Option[]
  name?: string
  defaultValue?: string | null
  required?: boolean
}) {
  return (
    <select
      name={name}
      defaultValue={defaultValue ?? ''}
      required={required}
      className="w-full px-3 py-2 border border-neutral-200 rounded-lg bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-300"
    >
      <option value="" disabled>
        Selecione…
      </option>
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {o.name}
        </option>
      ))}
    </select>
  )
}
