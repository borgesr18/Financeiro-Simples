// app/settings/trash/actions.ts
// Shim de reexport para manter compatibilidade com imports antigos.
// A implementação real está em ./trash-actions

export {
  softDeleteAction,
  restoreAction,
  purgeAction as hardDeleteAction, // mantém o nome esperado em page.tsx
} from './trash-actions'

