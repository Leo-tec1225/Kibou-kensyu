import "server-only";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY が設定されていません"
  );
}

// サーバー専用（RLSをバイパスする）。クライアントコードからは import しないこと。
export const supabaseAdmin = createClient(url, serviceKey, {
  auth: { persistSession: false },
});
