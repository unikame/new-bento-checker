from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# 🌐 すべての通信を許可するCORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Bento Checker AI Server is running!"}

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    # 🧪 フロントエンド（App.tsx）が確実に受け取れる形式の固定データを返します
    return {
        "results": [
            {"label": "top_left", "box": [50, 40, 230, 220], "sukasuka_ratio": 4.2},
            {"label": "top_right", "box": [450, 40, 650, 220], "sukasuka_ratio": 12.5},
            {"label": "bottom_right", "box": [450, 260, 650, 460], "sukasuka_ratio": 8.9}
        ]
    }
