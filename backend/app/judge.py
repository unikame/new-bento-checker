from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
import cv2
import numpy as np

app = FastAPI()

# 🌐 CORS設定：すべての外部通信からのアクセスを許可する魔法のコード
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # すべてのオリジンを許可
    allow_credentials=True,
    allow_methods=["*"],  # GET, POSTなどすべて許可
    allow_headers=["*"],  # すべてのヘッダーを許可
)

# モデルの読み込み
model = YOLO("best.pt")

@app.get("/")
def read_root():
    return {"message": "Bento Checker AI Server is running!"}

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    # 画像データを読み込む
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    # YOLOモデルで推論
    results = model(img)
    
    # 判定結果を格納するリスト
    api_results = []

    for result in results:
        boxes = result.boxes
        for box in boxes:
            # 座標取得 [xmin, ymin, xmax, ymax]
            xyxy = box.xyxy[0].tolist()
            # クラスID（0: top_left, 1: top_right, 2: bottom_right などと仮定）
            cls_id = int(box.cls[0])
            
            # クラスIDに応じたラベル名を設定
            labels = ["top_left", "top_right", "bottom_right"]
            label = labels[cls_id] if cls_id < len(labels) else f"unknown_{cls_id}"

            # ─── スカスカ率（空白率）の計算シミュレーション ───
            # 本来はここで切り抜いた区画の画像から計算します。
            # 今回はサンプルとして、YOLOが検出した信頼度（Conf）などから擬似的に算出します。
            conf = float(box.conf[0])
            sukasuka_ratio = round((1.0 - conf) * 40, 1) # 例: 0%〜40%の間で変動
            if sukasuka_ratio < 0: sukasuka_ratio = 0.0

            api_results.append({
                "label": label,
                "box": xyxy,
                "sukasuka_ratio": sukasuka_ratio
            })

    return {"results": api_results}
