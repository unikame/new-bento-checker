import cv2
import numpy as np
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO

app = FastAPI()

# React画面（フロントエンド）からの接続を許可する設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 開発時はすべて許可
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. あなたがダウンロードしたAIの頭脳（best.pt）を読み込む
model = YOLO("best.pt")


def calculate_sukasuka_ratio(cropped_img):
    """区画内の画像から『容器の底（空白）』の割合を計算する関数"""
    # 画像をグレースケール（白黒）に変換
    gray = cv2.cvtColor(cropped_img, cv2.COLOR_BGR2GRAY)

    # 二値化（境界をハッキリさせる処理）
    # ※ お弁当箱の底の色に合わせて、ここの閾値（現在は127）を調整します
    _, thresh = cv2.threshold(gray, 127, 255, cv2.THRESH_BINARY)

    # 全ピクセル数に占める「底（空白）」のピクセル数の割合を計算
    total_pixels = thresh.size
    empty_pixels = np.sum(thresh == 0)  # 仮に暗い部分を底とした場合

    ratio = (empty_pixels / total_pixels) * 100
    return round(ratio, 1)


@app.post("/predict")
async def predict_bento(file: UploadFile = File(...)):
    # 2. 画面から送られてきた画像ファイルを受け取って、OpenCV形式に変換
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    # 3. AIで「top_left」「top_right」「bottom_right」の区画を検出
    results = model(img)
    boxes = results[0].boxes

    response_data = []

    for box in boxes:
        cls_id = int(box.cls[0])
        label = model.names[cls_id]  # 例: 'top_right'
        xyxy = box.xyxy[0].tolist()  # 四角い枠の座標 [左, 上, 右, 下]

        # 4. 検出された区画だけを切り抜く
        xmin, ymin, xmax, ymax = map(int, xyxy)
        cropped = img[ymin:ymax, xmin:xmax]

        # 5. 切り抜いた区画のスカスカ率を計算
        sukasuka_percentage = calculate_sukasuka_ratio(cropped)

        response_data.append(
            {
                "label": label,
                "box": [xmin, ymin, xmax, ymax],
                "sukasuka_ratio": sukasuka_percentage,
            }
        )

    # 6. 画面（React）に計算結果を返す
    return {"results": response_data}
