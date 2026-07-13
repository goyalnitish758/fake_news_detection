const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();
const { searchFactCheck } = require("./services/factcheck");
const { searchNews } = require("./services/newsapi");
const { fetchArticleFromURL } = require("./services/url-fetcher");

const app = express();
const PORT = process.env.PORT || 5000;
const ML_SERVER = process.env.ML_SERVER_URL || "http://localhost:8000";

const TRUSTED_NEWS_DOMAINS = [
  "bbc.com", "bbc.co.uk", "reuters.com", "apnews.com", "theguardian.com",
  "nytimes.com", "ndtv.com", "thehindu.com", "indianexpress.com",
  "hindustantimes.com", "espncricinfo.com", "cricbuzz.com",
  "timesofindia.com", "espn.com", "espn.in", "sportskeeda.com",
  "aljazeera.com", "bloomberg.com", "washingtonpost.com",
  "firstpost.com", "theprint.in", "scroll.in", "wire.in",
  "sportstar.thehindu.com", "insidesport.in",
  "rushlane.com", "autocarindia.com", "motorbeam.com",
  "cnbctv18.com", "moneycontrol.com", "livemint.com",
  "news18.com", "zeenews.india.com", "wionews.com",
  "businessstandard.com", "economictimes.indiatimes.com", "financialexpress.com",
  "angelone.in",
];

const isFromTrustedDomain = (results) => {
  return results.some((item) =>
    TRUSTED_NEWS_DOMAINS.some(
      (domain) => item.url?.includes(domain) || item.source?.includes(domain)
    )
  );
};

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json({ limit: "50kb" }));

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/fetch-url", async (req, res) => {
  const { url } = req.body;

  if (!url || !url.trim()) {
    return res.status(400).json({ error: "URL is required" });
  }

  try {
    new URL(url);
  } catch {
    return res.status(400).json({ error: "Invalid URL. Please enter a valid URL starting with http:// or https://" });
  }

  const result = await fetchArticleFromURL(url);

  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  return res.json({ text: result.text });
});

app.post("/api/predict", async (req, res) => {
  const { text } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({ error: "Article text is required" });
  }

  const wordCount = text.trim().split(/\s+/).length;
  if (wordCount < 20) {
    return res.status(400).json({ error: "Article is too short. Please paste a full news article." });
  }

  try {
    const mlResponse = await axios.post(
      `${ML_SERVER}/predict`,
      { text },
      { timeout: 10000 }
    );

    let { verdict, real_percent, fake_percent } = mlResponse.data;
    const confidence = Math.max(real_percent, fake_percent);
    let verdictSource = "ml_model";

    const [factCheckResults, newsResults] = await Promise.all([
      searchFactCheck(text),
      searchNews(text),
    ]);

    if (
      newsResults.found &&
      newsResults.results.length > 0 &&
      isFromTrustedDomain(newsResults.results)
    ) {
      verdict = "REAL";
      verdictSource = "news_verification";
    } else if (factCheckResults.found && factCheckResults.results.length > 0) {
      const ratings = factCheckResults.results.map((r) =>
        r.verdict?.toLowerCase()
      );
      const isFlagged = ratings.some((r) =>
        r.includes("false") || r.includes("fake") || r.includes("misleading")
      );
      const isVerified = ratings.some((r) =>
        r.includes("true") || r.includes("correct") || r.includes("accurate")
      );

      if (isFlagged) {
        verdict = "FAKE";
        verdictSource = "fact_check";
      } else if (isVerified) {
        verdict = "REAL";
        verdictSource = "fact_check";
      }
    }

    return res.json({
      verdict,
      real_percent,
      fake_percent,
      confidence,
      verdict_source: verdictSource,
      verification_ran: true,
      fact_check: factCheckResults,
      news: newsResults,
    });
  } catch (error) {
    console.error("Server error:", error.response?.data || error.message);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Node server running at http://localhost:${PORT}`);
});