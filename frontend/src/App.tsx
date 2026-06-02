import React, { useState } from 'react';
import { Rnd } from 'react-rnd';

// 1区画あたりの位置とサイズを表すデータの型定義
interface Box { x: number; y: number; width: number; height: number; }
interface Sections { [key: string]: Box; }

export default function App() {
  // お弁当画像のURL（仮の画像。本番はアップロードされた画像になります）
  const [imageUrl, setImageUrl] = useState<string>("https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800");
  
  // 各区画の枠の「位置」と「サイズ」を管理する状態（初期値）
  const [sections, setSections] = useState<Sections>({
    top_left:     { x: 50,  y: 40,  width: 180, height: 180 },
    top_right:    { x: 450, y: 40,  width: 200, height: 180 },
    bottom_right: { x: 450, y: 260, width: 200, height: 200 }
  });

  // 判定結果を保存する状態
  const [judgeResults, setJudgeResults] = useState<any>(null);

  // 枠がドラッグまたはリサイズされたときに座標を更新する関数
  const handleUpdate = (key: string, updatedBox: Box) => {
    setSections({ ...sections, [key]: updatedBox });
  };

  // 「この枠で判定する」ボタンを押したときの処理
  const handleJudgeSubmit = async () => {
    console.log("バックエンドに送信する最終座標:", sections);
    
    // 本番はここで FastAPI の /api/judge にデータを送ります
    // 今回はシミュレーションとして画面に結果を表示します
    setJudgeResults({
      top_left:     { blank_rate: 4.2,  status: "PASS" },
      top_right:    { blank_rate: 12.5, status: "FAIL" }, // 10%以上なのでFAIL
      bottom_right: { blank_rate: 8.9,  status: "PASS" }
    });
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <h2>お弁当 空白率チェッカー（管理ダッシュボード）</h2>
      <p>AIが自動検出した枠がズレている場合は、マウスで赤枠を調整してください。</p>

      {/* メインレイアウト：左側に画像、右側に判定結果 */}
      <div style={{ display: 'flex', gap: '30px', marginTop: '20px' }}>
        
        {/* 画像エリア（この上に動かせる枠を重ねる） */}
        <div style={{ position: 'relative', width: '700px', height: '500px', border: '1px solid #ccc', backgroundColor: '#fff' }}>
          <img src={imageUrl} alt="Bento" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          
          {/* 各区画の枠をループで描画 */}
          {Object.entries(sections).map(([key, box]) => (
            <Rnd
              key={key}
              size={{ width: box.width, height: box.height }}
              position={{ x: box.x, y: box.y }}
              // ドラッグ終了時に座標を記録
              onDragStop={(e, d) => handleUpdate(key, { ...box, x: d.x, y: d.y })}
              // サイズ変更終了時にサイズと座標を記録
              onResizeStop={(e, direction, ref, delta, position) => {
                handleUpdate(key, {
                  x: position.x,
                  y: position.y,
                  width: parseInt(ref.style.width),
                  height: parseInt(ref.style.height),
                });
              }}
              bounds="parent"
              style={{
                border: '2px dashed #ff4d4f',
                backgroundColor: 'rgba(255, 77, 79, 0.2)',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'flex-start'
              }}
            >
              <span style={{ background: '#ff4d4f', color: '#fff', fontSize: '12px', padding: '2px 6px', fontWeight: 'bold' }}>
                {key === 'top_left' ? '左上区画' : key === 'top_right' ? '右上区画' : '右下区画'}
              </span>
            </Rnd>
          ))}
        </div>

        {/* コントロール・結果表示エリア */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <button 
            onClick={handleJudgeSubmit} 
            style={{ padding: '15px', fontSize: '16px', backgroundColor: '#1890ff', color: '#white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            確定して空白率を測定する
          </button>

          {/* 判定結果の表示 */}
          {judgeResults && (
            <div style={{ background: '#fff', padding: '20px', borderRadius: '4px', border: '1px solid #ddd' }}>
              <h3>🔍 測定結果</h3>
              {Object.entries(judgeResults).map(([key, res]: [string, any]) => (
                <div key={key} style={{ margin: '15px 0', paddingBottom: '10px', borderBottom: '1px solid #eee' }}>
                  <strong style={{ fontSize: '15px' }}>
                    {key === 'top_left' ? '左上' : key === 'top_right' ? '右上' : '右下'}区画:
                  </strong>
                  <span style={{ marginLeft: '10px', color: res.status === 'FAIL' ? '#ff4d4f' : '#52c41a', fontWeight: 'bold' }}>
                    {res.status} （空白率: {res.blank_rate}%）
                  </span>
                  {res.status === 'FAIL' && <p style={{ color: '#ff4d4f', fontSize: '12px', margin: '5px 0 0 0' }}>⚠️ 10%以上の空白を検出しました！</p>}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
