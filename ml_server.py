from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pickle
import re
import nltk
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer

nltk.download("punkt", quiet=True)
nltk.download("stopwords", quiet=True)
nltk.download("wordnet", quiet=True)
nltk.download("punkt_tab", quiet=True)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

with open("model.pkl", "rb") as f:
    model = pickle.load(f)

with open("vectorizer.pkl", "rb") as f:
    vectorizer = pickle.load(f)

class ArticleInput(BaseModel):
    text: str

STOP_WORDS = set(stopwords.words("english"))
LEMMATIZER = WordNetLemmatizer()

def preprocess(text: str) -> str:
    text = text.lower()
    text = re.sub(r"http\S+|www\S+", "", text)
    text = re.sub(r"[^a-z\s]", "", text)
    text = re.sub(r"\s+", " ", text).strip()
    tokens = word_tokenize(text)
    tokens = [w for w in tokens if w not in STOP_WORDS]
    tokens = [LEMMATIZER.lemmatize(w) for w in tokens]
    return " ".join(tokens)

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/predict")
def predict(article: ArticleInput):
    if not article.text.strip():
        return {"error": "Empty article text"}
    processed = preprocess(article.text)
    vectorized = vectorizer.transform([processed])
    prediction = model.predict(vectorized)[0]
    probabilities = model.predict_proba(vectorized)[0]
    return {
        "verdict": "REAL" if prediction == 1 else "FAKE",
        "real_percent": round(float(probabilities[1]) * 100, 2),
        "fake_percent": round(float(probabilities[0]) * 100, 2),
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("ml_server:app", host="0.0.0.0", port=8000, reload=True)