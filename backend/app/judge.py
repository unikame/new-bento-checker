import cv2
import numpy as np

def calculate_blank_rate_and_judge(image_path: str, box: dict) -> dict:
    """
    box: {"x": int, "y": int, "width": int, "height": int} の形式
    """
    # 1. 画像の読み込み
    img = cv2.imread(image_path)
    if img is None:
        return {"error": "画像が見つかりません"}
        
    h_img, w_img, _ = img.shape
    
    # 2. 画面から送られてくる座標が画像からはみ出さないように安全ガードを入れる
    x = max(0, box["x"])
    y = max(0, box["y"])
    w = min(box["width"], w_img - x)
    h = min(box["height"], h_img - y)
    
    # 3. 区画の切り出し
    crop_img = img[y:y+h, x:x+w]
    
    # 4. HSV色空間に変換して、容器の底（赤茶色）を検出
    hsv = cv2.cvtColor(crop_img, cv2.COLOR_BGR2HSV)
    
    # お弁当箱の「赤茶色」の範囲（照明に合わせて後で微調整）
    lower_brown = np.array([0, 40, 40])
    upper_brown = np.array([20, 255, 150])
    mask = cv2.inRange(hsv, lower_brown, upper_brown)
    
    # 5. 空白率の計算
    total_pixels = mask.size
    if total_pixels == 0:
        return {"blank_rate": 0, "status": "ERROR"}
        
    blank_pixels = cv2.countNonZero(mask)
    blank_rate = (blank_pixels / total_pixels) * 100
    
    # 6. 10%以上ならFAIL、未満ならPASS
    status = "FAIL" if blank_rate >= 10.0 else "PASS"
    
    return {
        "blank_rate": round(blank_rate, 2),
        "status": status
    }
