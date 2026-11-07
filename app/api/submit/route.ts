import { supabaseAdmin } from "../../../utils/supabase-server";

// 全問の回答をサーバー側で再採点し、全問正解のときだけ修了記録を保存する
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const type = typeof body?.type === "string" ? body.type.trim() : "";
  const date = typeof body?.date === "string" ? body.date : "";
  const answers = body?.answers as Record<string, unknown> | undefined;

  if (
    !name || name.length > 100 ||
    !type || type.length > 50 ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !answers || typeof answers !== "object"
  ) {
    return Response.json({ error: "bad request" }, { status: 400 });
  }

  const { data: questions, error } = await supabaseAdmin
    .from("questions")
    .select("id, is_true");
  if (error || !questions) {
    console.error(error);
    return Response.json({ error: "server error" }, { status: 500 });
  }

  const allCorrect =
    questions.length > 0 &&
    questions.every((q) => answers[String(q.id)] === q.is_true);
  if (!allCorrect) {
    return Response.json({ error: "not passed" }, { status: 422 });
  }

  const { error: insertError } = await supabaseAdmin
    .from("training_records")
    .insert([
      {
        worker_name: name,
        worker_type: type,
        work_date: date,
        score: questions.length,
        is_passed: true,
      },
    ]);
  if (insertError) {
    console.error(insertError);
    return Response.json({ error: "server error" }, { status: 500 });
  }
  return Response.json({ ok: true });
}
