import React, { useState } from 'react';
import { Rnd } from 'react-rnd';

// 型定義
interface Box { x: number; y: number; width: number; height: number; }
interface Sections { [key: string]: Box; }

export default function App() {
  // 画像ファイルと表示用URLを管理
  const [file, setFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  
  // 各区画の枠の「位置」と「サイズ」（初期値。画像がない時は非表示用）
  const [sections, setSections] = useState<Sections>({
    top_left:     { x: 50,  y: 40,  width: 180, height: 180 },
    top_right:    { x: 450, y: 40,  width: 200, height: 180 },
    bottom_right: { x: 450, y: 260, width: 200, height: 200 }
  });

  const [judgeResults, setJudgeResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // ⚠️ 【重要】ここにあなたの「8000番のパブリックURL」を貼り付けてください！
  const AI_SERVER_URL = "あなたのAIサーバーのURL"; 

  // 写真が選択された時の処理
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setImageUrl(URL.createObjectURL(selectedFile));
      setJudgeResults(null); // 前の結果をリセット
    }
  };

  // 枠がドラッグまたはリサイズされたときに座標を更新する関数
  const handleUpdate = (key: string, updatedBox: Box) => {
    setSections({ ...sections, [key]: updatedBox });
  };

  // 「確定して空白率を測定する」ボタンを押したときの処理
  const handleJudgeSubmit = async () => {
    if (!file) {
      alert("先にお弁当のファイルを選択してください！");
      return;
    }
    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      // 本物のAIサーバーに画像を送信して解析
      const response = await fetch(`${AI_SERVER_URL}/predict`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      // AIサーバーから返ってきた検出枠（あれば）を画面の赤枠に反映させる
      const updatedSections = { ...sections };
      const apiResults = data.results || [];

      // AIから結果が届いたら、その座標で画面の枠を上書き
      apiResults.forEach((res: any) => {
        if (sections[res.label]) {
          const [xmin, ymin, xmax, ymax] = res.box;
          updatedSections[res.label] = {
            x: xmin,
            y: ymin,
            width: xmax - xmin,
            height: ymax - ymin
          };
        }
      });
      setSections(updatedSections);

      // 測定結果（スカスカ率）の組み立て
      const resultsSummary: any = {};
      apiResults.forEach((res: any) => {
        resultsSummary[res.label] = {
          blank_rate: res.sukasuka_ratio,
          status: res.sukasuka_ratio >= 10.0 ? "FAIL" : "PASS" // 10%以上なら警告
        };
      });
      setJudgeResults(resultsSummary);

    } catch (error) {
      console.error(error);
      alert("AIサーバーとの通信に失敗しました。URLの設定やポートのPublic設定を確認してください。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <h2>🍱 お弁当 空白率チェッカー（AI自動検出＆手動微調整）</h2>
      <p>①お弁当の写真を選択し、②ボタンを押すとAIが自動で判定します。ズレがある場合は赤枠をマウスで調整できます。</p>

      {/* ファイル選択エリア */}
      <div style={{ marginBottom: "20px", background: "#fff", padding: "15px", borderRadius: "4px", border: "1px solid #ddd" }}>
        <input type="file" accept="image/*" onChange={handleImageChange} />
      </div>

      <div style={{ display: 'flex', gap: '30px', marginTop: '20px' }}>
        
        {/* 画像＆ドラッグエリア */}
        <div style={{ position: 'relative', width: '700px', height: '500px', border: '1px solid #ccc', backgroundColor: '#fff' }}>
          {imageUrl ? (
            <img src={imageUrl} alt="Bento" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#999' }}>
              写真を選択するとここに表示されます
            </div>
          )}
          
          {/* 画像があるときだけ枠を表示 */}
          {imageUrl && Object.entries(sections).map(([key, box]) => (
            <Rnd
              key={key}
              size={{ width: box.width, height: box.height }}
              position={{ x: box.x, y: box.y }}
              onDragStop={(e, d) => handleUpdate(key, { ...box, x: d.x, y: d.y })}
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
                justifyContent: 'flex-start',
                zIndex: 10
              }}
            >
              <span style={{ background: '#ff4d4f', color: '#fff', fontSize: '12px', padding: '2px 6px', fontWeight: 'bold', cursor: 'move' }}>
                {key === 'top_left' ? '左上区画' : key === 'top_right' ? '右上区画' : '右下区画'}
              </span>
            </Rnd>
          ))}
        </div>

        {/* コントロール・結果表示エリア */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <button 
            onClick={handleJudgeSubmit} 
            disabled={loading || !file}
            style={{ 
              padding: '15px', 
              fontSize: '16px', 
              backgroundColor: !file ? '#ccc' : '#1890ff', 
              color: '#fff', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: !file ? 'not-allowed' : 'pointer', 
              fontWeight: 'bold' 
            }}
          >
            {loading ? "⏳ AIが解析中..." : "確定して空白率を測定する"}
          </button>

          {/* 判定結果の表示 */}
          {judgeResults && (
            <div style={{ background: '#fff', padding: '20px', borderRadius: '4px', border: '1px solid #ddd' }}>
              <h3>🔍 本物のAIによる測定結果</h3>
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
