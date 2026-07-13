import pandas as pd
import pickle
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
)

df = pd.read_csv("preprocessed_data.csv")

df = df.dropna(subset=["processed"])

X = df["processed"]
y = df["label"]

print("⏳ Vectorizing text with TF-IDF...")
vectorizer = TfidfVectorizer(max_features=50000, ngram_range=(1, 2))
X_vec = vectorizer.fit_transform(X)
print(f"✅ TF-IDF shape: {X_vec.shape}")

X_train, X_test, y_train, y_test = train_test_split(
    X_vec, y, test_size=0.2, random_state=42
)
print(f"\nTraining samples : {X_train.shape[0]}")
print(f"Testing  samples : {X_test.shape[0]}")

print("\n⏳ Training model...")
model = LogisticRegression(max_iter=1000)
model.fit(X_train, y_train)
print("✅ Model trained!")

y_pred = model.predict(X_test)

print("\n=== Accuracy ===")
print(f"{accuracy_score(y_test, y_pred) * 100:.2f}%")

print("\n=== Classification Report ===")
print(classification_report(y_test, y_pred, target_names=["Fake", "Real"]))

cm = confusion_matrix(y_test, y_pred)
plt.figure(figsize=(6, 4))
sns.heatmap(
    cm,
    annot=True,
    fmt="d",
    cmap="Blues",
    xticklabels=["Fake", "Real"],
    yticklabels=["Fake", "Real"],
)
plt.title("Confusion Matrix")
plt.ylabel("Actual")
plt.xlabel("Predicted")
plt.tight_layout()
plt.savefig("confusion_matrix.png")
plt.show()
print("✅ Saved confusion_matrix.png")

with open("model.pkl", "wb") as f:
    pickle.dump(model, f)

with open("vectorizer.pkl", "wb") as f:
    pickle.dump(vectorizer, f)

print("✅ Saved model.pkl and vectorizer.pkl")
