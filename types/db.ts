// types/db.ts
export type Category = {
  id: string;
  user_id: string;
  name: string;
  type?: 'expense' | 'income' | null; // se você usa tipo por categoria
  color_hex?: string | null;
  icon_slug?: string | null;
  created_at: string;
};
