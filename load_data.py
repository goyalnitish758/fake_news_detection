import pandas as pd
import matplotlib.pyplot as plt

true_df = pd.read_csv("True.csv")
fake_df = pd.read_csv("Fake.csv")

true_df["label"] = 1   # 1 = Real
fake_df["label"] = 0   # 0 = Fake

df = pd.concat([true_df, fake_df], ignore_index=True)#combine both tables into big table

df["content"] = df["title"] + " " + df["text"]

df = df[["content", "label"]]

df = df.sample(frac=1, random_state=42).reset_index(drop=True)#shuffle rows

print("=== Dataset Shape ===")
print(df.shape)

print("\n=== Sample Rows ===")
print(df.head(3))

print("\n=== Label Distribution ===")
print(df["label"].value_counts())
print("0 = Fake News")
print("1 = Real News")

df.to_csv("cleaned_data.csv", index=False)
print("\n✅ Saved cleaned_data.csv")

df["label"].value_counts().plot(kind="bar", color=["red", "green"])
plt.title("Fake vs Real News Count")
plt.xticks([0, 1], ["Fake", "Real"], rotation=0)
plt.ylabel("Count")
plt.tight_layout()
plt.savefig("label_distribution.png")
plt.show()
print("✅ Saved label_distribution.png")
