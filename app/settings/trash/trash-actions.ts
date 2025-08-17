'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath, redirect } from 'next/navigation';

async function requireUser() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Sem sessão');
  return { supabase, user };
}

// Marca como removida (você pode usar isso nos botões "Excluir" das listagens normais)
export async function softDeleteAccountAction(fd: FormData) {
  const { supabase, user } = await requireUser();
  const id = String(fd.get('id') ?? '');
  if (!id) throw new Error('ID ausente');

  const { error } = await supabase
    .from('accounts')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('[trash:softDeleteAccount]', error);
    throw new Error('Falha ao enviar conta para a lixeira.');
  }

  revalidatePath('/banking');
  revalidatePath('/settings/trash');
  redirect('/settings/trash');
}

export async function restoreAccountAction(fd: FormData) {
  const { supabase, user } = await requireUser();
  const id = String(fd.get('id') ?? '');
  if (!id) throw new Error('ID ausente');

  const { error } = await supabase
    .from('accounts')
    .update({ deleted_at: null })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('[trash:restoreAccount]', error);
    throw new Error('Falha ao restaurar conta.');
  }

  revalidatePath('/banking');
  revalidatePath('/settings/trash');
  redirect('/banking');
}

export async function hardDeleteAccountAction(fd: FormData) {
  const { supabase, user } = await requireUser();
  const id    = String(fd.get('id') ?? '');
  const mode  = String(fd.get('mode') ?? 'if-empty'); // 'if-empty' | 'move' | 'purge'
  const target = (fd.get('target_account_id') as string) || null;
  if (!id) throw new Error('ID ausente');

  // Se você criou a RPC, chame-a (transacional e mais robusta):
  const { error: eRpc } = await supabase.rpc('hard_delete_account', {
    p_user_id: user.id,
    p_account_id: id,
    p_mode: mode,
    p_target_account_id: target,
  });

  if (eRpc) {
    console.error('[trash:hardDeleteAccount] rpc', eRpc);
    throw new Error(eRpc.message || 'Falha ao excluir definitivamente a conta.');
  }

  revalidatePath('/banking');
  revalidatePath('/settings/trash');
  redirect('/settings/trash');
}
