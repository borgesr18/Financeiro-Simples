// app/settings/trash/actions.ts
// Reexporta da implementação real em ./trash-actions
// Mantém o nome "hardDeleteAction" esperado por page.tsx

export {
  softDeleteAction,
  restoreAction,
  purgeAction as hardDeleteAction,
} from './trash-actions'
