const axios = require("axios");
const cheerio = require("cheerio");

const fetchArticleFromURL = async (url) => {
  try {
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    const $ = cheerio.load(response.data);

    const metaTitle =
      $('meta[property="og:title"]').attr("content") ||
      $('meta[name="twitter:title"]').attr("content") ||
      $("title").text().trim() || "";

    const metaDescription =
      $('meta[property="og:description"]').attr("content") ||
      $('meta[name="description"]').attr("content") || "";

    $("script, style, noscript, iframe").remove();

    let bodyText = "";

    const selectors = [
      "article",
      '[class*="article-body"]',
      '[class*="article-content"]',
      '[class*="article-text"]',
      '[class*="story-body"]',
      '[class*="story-content"]',
      '[class*="post-body"]',
      '[class*="post-content"]',
      '[class*="entry-content"]',
      '[class*="news-content"]',
      '[class*="news-body"]',
      ".content-body",
      ".article",
      ".story",
      "main",
    ];

    for (const selector of selectors) {
      const found = $(selector).text().trim();
      if (found && found.length > 200) {
        bodyText = found;
        break;
      }
    }

    if (!bodyText || bodyText.length < 200) {
      const paragraphs = [];
      $("p").each((_, el) => {
        const text = $(el).text().trim();
        const colonCount = (text.match(/:/g) || []).length;
        const hasCSS = text.includes("{") || text.includes("}") || text.includes("!important");
        if (text.length > 40 && !hasCSS && colonCount < 5) {
          paragraphs.push(text);
        }
      });
      if (paragraphs.length > 0) {
        bodyText = paragraphs.join(" ");
      }
    }

    if (!bodyText || bodyText.length < 200) {
      $("nav, footer, header, aside").remove();
      bodyText = $("body").text().replace(/\s+/g, " ").trim();
    }

    bodyText = bodyText.replace(/\s+/g, " ").trim();

    const fullText = [metaTitle, metaDescription, bodyText]
      .filter(Boolean)
      .join(". ");

    if (!fullText || fullText.length < 100) {
      return { success: false, error: "Could not extract article text from this URL." };
    }

    return {
      success: true,
      text: fullText.substring(0, 8000),
      title: metaTitle,
    };
  } catch (error) {
    if (error.code === "ECONNREFUSED") return { success: false, error: "Could not connect to the URL." };
    if (error.response?.status === 403) return { success: false, error: "This website blocked access." };
    if (error.response?.status === 404) return { success: false, error: "Page not found." };
    return { success: false, error: "Failed to fetch the URL. Try pasting the article text directly." };
  }
};

module.exports = { fetchArticleFromURL };