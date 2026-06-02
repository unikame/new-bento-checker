# new-bento-checker

お弁当の「スカスカ率（空白率）」を自動判定し、Web上で管理・調整するシステム。

## 構成
- `frontend/`: React + TypeScript (手動微調整UI)
- `backend/`: FastAPI + OpenCV (判定ロジック)
- `ai/`: YOLOv8 (区画検出モデルの学習)
