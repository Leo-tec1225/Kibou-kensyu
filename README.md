# 研修受講システム（kibou-kensyu）

動画視聴と確認テストを行う研修用 Web アプリです（Next.js + Supabase）。

- `/` 受講者画面（ログイン → 動画視聴 → 確認テスト → 修了）
- `/admin` 管理画面（受講履歴、問題の編集、勤務区分の管理）

## 環境変数（`.env.local` / 本番の環境変数に設定）

| 名前 | 用途 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase のプロジェクト URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 管理画面のログインで使用（公開されても可） |
| `SUPABASE_SERVICE_ROLE_KEY` | サーバー側 API 用。**秘密。`NEXT_PUBLIC_` を付けない** |

## 構成

受講者画面は Supabase を直接呼ばず、サーバー側の API を経由します。

- `GET /api/questions` 問題一覧（正解・解説は含まない）
- `POST /api/questions/check` 1問ごとの正誤判定（不正解時のみ解説を返す）
- `POST /api/submit` 全問をサーバーで再採点し、全問正解のときだけ修了記録を保存
- `GET /api/worker-types` ログイン画面の勤務区分

## Supabase の設定

テーブル: `questions`、`training_records`、`worker_types`。
3テーブルとも RLS を有効にし、`authenticated`（管理者）だけに全操作を許可します。
**`anon` 向けのポリシーは作らない**でください（受講者のデータが公開されます）。

```sql
alter table questions enable row level security;
alter table training_records enable row level security;
alter table worker_types enable row level security;

create policy "admin all" on questions for all to authenticated using (true) with check (true);
create policy "admin all" on training_records for all to authenticated using (true) with check (true);
create policy "admin all" on worker_types for all to authenticated using (true) with check (true);
```

管理者は Supabase の Authentication → Users で作成します。

## 開発

```bash
npm install
npm run dev     # http://localhost:3000
npm run build
npm run lint
```
