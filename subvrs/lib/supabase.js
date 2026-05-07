import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://omsbaccxhusnfpusafgi.supabase.co';
const supabaseKey = 'sb_publishable_K1pUFtnysyMGFZr0BVeFUA_Yzzs7XTQaJTs0nw';

export const supabase = createClient(supabaseUrl, supabaseKey);
