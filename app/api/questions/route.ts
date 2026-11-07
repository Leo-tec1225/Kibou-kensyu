import { supabaseAdmin } from "../../../utils/supabase-server";

// 正解・解説は含めずに問題だけ返す
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("questions")
    .select("id, question_num, title, text")
    .order("question_num", { ascending: true });
  if (error) {
    console.error(error);
    return Response.json({ error: "fetch failed" }, { status: 500 });
  }
  return Response.json(data);
}
