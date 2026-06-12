import pandas as pd
import joblib

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression

data = pd.read_csv("Resume Screening.csv")

X = data["Resume"]
y = data["Category"]

vectorizer = TfidfVectorizer(
stop_words="english",
max_features=5000
)

X_vec = vectorizer.fit_transform(X)

model = LogisticRegression(
max_iter=2000
)

model.fit(X_vec, y)

joblib.dump(model, "role_model.pkl")
joblib.dump(vectorizer, "vectorizer.pkl")

print("Model Trained Successfully")
print("Total Samples:", len(data))
print("Total Roles:", len(set(y)))
