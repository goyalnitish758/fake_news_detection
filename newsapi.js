const axios = require("axios");

const NEWS_API_KEY = process.env.NEWS_API_KEY;
const SERP_API_KEY = process.env.SERP_API_KEY;

const NEWS_API_BASE = "https://newsapi.org/v2/everything";
const SERP_API_BASE = "https://serpapi.com/search";

const MAX_RESULTS = 3;
const TRUSTED_DOMAINS = "bbc.com,reuters.com,apnews.com,theguardian.com,nytimes.com,espn.com,cricbuzz.com,ndtv.com,hindustantimes.com,espncricinfo.com,thehindu.com,indianexpress.com,timesofindia.com,sportskeeda.com";

const extractKeywords = (text) => {
  const sentence = text.match(/[^.!?]+[.!?]/)?.[0] || text.substring(0, 150);
  const chunk = sentence.substring(0, 150);
  return chunk.substring(0, chunk.lastIndexOf(" ") || chunk.length).trim();
};

const searchNewsAPI = async (keywords) => {
  if (!NEWS_API_KEY) {
    console.warn("NEWS_API_KEY is not set");
    return { found: false, results: [] };
  }

  try {
    const response = await axios.get(NEWS_API_BASE, {
      params: {
        q: keywords,
        apiKey: NEWS_API_KEY,
        language: "en",
        sortBy: "relevancy",
        pageSize: MAX_RESULTS,
        domains: TRUSTED_DOMAINS,
      },
      timeout: 5000,
    });

    if (!response.data.articles || response.data.articles.length === 0) {
      return { found: false, results: [] };
    }

    const results = response.data.articles.map((article) => ({
      title: article.title,
      source: article.source?.name || "Unknown",
      url: article.url,
      publishedAt: article.publishedAt,
    }));

    return { found: true, results };
  } catch (error) {
    const status = error.response?.status;
    if (status === 429) console.error("NewsAPI rate limit hit");
    else if (status === 403) console.error("NewsAPI invalid API key");
    else console.error("NewsAPI error:", error.message);
    return { found: false, results: [] };
  }
};

const searchSerpAPI = async (keywords) => {
  if (!SERP_API_KEY) {
    console.warn("SERP_API_KEY is not set");
    return { found: false, results: [] };
  }

  try {
    const response = await axios.get(SERP_API_BASE, {
      params: {
        q: keywords,
        api_key: SERP_API_KEY,
        engine: "google",
        num: MAX_RESULTS,
        hl: "en",
        gl: "in",
      },
      timeout: 8000,
    });

    const items = response.data.organic_results;
    if (!items || items.length === 0) {
      return { found: false, results: [] };
    }

    const results = items.slice(0, MAX_RESULTS).map((item) => ({
      title: item.title,
      source: item.displayed_link || item.source || "Unknown",
      url: item.link,
      publishedAt: item.date || null,
    }));

    return { found: true, results };
  } catch (error) {
    const status = error.response?.status;
    if (status === 429) console.error("SerpAPI rate limit hit");
    else if (status === 401) console.error("SerpAPI invalid API key");
    else console.error("SerpAPI error:", error.message);
    return { found: false, results: [] };
  }
};

const searchNews = async (articleText) => {
  const keywords = extractKeywords(articleText);

  const [newsAPIResult, serpResult] = await Promise.all([
    searchNewsAPI(keywords),
    searchSerpAPI(keywords),
  ]);

  const combined = [
    ...(newsAPIResult.results || []),
    ...(serpResult.results || []),
  ];

  const seen = new Set();
  const deduped = combined.filter((item) => {
    if (seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });

  if (deduped.length === 0) {
    return { found: false, results: [] };
  }

  return { found: true, results: deduped.slice(0, MAX_RESULTS) };
};

module.exports = { searchNews };