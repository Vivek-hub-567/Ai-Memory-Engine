from datetime import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import pickle
import numpy as np
from sentence_transformers import SentenceTransformer
from pathlib import Path

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ROOT_DIR = Path(__file__).resolve().parent
DATA_PATH = ROOT_DIR / "dataset.csv"
EMBEDDINGS_PATH = ROOT_DIR.parent / "ml" / "memory_embeddings.pkl"

df = pd.read_csv(DATA_PATH)

class Query(BaseModel):
    query: str

class SearchQuery(BaseModel):
    query: str
    top_k: int = 10

class NewMemory(BaseModel):
    memory_text: str
    category: str
    sentiment: str
    importance_score: float

semantic_model = None
semantic_embeddings = None

def _load_semantic_assets():
    global semantic_model, semantic_embeddings
    semantic_model = SentenceTransformer("all-MiniLM-L6-v2")

    if EMBEDDINGS_PATH.exists():
        with open(EMBEDDINGS_PATH, "rb") as f:
            semantic_embeddings = np.asarray(pickle.load(f))

        if semantic_embeddings.ndim == 1:
            semantic_embeddings = np.vstack(semantic_embeddings)

        print(f"Loaded {semantic_embeddings.shape[0]} semantic embeddings from {EMBEDDINGS_PATH}")
    else:
        print(f"Semantic embeddings not found at {EMBEDDINGS_PATH}. Semantic search will be unavailable.")

_load_semantic_assets()

def _next_memory_id() -> str:
    if df.empty:
        return "M0001"

    ids = df["memory_id"].astype(str).str.extract(r"M(\d+)")
    max_id = ids[0].astype(int).max()
    return f"M{max_id + 1:04d}"

@app.get("/memories")
def get_memories():
    return df.head(50).to_dict(orient="records")

@app.post("/search")
def search_memory(query: Query):
    search_text = str(query.query).lower()

    results = df[
        df["memory_text"]
        .astype(str)
        .str.lower()
        .str.contains(search_text, na=False)
    ]

    print(results)

    return results.head(20).to_dict(orient="records")

@app.post("/semantic_search")
def semantic_search(query: SearchQuery):
    if semantic_embeddings is None:
        return {
            "error": "Semantic embeddings are not loaded.",
            "results": [],
        }

    search_text = str(query.query).strip()
    if not search_text:
        return []

    q_embedding = semantic_model.encode(
        [search_text],
        convert_to_numpy=True,
        normalize_embeddings=True,
    )[0]

    similarities = np.dot(semantic_embeddings, q_embedding)
    best_idx = np.argsort(similarities)[::-1][: query.top_k]
    results = df.iloc[best_idx].copy()
    results["semantic_score"] = similarities[best_idx]

    return results.to_dict(orient="records")

@app.post("/memories")
def create_memory(memory: NewMemory):
    global df, semantic_embeddings

    new_id = _next_memory_id()
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    embedding_vector = "[]"
    if semantic_model is not None:
        embedding = semantic_model.encode(
            [memory.memory_text],
            convert_to_numpy=True,
            normalize_embeddings=True,
        )[0]
        embedding_vector = str(embedding.tolist())

        if semantic_embeddings is None:
            semantic_embeddings = embedding.reshape(1, -1)
        else:
            semantic_embeddings = np.vstack([semantic_embeddings, embedding])

        try:
            with open(EMBEDDINGS_PATH, "wb") as f:
                pickle.dump(semantic_embeddings, f)
        except Exception as save_error:
            print(f"Warning: Could not update semantic embeddings file: {save_error}")

    new_row = {
        "memory_id": new_id,
        "user_id": "U000",
        "timestamp": timestamp,
        "memory_text": memory.memory_text,
        "category": memory.category,
        "importance_score": memory.importance_score,
        "emotional_score": 0.0,
        "keywords": "",
        "embedding_vector": embedding_vector,
        "source": "manual",
        "last_accessed": timestamp,
        "access_count": 0,
        "expiry_score": 0.0,
        "context_tags": "",
        "linked_memories": "",
        "sentiment": memory.sentiment,
        "confidence_score": 0.0,
    }

    df = pd.concat([df, pd.DataFrame([new_row])], ignore_index=True)
    df.to_csv(DATA_PATH, index=False)

    return new_row
