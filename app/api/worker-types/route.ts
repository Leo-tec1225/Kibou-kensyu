import { supabaseAdmin } from "../../../utils/supabase-server";

// 受講者のログイン画面で選ぶ「所属・勤務区分」の一覧
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("worker_types")
    .select("id, name")
    .order("id", { ascending: true });
  if (error) {
    console.error(error);
    return Response.json({ error: "fetch failed" }, { status: 500 });
  }
  return Response.json(data);
}
