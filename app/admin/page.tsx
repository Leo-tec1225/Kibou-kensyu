"use client";

import { useState } from "react";
import { supabase } from "../../utils/supabase";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // ★変更：タブの種類に "types" (区分管理) を追加
  const [activeTab, setActiveTab] = useState<"records" | "questions" | "types">("records");
  
  const [records, setRecords] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  // ★追加：勤務区分用のステート
  const [workerTypes, setWorkerTypes] = useState<any[]>([]);
  const [newTypeName, setNewTypeName] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<any>(null);

  const [printRecord, setPrintRecord] = useState<any>(null);

  const ADMIN_PASSWORD = "kuwa8899";

  const formatTimeDirectly = (dateStr: string, isLongFormat: boolean = false) => {
    if (!dateStr) return "";
    let cleanStr = dateStr.replace(/\+00.*$/, '').replace('Z', '');
    cleanStr = cleanStr.replace(' ', 'T');
    const d = new Date(cleanStr);
    return d.toLocaleString("ja-JP", {
      year: "numeric",
      month: isLongFormat ? "long" : "2-digit",
      day: isLongFormat ? "numeric" : "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // --- データ取得 ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      fetchRecords();
      fetchQuestions();
      fetchWorkerTypes(); // ★追加：ログイン時に区分も取得する
    } else {
      alert("パスワードが間違っています");
    }
  };

  const fetchRecords = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("training_records")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (data) setRecords(data);
    } catch (error) {
      console.error("履歴の取得に失敗しました", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from("questions")
        .select("*")
        .order("question_num", { ascending: true });
      if (error) throw error;
      if (data) setQuestions(data);
    } catch (error) {
      console.error("問題の取得に失敗しました", error);
    }
  };

  // ★追加：勤務区分の取得関数
  const fetchWorkerTypes = async () => {
    try {
      const { data, error } = await supabase
        .from("worker_types")
        .select("*")
        .order("id", { ascending: true });
      if (error) throw error;
      if (data) setWorkerTypes(data);
    } catch (error) {
      console.error("区分の取得に失敗しました", error);
    }
  };

  // --- 問題編集の処理 ---
  const startEditing = (q: any) => {
    setEditingId(q.id);
    setEditForm({ ...q });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const saveQuestion = async () => {
    try {
      const { error } = await supabase
        .from("questions")
        .update({
          title: editForm.title,
          text: editForm.text,
          is_true: editForm.is_true,
          explanation: editForm.explanation,
        })
        .eq("id", editForm.id);

      if (error) throw error;
      
      alert("問題を更新しました！");
      setEditingId(null);
      fetchQuestions();
    } catch (error) {
      alert("更新に失敗しました。");
      console.error(error);
    }
  };

  // ★追加：勤務区分の追加・削除処理
  const handleAddType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTypeName.trim()) return;
    try {
      const { error } = await supabase.from("worker_types").insert([{ name: newTypeName }]);
      if (error) throw error;
      setNewTypeName("");
      fetchWorkerTypes();
    } catch (error) {
      alert("区分の追加に失敗しました。");
      console.error(error);
    }
  };

  const handleDeleteType = async (id: number, name: string) => {
    if (!window.confirm(`「${name}」を削除しますか？\n※すでにこの区分で登録されている受講履歴には影響しません。`)) return;
    try {
      const { error } = await supabase.from("worker_types").delete().eq("id", id);
      if (error) throw error;
      fetchWorkerTypes();
    } catch (error) {
      alert("削除に失敗しました。");
      console.error(error);
    }
  };

  // =========================================
  // 1. パスワード入力画面
  // =========================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
        <div className="bg-white p-8 rounded-md shadow-sm border border-gray-200 w-full max-w-sm animate-fade-in">
          <div className="text-center mb-6">
            <img src="/logo.png" alt="ロゴ" className="h-12 mx-auto mb-4" />
            <h1 className="text-sm font-bold text-gray-700 tracking-wider">研修管理システム<br/>ログイン</h1>
          </div>
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">管理者パスワード</label>
             <input
                type="password"
                placeholder="パスワードを入力"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded bg-gray-50 focus:bg-white focus:border-[#D11019] focus:ring-1 focus:ring-[#D11019] outline-none transition-all text-sm text-gray-900"
              />
            </div>
            <button type="submit" className="w-full bg-[#D11019] text-white py-3 rounded font-bold hover:bg-[#b00d15] transition-colors shadow-sm text-sm">
              ログイン
            </button>
          </form>
        </div>
      </div>
    );
  }

  // =========================================
  // 2. 管理ダッシュボード画面
  // =========================================
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      
      <div className={printRecord ? "print:hidden" : ""}>
        {/* ヘッダー */}
        <header className="bg-white border-b border-gray-200 px-5 py-3 flex justify-between items-center shadow-sm sticky top-0 z-40 print:hidden">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Logo" className="h-7 w-auto object-contain" />
            <span className="font-bold text-gray-700 text-sm tracking-wider border-l border-gray-300 pl-3">研修管理ダッシュボード</span>
          </div>
          <div className="flex items-center gap-3">
            {activeTab === "records" && (
              <button onClick={() => window.print()} className="bg-white border border-gray-300 text-gray-600 px-3 py-1.5 rounded text-xs font-bold hover:bg-gray-50 transition-colors flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                一覧を印刷
              </button>
            )}
            <button onClick={() => { setIsAuthenticated(false); setPassword(""); }} className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded text-xs font-bold hover:bg-gray-200 transition-colors">
              ログアウト
            </button>
          </div>
        </header>

        <main className="p-4 sm:p-6 max-w-6xl mx-auto">
          {/* タブ切り替え */}
          <div className="flex space-x-1 mb-6 border-b border-gray-200 print:hidden overflow-x-auto">
            <button onClick={() => setActiveTab("records")} className={`px-4 py-2.5 text-sm font-bold rounded-t-md transition-colors whitespace-nowrap ${activeTab === "records" ? "bg-white border-t border-l border-r border-gray-200 text-[#D11019] -mb-px" : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"}`}>
              受講履歴・進捗管理
            </button>
            <button onClick={() => setActiveTab("questions")} className={`px-4 py-2.5 text-sm font-bold rounded-t-md transition-colors whitespace-nowrap ${activeTab === "questions" ? "bg-white border-t border-l border-r border-gray-200 text-[#D11019] -mb-px" : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"}`}>
              テスト問題の編集
            </button>
            {/* ★追加：第3のタブ */}
            <button onClick={() => setActiveTab("types")} className={`px-4 py-2.5 text-sm font-bold rounded-t-md transition-colors whitespace-nowrap ${activeTab === "types" ? "bg-white border-t border-l border-r border-gray-200 text-[#D11019] -mb-px" : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"}`}>
              勤務区分の管理
            </button>
          </div>

          {/* ▼ 受講履歴タブ */}
          {activeTab === "records" && (
            <div className="animate-fade-in">
              <h2 className="text-lg font-bold mb-4 text-gray-800 print:hidden border-l-4 border-[#D11019] pl-2">研修修了者リスト</h2>
              {isLoading ? (
                <p className="text-gray-500 text-sm">データを読み込み中...</p>
              ) : (
                <div className="bg-white shadow-sm border border-gray-200 rounded-md overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                      <thead>
                        <tr className="bg-gray-100 border-b border-gray-200">
                          <th className="p-3 font-bold text-xs text-gray-600 whitespace-nowrap">受講日時</th>
                          <th className="p-3 font-bold text-xs text-gray-600">氏名</th>
                          <th className="p-3 font-bold text-xs text-gray-600">区分</th>
                          <th className="p-3 font-bold text-xs text-gray-600">勤務日</th>
                          <th className="p-3 font-bold text-xs text-gray-600 text-center">ステータス</th>
                          <th className="p-3 font-bold text-xs text-gray-600 text-center print:hidden">アクション</th>
                        </tr>
                      </thead>
                      <tbody>
                        {records.map((record) => (
                          <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                            <td className="p-3 text-xs text-gray-500 whitespace-nowrap">
                             {formatTimeDirectly(record.created_at)}
                            </td>
                            <td className="p-3 text-sm font-bold text-gray-800 whitespace-nowrap">{record.worker_name}</td>
                            <td className="p-3 text-xs text-gray-600"><span className="bg-gray-100 border border-gray-200 px-2 py-0.5 rounded">{record.worker_type}</span></td>
                            <td className="p-3 text-sm text-gray-700 whitespace-nowrap">{record.work_date}</td>
                            
                            <td className="p-3 text-center">
                              {record.is_passed ? (
                                <span className="inline-flex items-center bg-green-50 text-green-600 border border-green-200 px-2 py-1 rounded text-xs font-bold">
                                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                  修了済
                                </span>
                              ) : (
                                <span className="text-xs text-gray-400">未修了</span>
                              )}
                            </td>

                            <td className="p-3 text-center print:hidden">
                              <button 
                                onClick={() => setPrintRecord(record)}
                                className="bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded text-xs font-bold hover:bg-gray-50 transition-colors shadow-sm"
                              >
                                詳細・印刷
                              </button>
                            </td>
                          </tr>
                        ))}
                        {records.length === 0 && (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-gray-500 text-sm">
                              受講履歴がありません
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ▼ 問題編集タブ */}
          {activeTab === "questions" && (
            <div className="animate-fade-in space-y-4">
              <h2 className="text-lg font-bold mb-4 text-gray-800 border-l-4 border-[#D11019] pl-2">テスト問題の管理</h2>
              {questions.map((q) => (
                <div key={q.id} className="bg-white p-5 rounded-md shadow-sm border border-gray-200">
                  {editingId === q.id ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">問題タイトル</label>
                        <input 
                          type="text" value={editForm.title} onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                          className="w-full p-2.5 border border-gray-300 rounded bg-gray-50 focus:bg-white focus:border-[#D11019] outline-none text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">問題文</label>
                        <textarea 
                          value={editForm.text} onChange={(e) => setEditForm({...editForm, text: e.target.value})}
                          className="w-full p-2.5 border border-gray-300 rounded bg-gray-50 focus:bg-white focus:border-[#D11019] outline-none text-sm" rows={2}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">正解</label>
                        <select 
                          value={editForm.is_true ? "true" : "false"} onChange={(e) => setEditForm({...editForm, is_true: e.target.value === "true"})}
                          className="w-full p-2.5 border border-gray-300 rounded bg-gray-50 focus:bg-white focus:border-[#D11019] outline-none text-sm"
                        >
                          <option value="true">A．正しい</option>
                          <option value="false">B．誤り</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">解説文</label>
                        <textarea 
                          value={editForm.explanation} onChange={(e) => setEditForm({...editForm, explanation: e.target.value})}
                          className="w-full p-2.5 border border-gray-300 rounded bg-gray-50 focus:bg-white focus:border-[#D11019] outline-none text-sm" rows={3}
                        />
                      </div>
                      <div className="flex space-x-2 pt-3">
                        <button onClick={saveQuestion} className="bg-[#D11019] text-white px-5 py-2 rounded text-sm font-bold hover:bg-[#b00d15] shadow-sm">
                          保存する
                        </button>
                        <button onClick={cancelEditing} className="bg-gray-200 text-gray-700 px-5 py-2 rounded text-sm font-bold hover:bg-gray-300">
                          キャンセル
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-bold text-[#D11019] text-xs border border-[#D11019] px-2 py-0.5 rounded-sm bg-red-50">{q.title}</h3>
                        <button onClick={() => startEditing(q)} className="text-xs bg-gray-50 text-gray-600 px-3 py-1.5 rounded hover:bg-gray-100 font-bold border border-gray-200 transition-colors">
                          編集する
                        </button>
                      </div>
                      <p className="text-gray-800 mb-4 text-sm font-bold">Q. {q.text}</p>
                      <div className="bg-gray-50 border border-gray-200 p-4 rounded text-sm">
                        <p className="font-bold text-gray-700 mb-2">正解：<span className={q.is_true ? "text-green-600" : "text-blue-600"}>{q.is_true ? "A．正しい" : "B．誤り"}</span></p>
                        <p className="text-gray-600 leading-relaxed text-xs">{q.explanation}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ▼ 追加：勤務区分の管理タブ */}
          {activeTab === "types" && (
            <div className="animate-fade-in max-w-2xl">
              <h2 className="text-lg font-bold mb-4 text-gray-800 border-l-4 border-[#D11019] pl-2">受講者の勤務区分の設定</h2>
              <div className="bg-white shadow-sm border border-gray-200 rounded-md p-6">
                <p className="text-xs text-gray-500 mb-6">
                  受講者がログイン画面で選択する「所属・勤務区分」のリストを編集できます。
                </p>
                
                {/* 区分追加フォーム */}
                <form onSubmit={handleAddType} className="flex gap-3 mb-8 bg-gray-50 p-4 rounded border border-gray-200">
                  <input
                    type="text"
                    value={newTypeName}
                    onChange={(e) => setNewTypeName(e.target.value)}
                    placeholder="新しい区分名 (例: パート, 実習生)"
                    className="flex-1 border border-gray-300 p-2.5 rounded text-sm focus:border-[#D11019] outline-none focus:bg-white"
                  />
                  <button
                    type="submit"
                    disabled={!newTypeName.trim()}
                    className="bg-[#D11019] text-white px-6 py-2.5 rounded font-bold text-sm hover:bg-[#b00d15] disabled:bg-gray-300 transition-colors shadow-sm"
                  >
                    リストに追加
                  </button>
                </form>

                {/* 区分一覧 */}
                <div>
                  <h3 className="font-bold text-gray-700 text-sm mb-3">現在のリスト</h3>
                  <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
                    {workerTypes.map((t) => (
                      <li key={t.id} className="flex justify-between items-center p-3 hover:bg-gray-50">
                        <span className="text-sm font-bold text-gray-800">{t.name}</span>
                        <button
                          onClick={() => handleDeleteType(t.id, t.name)}
                          className="text-xs text-red-500 hover:text-red-700 font-bold bg-white border border-gray-200 px-3 py-1.5 rounded shadow-sm hover:bg-red-50 transition-colors"
                        >
                          削除
                        </button>
                      </li>
                    ))}
                    {workerTypes.length === 0 && (
                      <li className="p-4 text-sm text-gray-500 text-center">区分が登録されていません</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* =========================================
          3. 個別サマリー 印刷用モーダル
      ========================================= */}
      {printRecord && (
        <div className="fixed inset-0 z-50 bg-gray-900/60 flex justify-center items-start sm:items-center sm:p-4 overflow-y-auto print:static print:bg-white print:block print:p-0 print:overflow-visible">
          
          <div className="bg-white w-full max-w-2xl min-h-screen sm:min-h-0 sm:rounded-lg shadow-2xl relative print:shadow-none print:w-full">
            
            <div className="sticky top-0 bg-gray-100 border-b border-gray-300 px-6 py-4 flex justify-between items-center print:hidden rounded-t-lg z-10">
              <h3 className="font-bold text-gray-800">個別サマリーのプレビュー</h3>
              <div className="flex gap-3">
                <button 
                  onClick={() => window.print()} 
                  className="bg-[#D11019] text-white px-5 py-2 rounded font-bold shadow-sm hover:bg-[#b00d15] flex items-center text-sm"
                >
                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                  印刷する
                </button>
                <button 
                  onClick={() => setPrintRecord(null)} 
                  className="bg-white border border-gray-300 text-gray-700 px-5 py-2 rounded font-bold hover:bg-gray-50 text-sm"
                >
                  閉じる
                </button>
              </div>
            </div>

            <div className="p-10 sm:p-12 print:p-8 bg-white text-gray-900">
              
              <div className="text-center mb-10">
                <img src="/logo.png" alt="本郷希望の丘ロゴ" className="h-16 mx-auto mb-4" />
                <h1 className="text-2xl font-bold tracking-widest border-b-2 border-gray-800 pb-3 mb-2 inline-block">
                  スポット職員 研修受講サマリー
                </h1>
                <p className="text-gray-600 text-sm mt-2">特別養護老人ホーム 本郷希望の丘</p>
              </div>

              <table className="w-full border-collapse border-2 border-gray-800 mb-10">
                <tbody>
                  <tr>
                    <th className="border border-gray-400 bg-gray-100 p-4 w-1/3 text-left text-sm font-bold">受講完了日時</th>
                    <td className="border border-gray-400 p-4 text-sm font-medium">
                      {formatTimeDirectly(printRecord.created_at, true)}
                    </td>
                  </tr>
                  <tr>
                    <th className="border border-gray-400 bg-gray-100 p-4 w-1/3 text-left text-sm font-bold">受講者氏名</th>
                    <td className="border border-gray-400 p-4 text-xl font-bold tracking-widest">
                      {printRecord.worker_name} <span className="text-base font-normal ml-1">様</span>
                    </td>
                  </tr>
                  <tr>
                    <th className="border border-gray-400 bg-gray-100 p-4 w-1/3 text-left text-sm font-bold">所属・勤務区分</th>
                    <td className="border border-gray-400 p-4 text-sm">{printRecord.worker_type}</td>
                  </tr>
                  <tr>
                    <th className="border border-gray-400 bg-gray-100 p-4 w-1/3 text-left text-sm font-bold">勤務予定日</th>
                    <td className="border border-gray-400 p-4 text-sm font-bold">{printRecord.work_date}</td>
                  </tr>
                </tbody>
              </table>

              <h3 className="font-bold text-lg mb-3 border-l-4 border-gray-800 pl-3">研修受講結果</h3>
              <table className="w-full border-collapse border border-gray-400 mb-12">
                <tbody>
                  <tr>
                    <th className="border border-gray-400 bg-gray-50 p-4 w-1/3 text-left text-sm">Step1: 研修動画の視聴</th>
                    <td className="border border-gray-400 p-4 text-center">
                      <span className="inline-flex items-center text-gray-800 font-bold">
                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                        視聴完了
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <th className="border border-gray-400 bg-gray-50 p-4 w-1/3 text-left text-sm">Step2: 確認テスト</th>
                    <td className="border border-gray-400 p-4 text-center">
                      {printRecord.is_passed ? (
                        <span className="inline-flex items-center text-gray-800 font-bold">
                          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                          合格（全問正解）
                        </span>
                      ) : (
                        <span className="text-gray-400">未修了</span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="flex justify-end mt-16 pt-8">
                <div className="border border-gray-800 w-64 h-32 relative">
                  <div className="bg-gray-100 border-b border-gray-800 px-3 py-1 text-xs font-bold text-center">
                    施設管理者 確認欄
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}