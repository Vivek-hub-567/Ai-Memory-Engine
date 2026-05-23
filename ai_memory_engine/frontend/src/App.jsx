import { useEffect, useState } from "react";

const API_BASE = "http://127.0.0.1:8002";

export default function App() {
  const [memories, setMemories] = useState([]);
  const [query, setQuery] = useState("");
  const [searchMode, setSearchMode] = useState("semantic");
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [newMemoryText, setNewMemoryText] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newSentiment, setNewSentiment] = useState("positive");
  const [newImportance, setNewImportance] = useState("5");

  const loadMemories = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/memories`);
      const data = await res.json();
      setMemories(data);
      setStatusMessage("");
    } catch (error) {
      console.log(error);
      setStatusMessage("Unable to load memories right now.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchInitialMemories = async () => {
      await loadMemories();
    };
    fetchInitialMemories();
  }, []);

  const searchMemory = async () => {
    if (!query.trim()) {
      setStatusMessage("Enter a search term or reload the full memory list.");
      return;
    }

    try {
      setLoading(true);
      const endpoint = searchMode === "semantic" ? "/semantic_search" : "/search";
      const body = searchMode === "semantic" ? { query, top_k: 15 } : { query };

      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        throw new Error("Search failed");
      }

      const data = await res.json();
      const results = Array.isArray(data) ? data : data.results || [];
      setMemories(results);
      setStatusMessage(`Found ${results.length} result${results.length === 1 ? "" : "s"} using ${searchMode} search.`);
    } catch (error) {
      console.log(error);
      setStatusMessage("Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resetSearch = () => {
    setQuery("");
    loadMemories();
    setStatusMessage("Search reset.");
  };

  const createMemory = async () => {
    if (!newMemoryText.trim()) {
      setStatusMessage("Memory text cannot be empty.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/memories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          memory_text: newMemoryText,
          category: newCategory || "general",
          sentiment: newSentiment,
          importance_score: parseFloat(newImportance) || 0,
        }),
      });

      if (!res.ok) {
        throw new Error("Unable to save memory");
      }

      const created = await res.json();
      setMemories((current) => [created, ...current]);
      setNewMemoryText("");
      setNewCategory("");
      setNewSentiment("positive");
      setNewImportance("5");
      setStatusMessage("Memory saved successfully.");
    } catch (error) {
      console.log(error);
      setStatusMessage("Could not save memory. Check the backend and try again.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setNewMemoryText("");
    setNewCategory("");
    setNewSentiment("positive");
    setNewImportance("5");
    setStatusMessage("");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "32px",
        backgroundColor: "#0F172A",
        color: "#E2E8F0",
        fontFamily: "Inter, Arial, sans-serif",
      }}
    >
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <header style={{ marginBottom: "32px" }}>
          <h1 style={{ fontSize: "3rem", margin: 0, color: "#FFFFFF" }}>AI Memory Engine</h1>
          <p style={{ marginTop: "12px", color: "#94A3B8", maxWidth: "760px" }}>
            Search existing memories, add new entries, and reset the view. The app now includes a memory creation form and a more polished dashboard.
          </p>
        </header>

        <div style={{ display: "grid", gap: "24px" }}>
          <section
            style={{
              backgroundColor: "#111827",
              border: "1px solid #1E293B",
              borderRadius: "24px",
              padding: "24px",
              boxShadow: "0 24px 60px rgba(15, 23, 42, 0.35)",
            }}
          >
            <h2 style={{ color: "#FFFFFF", marginBottom: "18px" }}>Search Memories</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
              <input
                type="text"
                placeholder="Search memories..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{
                  flex: "1 1 320px",
                  minWidth: "200px",
                  padding: "14px 16px",
                  borderRadius: "14px",
                  border: "1px solid #334155",
                  backgroundColor: "#0F172A",
                  color: "#E2E8F0",
                }}
              />
              <select
                value={searchMode}
                onChange={(e) => setSearchMode(e.target.value)}
                style={{
                  borderRadius: "14px",
                  border: "1px solid #334155",
                  backgroundColor: "#0F172A",
                  color: "#E2E8F0",
                  padding: "14px 16px",
                }}
              >
                <option value="semantic">Semantic</option>
                <option value="keyword">Keyword</option>
              </select>
              <button
                onClick={searchMemory}
                style={buttonStyle}
              >
                Search
              </button>
              <button
                onClick={resetSearch}
                style={{
                  ...buttonStyle,
                  backgroundColor: "#334155",
                }}
              >
                Reset
              </button>
            </div>
          </section>

          <section
            style={{
              backgroundColor: "#111827",
              border: "1px solid #1E293B",
              borderRadius: "24px",
              padding: "24px",
              boxShadow: "0 24px 60px rgba(15, 23, 42, 0.35)",
            }}
          >
            <h2 style={{ color: "#FFFFFF", marginBottom: "18px" }}>Create Memory</h2>
            <div style={{ display: "grid", gap: "16px" }}>
              <textarea
                placeholder="Write a new memory entry..."
                value={newMemoryText}
                onChange={(e) => setNewMemoryText(e.target.value)}
                rows={4}
                style={{
                  width: "100%",
                  padding: "16px",
                  borderRadius: "16px",
                  border: "1px solid #334155",
                  backgroundColor: "#0F172A",
                  color: "#E2E8F0",
                  resize: "vertical",
                }}
              />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
                <input
                  type="text"
                  placeholder="Category"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  style={inputStyle}
                />
                <select
                  value={newSentiment}
                  onChange={(e) => setNewSentiment(e.target.value)}
                  style={inputStyle}
                >
                  <option value="positive">positive</option>
                  <option value="neutral">neutral</option>
                  <option value="negative">negative</option>
                </select>
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  placeholder="Importance"
                  value={newImportance}
                  onChange={(e) => setNewImportance(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <button
                  onClick={createMemory}
                  style={buttonStyle}
                >
                  Save Memory
                </button>
                <button
                  onClick={resetForm}
                  style={{
                    ...buttonStyle,
                    backgroundColor: "#334155",
                  }}
                >
                  Clear Form
                </button>
              </div>
            </div>
          </section>

          {statusMessage && (
            <div
              style={{
                padding: "16px 20px",
                borderRadius: "18px",
                backgroundColor: "#1E293B",
                border: "1px solid #334155",
                color: "#E2E8F0",
              }}
            >
              {statusMessage}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <div style={{ color: "#94A3B8" }}>
              {loading ? "Loading memories..." : `${memories.length} memories visible`}
            </div>
            <button
              onClick={loadMemories}
              style={{
                ...buttonStyle,
                backgroundColor: "#0B69D2",
              }}
            >
              Refresh List
            </button>
          </div>

          <div style={{ display: "grid", gap: "18px", marginTop: "12px" }}>
            {!loading && memories.length === 0 ? (
              <div style={{ color: "#94A3B8" }}>
                No memories found. Search again or add a new memory above.
              </div>
            ) : (
              memories.map((memory, index) => (
                <div
                  key={memory.memory_id || index}
                  style={{
                    backgroundColor: "#0F172A",
                    border: "1px solid #334155",
                    padding: "22px",
                    borderRadius: "20px",
                  }}
                >
                  <h2 style={{ margin: "0 0 10px", color: "#FFFFFF" }}>{memory.memory_text}</h2>
                  <div style={{ display: "grid", gap: "6px", color: "#CBD5E1" }}>
                    <span><strong>Category:</strong> {memory.category || "—"}</span>
                    <span><strong>Sentiment:</strong> {memory.sentiment || "—"}</span>
                    <span><strong>Importance:</strong> {memory.importance_score}</span>
                    {memory.semantic_score !== undefined && (
                      <span><strong>Semantic score:</strong> {memory.semantic_score.toFixed(3)}</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const buttonStyle = {
  padding: "14px 22px",
  borderRadius: "14px",
  border: "none",
  backgroundColor: "#2563EB",
  color: "#FFFFFF",
  cursor: "pointer",
  fontWeight: 600,
  transition: "transform 0.2s ease, filter 0.2s ease",
};

const inputStyle = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: "14px",
  border: "1px solid #334155",
  backgroundColor: "#0F172A",
  color: "#E2E8F0",
};