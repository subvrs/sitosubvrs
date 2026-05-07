import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://omsbaccxhusnfpusafgi.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_K1pUFtnysyMGFZr0BVeFUA_Yzzs7XTQaJTs0nw';

export const supabase = createClient(supabaseUrl, supabaseKey);
