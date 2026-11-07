import { supabaseAdmin } from "../../../../utils/supabase-server";

// 1問ごとの正誤判定。不正解のときだけ解説を返す
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body.id !== "number" || typeof body.answer !== "boolean") {
    return Response.json({ error: "bad request" }, { status: 400 });
  }
  const { data, error } = await supabaseAdmin
    .from("questions")
    .select("is_true, explanation")
    .eq("id", body.id)
    .single();
  if (error || !data) {
    return Response.json({ error: "not found" }, { status: 404 });
  }
  const correct = data.is_true === body.answer;
  return Response.json(
    correct ? { correct } : { correct, explanation: data.explanation }
  );
}
