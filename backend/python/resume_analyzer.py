import pdfplumber
import sys
import joblib
import json

# PDF Path
pdf_path = sys.argv[1]

# Extract Text
text = ""

with pdfplumber.open(pdf_path) as pdf:
    for page in pdf.pages:
        text += page.extract_text() or ""

text = text.lower()

# Skills Database
skills_db = [
    "java",
    "python",
    "javascript",
    "html",
    "css",
    "react",
    "node.js",
    "express",
    "mongodb",
    "sql",
    "git",
    "docker",
    "aws",
    "kubernetes",
    "linux",
    "spring",
    "spring boot",
    "hibernate",
    "selenium",
    "excel",
    "power bi",
    "pandas",
    "numpy",
    "tensorflow",
    "machine learning"
]

# Detect Skills
found_skills = []

for skill in skills_db:
    if skill in text:
        found_skills.append(skill)

# Load Model
model = joblib.load("model/role_model.pkl")
vectorizer = joblib.load("model/vectorizer.pkl")

# Convert Resume to Vector
resume_vector = vectorizer.transform([text])

# Predict Role
prediction = model.predict(resume_vector)[0]

# Predict Probabilities
probabilities = model.predict_proba(resume_vector)[0]

# Class Names
classes = model.classes_

# Top 3 Roles
top_roles = sorted(
    zip(classes, probabilities),
    key=lambda x: x[1],
    reverse=True
)[:3]

# Role Skills Mapping
role_skills = {
    "Java Developer": [
        "java",
        "sql",
        "git",
        "spring",
        "spring boot",
        "hibernate"
    ],

    "Data Science": [
        "python",
        "pandas",
        "numpy",
        "machine learning",
        "tensorflow"
    ],

    "DevOps Engineer": [
        "docker",
        "aws",
        "kubernetes",
        "linux"
    ],

    "Web Designing": [
        "html",
        "css",
        "javascript",
        "react"
    ],

    "Testing": [
        "java",
        "sql",
        "selenium"
    ],

    "Business Analyst": [
        "sql",
        "excel",
        "power bi"
    ]
}

# Missing Skills
missing_skills = []

if prediction in role_skills:
    for skill in role_skills[prediction]:
        if skill not in found_skills:
            missing_skills.append(skill)

# Resume Score
if prediction in role_skills:

    total_skills = len(role_skills[prediction])

    matched_skills = total_skills - len(missing_skills)

    score = round(
        (matched_skills / total_skills) * 100,
        2
    )

else:
    score = min(len(found_skills) * 10, 100)

# Suggestions
suggestions = []

for skill in missing_skills:
    suggestions.append(f"Learn {skill}")

if "github" not in text:
    suggestions.append("Add GitHub Profile Link")

# Final Result
result = {
    "role": prediction,

    "confidence": round(
        max(probabilities) * 100,
        2
    ),

    "score": score,

    "top_roles": [
        {
            "role": role,
            "confidence": round(
                prob * 100,
                2
            )
        }
        for role, prob in top_roles
    ],

    "skills": found_skills,

    "missing_skills": missing_skills,

    "suggestions": suggestions
}

print(json.dumps(result))