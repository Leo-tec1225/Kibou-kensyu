"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "../utils/supabase";
import YouTube from "react-youtube";

// ▼ TypeScriptの型定義
type Question = {
  id: number;
  question_num: number;
  title: string;
  text: string;
  is_true: boolean;
  explanation: string;
};

export default function TrainingApp() {
  // --- 画面遷移の状態管理（LMS風の遷移） ---
  const [screen, setScreen] = useState<"login" | "dashboard" | "course" | "test" | "completed">("login");
  
  // --- ユーザー・学習状況 ---
  const [userInfo, setUserInfo] = useState({ name: "", type: "カイテク", date: "" });
  const [isVideoWatched, setIsVideoWatched] = useState(false);
  const [isCoursePassed, setIsCoursePassed] = useState(false);
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ★ 追加：終了ボタンを押したかどうかのステート
  const [isFinished, setIsFinished] = useState(false);

  // --- YouTubeスキップ防止 ---
  const playerRef = useRef<any>(null);
  const maxTimeRef = useRef(0);
  const intervalRef = useRef<any>(null);

  // 初回読み込み（Supabaseから問題取得）
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const { data, error } = await supabase
          .from("questions")
          .select("*")
          .order("question_num", { ascending: true });
        if (error) throw error;
        if (data) setQuestions(data);
      } catch (error) {
        console.error("問題の取得に失敗しました:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchQuestions();
  }, []);

  const currentQ = questions[currentQIndex];

  // --- ハンドラー処理 ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (userInfo.name && userInfo.date) setScreen("dashboard");
  };

  const handleAnswer = (answer: boolean) => {
    if (answer === currentQ.is_true) {
      setShowExplanation(false);
      if (currentQIndex < questions.length - 1) {
        setCurrentQIndex(currentQIndex + 1);
      } else {
        submitResult();
      }
    } else {
      setShowExplanation(true);
    }
  };

  const submitResult = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("training_records").insert([
        {
          worker_name: userInfo.name,
          worker_type: userInfo.type,
          work_date: userInfo.date,
          score: questions.length,
          is_passed: true,
        },
      ]);
      if (error) throw error;
      setIsCoursePassed(true);
      setScreen("completed");
    } catch (error) {
      alert("通信エラーが発生しました。");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- YouTube プレイヤーの監視制御 ---
  const onReady = (event: any) => { playerRef.current = event.target; };
  const onStateChange = (event: any) => {
    if (event.data === 1) {
      intervalRef.current = setInterval(() => {
        if (!playerRef.current) return;
        const currentTime = playerRef.current.getCurrentTime();
        if (currentTime > maxTimeRef.current + 1.5) {
          playerRef.current.seekTo(maxTimeRef.current, true);
        } else {
          maxTimeRef.current = currentTime;
        }
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  };
  const onEnd = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsVideoWatched(true);
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500 text-sm">システムを準備中...</div>;
  }

  // --------------------------------------------------------
  // 画面レンダリング部（LMS風 UI）
  // --------------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans relative">
      
      {/* 共通ヘッダー（LMS風） */}
      <header className="bg-white border-b border-gray-200 px-5 py-3 flex justify-between items-center shadow-sm sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Logo" className="h-7 w-auto object-contain" />
          <span className="font-bold text-gray-700 text-xs sm:text-sm tracking-wider border-l border-gray-300 pl-3">研修受講システム</span>
        </div>
        {userInfo.name && screen !== "login" && (
          <div className="text-[10px] sm:text-xs text-gray-500 font-medium">
            受講者: <span className="text-gray-800 font-bold">{userInfo.name}</span> 様
          </div>
        )}
      </header>

      <main className="max-w-3xl mx-auto p-4 sm:p-6 pb-20">
        
        {/* =========================================
            1. ログイン（情報登録）画面
        ========================================= */}
        {screen === "login" && (
          <div className="bg-white shadow-sm border border-gray-200 rounded-md p-6 sm:p-8 mt-4 sm:mt-10 animate-fade-in max-w-md mx-auto">
            <h2 className="text-lg font-bold mb-6 text-gray-800 border-b-2 border-[#D11019] inline-block pb-1">受講情報の入力</h2>
            <p className="text-xs text-gray-500 mb-6">受講を開始するために、以下の情報を入力してログインしてください。</p>
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">受講者氏名 <span className="text-red-500">*</span></label>
                <input
                  type="text" required value={userInfo.name}
                  onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-300 p-3 rounded focus:bg-white focus:border-[#D11019] focus:ring-1 focus:ring-[#D11019] outline-none transition-all text-sm"
                  placeholder="例：山田 太郎"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">所属・勤務区分 <span className="text-red-500">*</span></label>
                <select
                  value={userInfo.type} onChange={(e) => setUserInfo({ ...userInfo, type: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-300 p-3 rounded focus:bg-white focus:border-[#D11019] focus:ring-1 focus:ring-[#D11019] outline-none transition-all text-sm"
                >
                  <option value="カイテク">カイテク</option>
                  <option value="派遣">派遣</option>
                  <option value="その他">その他</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">勤務予定日 <span className="text-red-500">*</span></label>
                <input
                  type="date" required value={userInfo.date}
                  onChange={(e) => setUserInfo({ ...userInfo, date: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-300 p-3 rounded focus:bg-white focus:border-[#D11019] focus:ring-1 focus:ring-[#D11019] outline-none transition-all text-sm"
                />
              </div>
              <div className="pt-4">
                <button type="submit" className="w-full bg-[#D11019] text-white py-3.5 rounded font-bold text-sm hover:bg-[#b00d15] transition-all shadow-sm">
                  ログインして一覧へ進む
                </button>
              </div>
            </form>
          </div>
        )}

        {/* =========================================
            2. マイページ（研修ダッシュボード）
        ========================================= */}
        {screen === "dashboard" && (
          <div className="animate-fade-in">
            <h1 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
              <svg className="w-6 h-6 text-[#D11019] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
              マイページ（研修一覧）
            </h1>
            
            <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-100 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                <span className="font-bold text-sm text-gray-700">受講予定・受講中</span>
              </div>
              
              <div className="p-5">
                {/* 研修カード */}
                <div className="flex flex-col sm:flex-row gap-5 border border-gray-200 p-4 rounded-md hover:border-[#D11019] transition-colors bg-gray-50">
                  {/* サムネイル */}
                  <div className="w-full sm:w-48 h-28 bg-gray-200 rounded flex items-center justify-center shrink-0 border border-gray-300 relative overflow-hidden">
                    <img src={`https://img.youtube.com/vi/SY7y5YL-BH0/mqdefault.jpg`} alt="サムネイル" className="w-full h-full object-cover opacity-80" />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <svg className="w-10 h-10 text-white opacity-80" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"></path></svg>
                    </div>
                  </div>
                  
                  {/* 詳細情報 */}
                  <div className="flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-base text-gray-800">桑の実会 初回研修コース</h3>
                      {isCoursePassed ? (
                         <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded border border-green-200">受講済</span>
                      ) : (
                         <span className="bg-red-50 text-[#D11019] text-xs font-bold px-2 py-1 rounded border border-red-200">未受講</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mb-4 flex-1">
                      施設での業務を開始する前に、必ず本研修をご受講ください。動画視聴と確認テスト（全{questions.length}問）が含まれます。
                    </p>
                    
                    <div className="mt-auto">
                      {isCoursePassed ? (
                        <button onClick={() => setScreen("completed")} className="w-full sm:w-auto bg-gray-200 text-gray-600 px-6 py-2 rounded text-sm font-bold hover:bg-gray-300 transition-colors">
                          結果を確認する
                        </button>
                      ) : (
                        <button onClick={() => setScreen("course")} className="w-full sm:w-auto bg-[#D11019] text-white px-6 py-2 rounded text-sm font-bold hover:bg-[#b00d15] transition-colors shadow-sm">
                          研修を受講する
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================
            3. 動画視聴画面
        ========================================= */}
        {screen === "course" && (
          <div className="animate-fade-in">
            {/* パンくずリスト風ナビ */}
            <div className="mb-4 text-xs text-gray-500 flex items-center">
              <button onClick={() => setScreen("dashboard")} className="hover:text-[#D11019] hover:underline">マイページ</button>
              <span className="mx-2">&gt;</span>
              <span className="text-gray-800 font-bold">職員 初回研修コース</span>
            </div>

            <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-100 px-5 py-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="font-bold text-gray-800 text-base">Step 1: 動画教材の視聴</h2>
              </div>
              
              <div className="p-5 sm:p-6">
                <div className="w-full rounded bg-black mb-6 border border-gray-300 overflow-hidden shadow-inner">
                  <YouTube
  videoId="SY7y5YL-BH0" // ★新しいYouTubeの動画IDに変更
  opts={{ width: '100%', height: '300', playerVars: { rel: 0, modestbranding: 1 } }}
  onReady={onReady} onStateChange={onStateChange} onEnd={onEnd}
/>
                </div>
                
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-md mb-6 flex items-start">
                  <svg className="w-5 h-5 text-blue-500 mr-3 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    早送りは禁止されています。最後まで視聴が完了すると、「確認テストへ進む」ボタンが有効になります。
                  </p>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => setScreen("test")} disabled={!isVideoWatched}
                    className={`w-full sm:w-auto px-8 py-3 rounded font-bold text-sm transition-all shadow-sm ${
                      isVideoWatched 
                      ? "bg-[#D11019] text-white hover:bg-[#b00d15]" 
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    {isVideoWatched ? "確認テストへ進む" : "視聴を完了してください"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================
            4. 確認テスト画面
        ========================================= */}
        {screen === "test" && currentQ && (
          <div className="animate-fade-in">
            <div className="mb-4 text-xs text-gray-500 flex items-center">
              <span className="text-gray-800 font-bold">確認テスト実施中</span>
            </div>

            <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-100 px-5 py-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="font-bold text-gray-800 text-sm">Step 2: 確認テスト</h2>
                <span className="text-xs font-bold text-gray-600 bg-white border border-gray-300 px-3 py-1 rounded-full">
                  {currentQIndex + 1} / {questions.length} 問
                </span>
              </div>
              
              <div className="p-5 sm:p-8">
                <div className="mb-8">
                  <span className="inline-block text-[#D11019] text-xs font-bold border border-[#D11019] px-2 py-1 rounded-sm mb-3">
                    {currentQ.title}
                  </span>
                  <p className="text-gray-800 font-bold text-base sm:text-lg leading-relaxed">
                    <span className="text-[#D11019] mr-1">Q.</span> {currentQ.text}
                  </p>
                </div>

                {showExplanation && (
                  <div className="bg-red-50 border border-red-200 p-4 rounded mb-6">
                    <p className="text-[#D11019] font-bold mb-2 flex items-center text-sm"><span className="text-lg mr-2">✕</span> 誤りです</p>
                    <p className="text-gray-700 text-sm leading-relaxed">{currentQ.explanation}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button onClick={() => handleAnswer(true)} disabled={isSubmitting} className="w-full bg-white border border-gray-300 hover:border-[#D11019] hover:bg-red-50 text-gray-700 hover:text-[#D11019] p-5 rounded font-bold text-sm transition-colors text-center shadow-sm">
                    A．正しい
                  </button>
                  <button onClick={() => handleAnswer(false)} disabled={isSubmitting} className="w-full bg-white border border-gray-300 hover:border-[#D11019] hover:bg-red-50 text-gray-700 hover:text-[#D11019] p-5 rounded font-bold text-sm transition-colors text-center shadow-sm">
                    B．誤り
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================
            5. 修了・完了画面
        ========================================= */}
        {screen === "completed" && (
          <div className="animate-fade-in mt-8">
            <div className="bg-white shadow-sm border border-green-200 rounded-lg p-8 sm:p-12 text-center max-w-xl mx-auto">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-800 mb-2">研修修了</h2>
              <p className="text-gray-500 mb-8 text-sm">
                確認テスト全問正解お疲れ様でした。<br/>受講記録はシステムに保存されました。
              </p>
              
              <div className="bg-gray-50 border border-gray-200 p-5 rounded text-left text-sm text-gray-700 mb-8 mx-auto">
                <div className="flex border-b border-gray-200 pb-2 mb-2">
                  <span className="w-24 text-gray-500">受講者氏名</span>
                  <span className="font-bold text-gray-800">{userInfo.name}</span>
                </div>
                <div className="flex border-b border-gray-200 pb-2 mb-2">
                  <span className="w-24 text-gray-500">勤務予定日</span>
                  <span className="font-bold text-gray-800">{userInfo.date}</span>
                </div>
                <div className="flex">
                  <span className="w-24 text-gray-500">判定結果</span>
                  <span className="font-bold text-green-600">合格（修了済）</span>
                </div>
              </div>
              
              <div className="bg-[#FFFDFB] border border-red-200 p-4 rounded mb-8">
                <p className="text-sm font-bold text-[#D11019]">
                  この画面を施設の担当者に提示して、業務を開始してください。
                </p>
              </div>
              
              {/* ★変更箇所：eラーニングを終えるボタン */}
              <button 
                onClick={() => setIsFinished(true)} 
                className="w-full sm:w-auto bg-gray-200 text-gray-700 px-8 py-3 rounded font-bold text-sm hover:bg-gray-300 transition-colors shadow-sm mt-2"
              >
                eラーニングを終える
              </button>
            </div>
          </div>
        )}
      </main>

      {/* =========================================
          ★追加：終了時のグレーアウト・メッセージ画面
      ========================================= */}
      {isFinished && (
        <div className="fixed inset-0 z-50 bg-gray-900/80 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[#D11019]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">お疲れ様でした</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              受講はすべて完了しました。<br/>
              ブラウザのタブ（またはウィンドウ）を<br/>閉じて終了してください。
            </p>
          </div>
        </div>
      )}
    </div>
  );
}