import { createClient } from '@supabase/supabase-js';
import { toJSON, fromJSON } from 'seroval';

const email = 'saalla012@gmail.com';
const password = 'aA0176513601&';
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const anonKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
if (!supabaseUrl || !anonKey) throw new Error('Missing backend env');

const client = createClient(supabaseUrl, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
const { data, error } = await client.auth.signInWithPassword({ email, password });
if (error || !data.session?.access_token) throw new Error(`Signin failed: ${error?.message}`);

const input = {
  prompt: 'إعلان سعودي قصير لمنتج عطري فاخر: ابدأ بلقطة قريبة للعبوة مع إضاءة متجر راقية، ثم حركة كاميرا بطيئة تظهر المنتج بوضوح ودعوة مباشرة للطلب الآن، بدون نص عربي ظاهر وبدون ادعاءات مبالغ فيها.',
  quality: 'fast',
  aspectRatio: '9:16',
  durationSeconds: 5,
  productImageUrl: 'https://v3b.fal.media/files/b/0a97f05a/9mPQVxVvM8ZIr4lhQBbdW_1777296260823.jpeg',
  selectedPersonaId: 'male-premium',
  selectedTemplateId: 'perfume-premium-hook'
};

const payload = toJSON({ data: input, context: {} });
const url = 'https://rifd.lovable.app/_serverFn/babe4ae428acaa1b70330fe5acf6dcfed121ad43cc9e540e9ddf22649d017784';
const res = await fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-tsr-serverFn': 'true',
    'Authorization': `Bearer ${data.session.access_token}`
  },
  body: JSON.stringify(payload)
});
const text = await res.text();
console.log(JSON.stringify({ status: res.status, contentType: res.headers.get('content-type'), serialized: res.headers.get('x-tss-serialized'), bodyPreview: text.slice(0, 1000) }, null, 2));
if (!res.ok) process.exit(2);
try {
  const decoded = fromJSON(JSON.parse(text));
  console.log(JSON.stringify(decoded, null, 2));
} catch (e) {
  console.log('decode_failed', e.message);
}
