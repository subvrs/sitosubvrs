import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://omsbaccxhusnfpusafgi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tc2JhY2N4aHVzbmZwdXNhZmdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNjcwNTksImV4cCI6MjA5Mzc0MzA1OX0.j8L8i4lU-FdTC0sjI6L2Z79_w2FBMtrGIuberfyJCfY';

export const supabase = createClient(supabaseUrl, supabaseKey);
