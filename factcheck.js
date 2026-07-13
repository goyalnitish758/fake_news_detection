const axios = require("axios");

const GOOGLE_FACT_CHECK_API_KEY = process.env.GOOGLE_FACT_CHECK_API_KEY;
const BASE_URL = "https://factchecktools.googleapis.com/v1alpha1/claims:search";

const extractQuery = (text) => {
  const sentence = text.match(/[^.!?]+[.!?]/)?.[0] || text.substring(0, 150);
  const chunk = sentence.substring(0, 150);
  return chunk
    .substring(0, chunk.lastIndexOf(" ") || chunk.length)
    .replace(/[""'']/g, '"')
    .replace(/[^\w\s-]/g, " ")
    .trim();
};

const searchFactCheck = async (articleText) => {
  if (!GOOGLE_FACT_CHECK_API_KEY) {
    console.warn("GOOGLE_FACT_CHECK_API_KEY is not set");
    return { found: false, results: [] };
  }

  try {
    const query = extractQuery(articleText);

    const response = await axios.get(BASE_URL, {
      params: {
        query,
        key: GOOGLE_FACT_CHECK_API_KEY,
        languageCode: "en",
      },
      timeout: 5000,
    });

    if (!response.data.claims) {
      return { found: false, results: [] };
    }

    const results = response.data.claims.map((claim) => {
      const review = claim.claimReview?.[0];
      return {
        claim: claim.text,
        verdict: review?.textualRating || "Unknown",
        source: review?.publisher?.name || "Unknown",
        url: review?.url || "",
      };
    });

    return { found: true, results: results.slice(0, 3) };
  } catch (error) {
    return { found: false, results: [] };
  }
};

module.exports = { searchFactCheck };
