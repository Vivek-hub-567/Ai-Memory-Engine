
# AI Memory Engine

Inspired by Mem.ai

## Features
- Semantic Memory Search
- AI Memory Retrieval
- FastAPI Backend
- React Frontend
- Sentence Transformer Embeddings

## Run Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

## Run Frontend

```bash
cd frontend
npm install
npm start
```

## Train Embedding Model

```bash
cd ml
pip install -r requirements.txt
python train_model.py
```

## Editor Settings

Creating workspace settings so .jsx files open as JavaScript React automatically.

- Created `.vscode/settings.json` with `*.jsx` associated to `javascriptreact`.
- This forces VS Code to treat `App.jsx` and other `.jsx` files as JavaScript React / JSX.
