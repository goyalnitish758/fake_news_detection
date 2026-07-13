import pandas as pd
import re
import nltk
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer

nltk.download("punkt")
nltk.download("stopwords")
nltk.download("wordnet")
nltk.download("punkt_tab")

df = pd.read_csv("cleaned_data.csv")

def preprocess(text):
    text = text.lower()

    text = re.sub(r"http\S+|www\S+", "", text)

    text = re.sub(r"[^a-z\s]", "", text)

    text = re.sub(r"\s+", " ", text).strip()

    tokens = word_tokenize(text)

    stop_words = set(stopwords.words("english"))
    tokens = [w for w in tokens if w not in stop_words]

    lemmatizer = WordNetLemmatizer()
    tokens = [lemmatizer.lemmatize(w) for w in tokens]

    return " ".join(tokens)

print("⏳ Preprocessing text... (this may take 1-2 minutes)")
df["processed"] = df["content"].apply(preprocess)

print("\n=== Before Preprocessing ===")
print(df["content"].iloc[0][:200])

print("\n=== After Preprocessing ===")
print(df["processed"].iloc[0][:200])

df.to_csv("preprocessed_data.csv", index=False)
print("\n✅ Saved preprocessed_data.csv")
