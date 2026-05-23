
from pathlib import Path
import pandas as pd
import pickle
from sentence_transformers import SentenceTransformer

ROOT_DIR = Path(__file__).resolve().parent
DATA_PATH = ROOT_DIR / "dataset.csv"
OUTPUT_PATH = ROOT_DIR / "memory_embeddings.pkl"

if not DATA_PATH.exists():
    raise FileNotFoundError(f"Dataset not found at {DATA_PATH}")

print(f"Loading dataset from: {DATA_PATH}")
df = pd.read_csv(DATA_PATH)
print(f"Dataset loaded: {len(df)} rows")

if "memory_text" not in df.columns:
    raise ValueError("The dataset must include a 'memory_text' column.")

memory_texts = df["memory_text"].astype(str).tolist()

print("Generating embeddings using SentenceTransformer...")
model = SentenceTransformer("all-MiniLM-L6-v2")
embeddings = model.encode(
    memory_texts,
    show_progress_bar=True,
    convert_to_numpy=True,
    normalize_embeddings=True,
)

with open(OUTPUT_PATH, "wb") as f:
    pickle.dump(embeddings, f)

print(f"Embeddings generated and saved to: {OUTPUT_PATH}")
print(f"Total embeddings: {len(embeddings)}")
