// app/settings/trash/actions.ts
'use server'

// Importa a implementação real
import * as impl from './trash-actions'

/**
 * Wrappers async para cumprir a regra do Next:
 * em arquivos 'use server' apenas exports de funções async.
 * Mantém nomes e assinaturas já usadas no projeto.
 */
export async function softDeleteAction(formData: FormData) {
  return impl.softDeleteAction(formData)
}

export async function restoreAction(formData: FormData) {
  return impl.restoreAction(formData)
}

export async function purgeAction(formData: FormData) {
  return impl.purgeAction(formData)
}

// alias histórico exigido por algumas páginas
export async function hardDeleteAction(formData: FormData) {
  return impl.purgeAction(formData)
}
