import "./Fakenewsdetector.css";
import { useState, useEffect } from "react";
import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api/predict";
const FETCH_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace("/api/predict", "/api/fetch-url")
  : "http://localhost:5000/api/fetch-url";

function ConfidenceBar({ label, value, color }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(value), 120);
    return () => clearTimeout(t);
  }, [value]);
  return (
    <div className="meter-row">
      <span className="meter-label">{label}</span>
      <div className="meter-track">
        <div
          className="meter-fill"
          style={{ width: `${width}%`, background: color }}
        />
      </div>
      <span className="meter-value" style={{ color }}>
        {Math.round(value)}%
      </span>
    </div>
  );
}

function SourceCard({ item, type }) {
  return (
    <a href={item.url} target="_blank" rel="noreferrer" className="source-card">
      <div className="source-card-body">
        <span className="source-card-title">
          {type === "fact" ? item.claim : item.title}
        </span>
        <span className="source-card-meta">
          {item.source}
          {type === "fact" && item.verdict && (
            <span className="source-verdict-tag">{item.verdict}</span>
          )}
          {type === "news" &&
            item.publishedAt &&
            item.publishedAt !== "1/1/1970" && (
              <> · {new Date(item.publishedAt).toLocaleDateString()}</>
            )}
        </span>
      </div>
      <svg className="source-arrow" viewBox="0 0 16 16" fill="none">
        <path
          d="M3 8h10M9 4l4 4-4 4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </a>
  );
}

export default function FakeNewsDetector() {
  const [url, setUrl] = useState("");
  const [article, setArticle] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");

  const verdictSourceLabel = {
    news_verification: "Matched in trusted news archives",
    fact_check: "Cross-referenced with fact-checkers",
    ml_model: "Based on AI model analysis",
  };

  const handleFetchURL = async () => {
    if (!url.trim()) return;
    setError("");
    setFetching(true);
    try {
      const response = await axios.post(FETCH_URL, { url });
      setArticle(response.data.text);
    } catch (err) {
      setError(
        err.response?.data?.error || "Failed to fetch article from URL.",
      );
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async () => {
    if (!article.trim()) {
      setError("Paste article text or fetch from a URL first.");
      return;
    }
    if (article.length > 10000) {
      setError("Article exceeds 10,000 characters. Please shorten it.");
      return;
    }
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const response = await axios.post(
        API_URL,
        { text: article },
        { timeout: 15000 },
      );
      setResult(response.data);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Backend unreachable. Ensure the server is running.",
      );
    } finally {
      setLoading(false);
    }
  };

  const isReal = result?.verdict === "REAL";

  return (
    <div className="fnd-root">
      <div className="fnd-layout">
        {/* ── Sidebar ── */}
        <aside className="fnd-sidebar">
          <p className="sidebar-desc">
            Paste any news article and our system cross-references trusted
            sources and AI analysis to verify its credibility.
          </p>

          <div className="sidebar-meta">
            <div className="meta-row">
              <span className="meta-label">Status</span>
              <span className="meta-value">
                <span
                  className={`status-dot ${loading ? "loading" : "ready"}`}
                />
                {loading ? "Analysing" : "Ready"}
              </span>
            </div>
            <div className="meta-row">
              <span className="meta-label">Accuracy</span>
              <span className="meta-value">98.3%</span>
            </div>
            <div className="meta-row">
              <span className="meta-label">Sources</span>
              <span className="meta-value">12,000+</span>
            </div>
            <div className="meta-row">
              <span className="meta-label">Avg. time</span>
              <span className="meta-value">&lt; 2s</span>
            </div>
          </div>
        </aside>

        {/* ── Main ── */}
        <main className="fnd-main">
          <div className="main-header">
            <h1 className="main-title">Fake News Detector</h1>
            <p className="main-subtitle">
              Enter a URL or paste article text to begin analysis.
            </p>
          </div>

          <div className="form-body">
            {/* URL */}
            <div className="field-group">
              <label className="field-label" htmlFor="url-input">
                Article URL
              </label>
              <div className="url-row">
                <input
                  id="url-input"
                  className="fnd-input"
                  type="url"
                  placeholder="https://example.com/article"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleFetchURL()}
                />
                <button
                  className="btn-secondary"
                  onClick={handleFetchURL}
                  disabled={fetching || !url.trim()}
                >
                  {fetching ? "Fetching…" : "Fetch"}
                </button>
              </div>
            </div>

            <div className="or-row">
              <span>or paste text directly</span>
            </div>

            {/* Textarea */}
            <div className="field-group">
              <div className="field-label-row">
                <label className="field-label" htmlFor="article-input">
                  Article Text
                </label>
                <span className="char-count">{article.length} / 10,000</span>
              </div>
              <textarea
                id="article-input"
                className="fnd-textarea"
                placeholder="Paste the full article content here…"
                value={article}
                onChange={(e) => setArticle(e.target.value)}
                maxLength={10000}
              />
            </div>

            {error && (
              <p className="fnd-error" role="alert">
                {error}
              </p>
            )}

            <button
              className="btn-primary"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="btn-spinner" aria-hidden="true" /> Analysing…
                </>
              ) : (
                "Analyse Article"
              )}
            </button>

            {/* Result */}
            {result && (
              <div
                className={`result-card ${isReal ? "result-real" : "result-fake"}`}
              >
                <div className="result-verdict-row">
                  <div
                    className={`verdict-icon ${isReal ? "icon-real" : "icon-fake"}`}
                  >
                    {isReal ? (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 16 16"
                        fill="none"
                      >
                        <path
                          d="M3 8l3.5 3.5L13 5"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 16 16"
                        fill="none"
                      >
                        <path
                          d="M4 4l8 8M12 4l-8 8"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                    )}
                  </div>
                  <div>
                    <h2
                      className={`verdict-label ${isReal ? "label-real" : "label-fake"}`}
                    >
                      {isReal ? "Real News" : "Likely Fake"}
                    </h2>
                    {result.verdict_source && (
                      <p className="verdict-source">
                        {verdictSourceLabel[result.verdict_source] ||
                          result.verdict_source}
                      </p>
                    )}
                  </div>
                </div>

                {(result.real_score != null || result.fake_score != null) && (
                  <div className="result-section">
                    <h3 className="section-title">Confidence</h3>
                    {result.real_score != null && (
                      <ConfidenceBar
                        label="Real"
                        value={result.real_score * 100}
                        color="#4ade80"
                      />
                    )}
                    {result.fake_score != null && (
                      <ConfidenceBar
                        label="Fake"
                        value={result.fake_score * 100}
                        color="#f87171"
                      />
                    )}
                  </div>
                )}

                {result.verdict_source === "news_verification" &&
                  result.news?.found &&
                  result.news.results.length > 0 && (
                    <div className="result-section">
                      <h3 className="section-title">
                        Found in trusted sources
                      </h3>
                      {result.news.results.map((item, i) => (
                        <SourceCard key={i} item={item} type="news" />
                      ))}
                    </div>
                  )}

                {result.verdict_source === "fact_check" &&
                  result.fact_check?.found &&
                  result.fact_check.results.length > 0 && (
                    <div className="result-section">
                      <h3 className="section-title">Fact check results</h3>
                      {result.fact_check.results.map((item, i) => (
                        <SourceCard key={i} item={item} type="fact" />
                      ))}
                    </div>
                  )}

                {!result.news?.found && !result.fact_check?.found && (
                  <p className="no-sources">
                    No matches in live databases — verdict based on AI model
                    only.
                  </p>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
