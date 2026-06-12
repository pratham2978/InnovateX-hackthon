"""
ai_model.py — Uses HuggingFace Inference API (cloud-based, no local RAM needed).

Model: mistralai/Mistral-7B-Instruct-v0.2 (via HF Inference API)
  - Runs on HuggingFace servers, zero local RAM
  - 7 Billion parameters — extremely smart, conversational, and context-aware
  - Free with HuggingFace token (rate-limited generously)

Requires: HF_TOKEN set in .env file
"""

import re
import os
import requests
from dotenv import load_dotenv

# Load token from .env
load_dotenv()
HF_TOKEN = os.getenv("HF_TOKEN", "")

# Best free model on HF Inference API for chat/instruction following
HF_MODEL = "mistralai/Mistral-7B-Instruct-v0.2"
HF_API_URL = f"https://api-inference.huggingface.co/models/{HF_MODEL}"

HEADERS = {"Authorization": f"Bearer {HF_TOKEN}"}

print(f"[StudyForge] Using HuggingFace Inference API -> {HF_MODEL}")
print(f"[StudyForge] Token loaded: {'OK' if HF_TOKEN else 'MISSING (missing!)'}")

SYSTEM_CONTEXT = """You are StudyForge AI, an expert academic study planner and coach for competitive exam students.
You help students create smart, realistic study plans for exams like JEE, NEET, UPSC, CBSE Boards, SAT, and more.
You understand that a single chapter typically requires 6–8 hours of focused study to understand, practice, and revise.
Be friendly, concise, encouraging, and always give practical, actionable advice.
When given a timetable, explain it clearly and help the student understand their schedule."""


def normalize_subject(text: str) -> str:
    text = re.sub(r"\s+", " ", text.strip())
    return text.title()


def dedupe_preserve_order(items: list[str]) -> list[str]:
    seen = set()
    result = []
    for item in items:
        if item and item not in seen:
            seen.add(item)
            result.append(item)
    return result


def infer_subjects_for_exam(text: str) -> list[str]:
    exam_subjects = {
        "mhtcet": ["Physics", "Chemistry", "Maths"],
        "jee": ["Physics", "Chemistry", "Maths"],
        "neet": ["Physics", "Chemistry", "Biology"],
        "sat": ["Maths", "Reading", "Writing"],
        "act": ["Maths", "Reading", "Science", "English"],
        "cbse": ["Maths", "Science", "English"],
        "upsc": ["History", "Polity", "Geography", "Economy", "Environment"],
    }
    normalized = text.lower()
    subjects = []
    for exam_name, defaults in exam_subjects.items():
        if re.search(rf"\b{re.escape(exam_name)}\b", normalized):
            subjects.extend(defaults)
    return dedupe_preserve_order(subjects)


def extract_study_params(history: list[dict]) -> dict | None:
    """Parse chat history and extract study parameters if possible."""
    raw_text = " ".join([m["content"] for m in history])
    text = raw_text.lower()

    params = {
        "subjects": [],
        "hard_subjects": [],
        "hours_per_day": 3,
        "exams": [],
        "deadlines": [],
        "plan_days": 7,
        "scope": "weekly",
        "target_exam": None,
        "chapters": {},
        "user_supplied_hours": False,
    }

    def add_subject(subject: str):
        cleaned = normalize_subject(subject)
        if not cleaned:
            return
        if len(cleaned.split()) > 5:
            return
        if re.search(r"\b(day|days|have|to|do|it|clear|chapters|each)\b", cleaned.lower()):
            return
        if cleaned not in params["subjects"]:
            params["subjects"].append(cleaned)

    # Explicit subject lists
    subject_patterns = [
        r"(?:subjects?|study|studying|learn|prepare for)\s*[:\-]?\s*([A-Za-z][A-Za-z0-9 &+\-,]+?)(?:[.!?\n]|$)",
        r"\bI want to study\s+([A-Za-z][A-Za-z0-9 &+\-,]+?)(?:[.!?\n]|$)",
        r"\bI'm studying\s+([A-Za-z][A-Za-z0-9 &+\-,]+?)(?:[.!?\n]|$)",
    ]
    for pat in subject_patterns:
        m = re.search(pat, raw_text, re.IGNORECASE)
        if m:
            parts = re.split(r",|\band\b|&", m.group(1))
            for part in parts:
                part = part.strip()
                if len(part.split()) <= 5:
                    add_subject(part)
            break

    known_exam_subjects = infer_subjects_for_exam(raw_text)

    # Extract target exam name
    exams_list = [
        ("jee main", "JEE Main"),
        ("jee advanced", "JEE Advanced"),
        ("jee", "JEE Main"),
        ("neet", "NEET"),
        ("mhtcet", "MHT-CET"),
        ("mht cet", "MHT-CET"),
        ("sat", "SAT"),
        ("act", "ACT"),
        ("cbse board", "CBSE Boards"),
        ("cbse", "CBSE Boards"),
        ("icse board", "ICSE Boards"),
        ("icse", "ICSE Boards"),
        ("upsc", "UPSC"),
        ("midterm", "Midterm Exams"),
        ("mid-term", "Midterm Exams"),
        ("final exam", "Final Exams"),
        ("final", "Final Exams"),
        ("semester", "Semester Exams"),
        ("board exam", "Board Exams"),
        ("board", "Board Exams"),
    ]
    for key, name in exams_list:
        if re.search(rf"\b{re.escape(key)}\b", text):
            params["target_exam"] = name
            break

    # Extract hours per day
    m_hours = re.search(r"(\d+)\s*(?:hours?|hrs?)(?:\s*per\s*day|\s*a\s*day)?", text)
    if m_hours:
        params["hours_per_day"] = int(m_hours.group(1))
        params["user_supplied_hours"] = True

    # Extract scope/type explicitly if mentioned
    scope = None
    if re.search(r"\byearly\b|\bannual\b", text):
        scope = "yearly"
    elif re.search(r"\bmonthly\b", text):
        scope = "monthly"
    elif re.search(r"\bweekly\b", text):
        scope = "weekly"
    elif re.search(r"\bdaily\b|\btoday\b", text):
        scope = "daily"

    # Extract plan duration in priority order: years > months > weeks > days
    plan_days = 0

    m_year = re.search(r"(\d+)\s*years?\b", text)
    if not m_year and re.search(r"\bone year\b|\ba year\b", text):
        plan_days = 365
    elif m_year:
        plan_days = int(m_year.group(1)) * 365

    if plan_days == 0:
        m_month = re.search(r"(\d+)\s*months?\b", text)
        if not m_month and re.search(r"\bone month\b|\ba month\b", text):
            plan_days = 30
        elif m_month:
            plan_days = int(m_month.group(1)) * 30

    if plan_days == 0:
        m_week = re.search(r"(\d+)\s*weeks?\b", text)
        if not m_week and re.search(r"\bone week\b|\ba week\b|\bfortnight\b|\ba fortnight\b", text):
            plan_days = 14 if "fortnight" in text else 7
        elif m_week:
            plan_days = int(m_week.group(1)) * 7

    if plan_days == 0:
        m_day = re.search(r"(\d+)\s*days?\b", text)
        if m_day:
            plan_days = int(m_day.group(1))

    # Fallback based on scope or default
    if plan_days == 0:
        if scope == "yearly":
            plan_days = 365
        elif scope == "monthly":
            plan_days = 30
        elif scope == "weekly":
            plan_days = 7
        elif scope == "daily":
            plan_days = 1
        else:
            plan_days = 7

    params["plan_days"] = plan_days

    # Infer scope from plan_days if no explicit keyword
    if not scope:
        if plan_days <= 2:
            scope = "daily"
        elif plan_days <= 14:
            scope = "weekly"
        elif plan_days <= 90:
            scope = "monthly"
        else:
            scope = "yearly"

    params["scope"] = scope

    # Extract exam dates (e.g. "math exam in 5 days")
    exam_pattern = re.compile(
        r"([A-Za-z][A-Za-z0-9 &+\-,]{0,100}?)\s+(?:exam|test|quiz)\s+(?:in\s+)?(?:next\s+)?(\d+)\s+days?",
        re.IGNORECASE,
    )
    for m in exam_pattern.finditer(raw_text):
        subject = normalize_subject(m.group(1))
        days = int(m.group(2))
        params["exams"].append({"subject": subject, "days": days})
        add_subject(subject)

    # Recognize known exam names
    exam_subject_map = {
        "mhtcet": ["Physics", "Chemistry", "Maths"],
        "jee": ["Physics", "Chemistry", "Maths"],
        "neet": ["Physics", "Chemistry", "Biology"],
        "sat": ["Maths", "Reading", "Writing"],
        "act": ["Maths", "Reading", "Science", "English"],
    }
    for exam_name, default_subjects in exam_subject_map.items():
        if re.search(rf"\b{re.escape(exam_name)}\b", raw_text, re.IGNORECASE):
            for s in default_subjects:
                add_subject(s)
            m = re.search(
                rf"{re.escape(exam_name)}(?:\s+exam)?\s+(?:in|after)\s+(\d+)\s+days?",
                raw_text, re.IGNORECASE,
            )
            if m:
                params["exams"].append({"subject": normalize_subject(exam_name), "days": int(m.group(1))})
            m2 = re.search(
                rf"(\d+)\s+days?\s+(?:until|left)\s+{re.escape(exam_name)}",
                raw_text, re.IGNORECASE,
            )
            if m2:
                params["exams"].append({"subject": normalize_subject(exam_name), "days": int(m2.group(1))})

    # Auto-fill subjects from exam/deadline lists
    if not params["subjects"]:
        for item in params["exams"] + params["deadlines"]:
            add_subject(item["subject"])

    if not params["subjects"] and known_exam_subjects:
        for subj in known_exam_subjects:
            add_subject(subj)

    # Extract deadlines
    deadline_pattern = re.compile(
        r"([A-Za-z][A-Za-z0-9 &+\-,]{0,100}?)\s+(?:assignment|deadline|essay|project|task|due)\s+(?:in\s+)?(?:next\s+)?(\d+)\s+days?",
        re.IGNORECASE,
    )
    for m in deadline_pattern.finditer(raw_text):
        subject = normalize_subject(m.group(1))
        days = int(m.group(2))
        params["deadlines"].append({"subject": subject, "days": days})
        add_subject(subject)

    # Extract hard subjects
    hard_patterns = [
        r"(?:hardest|hard|difficult|challenging|tough)\s+(?:subject|topic|course|class|study)\s*(?:is|are)?\s*[:\-]?\s*([A-Za-z0-9&+\-]+(?:\s+[A-Za-z0-9&+\-]+){0,2})(?:[.!?\n]|$)",
        r"\bI(?:'m| am)?\s+finding\s+([A-Za-z0-9&+\-]+(?:\s+[A-Za-z0-9&+\-]+){0,2})\s+(?:hard|difficult|tough|challenging)",
        r"\b([A-Za-z0-9&+\-]+(?:\s+[A-Za-z0-9&+\-]+){0,2})\s+is\s+(?:hardest|difficult|tough|challenging)",
    ]
    for pat in hard_patterns:
        for m in re.finditer(pat, raw_text, re.IGNORECASE):
            subject = normalize_subject(m.group(1))
            if subject and subject not in params["hard_subjects"]:
                params["hard_subjects"].append(subject)
                add_subject(subject)

    # Fallback: known subject keywords
    keywords = [
        "math", "maths", "mathematics", "physics", "chemistry", "biology",
        "history", "english", "computer", "cs", "economics", "accounting",
        "statistics",
    ]
    for kw in keywords:
        if re.search(r"\b" + re.escape(kw) + r"\b", text):
            add_subject(kw)

    if not params["subjects"] and known_exam_subjects:
        for subj in known_exam_subjects:
            add_subject(subj)

    # Extract chapters per subject
    # e.g. "9 chapters from each subject" or "Physics has 12 chapters"
    m = re.search(r"(\d+)\s+chapters?(?:\s+from\s+each)?", text)
    if m:
        chap_count = int(m.group(1))
        if "each" in text:
            params["chapters"] = {}
            for s in params["subjects"]:
                params["chapters"][s] = chap_count
        else:
            # Try to assign to a specific subject mentioned nearby
            for sub in params["subjects"]:
                pat = rf"\b{re.escape(sub.lower())}\b.{{0,40}}{m.group(1)}\s+chapters?"
                if re.search(pat, text):
                    params["chapters"][sub] = chap_count

    params["subjects"] = dedupe_preserve_order(params["subjects"])
    params["hard_subjects"] = dedupe_preserve_order(params["hard_subjects"])

    # Clean up hard_subjects
    cleaned_hards = []
    for h in params["hard_subjects"]:
        parts = h.split()
        if any(w.lower() in ("do", "it", "days", "to", "have", "clear", "each", "chapters") for w in parts):
            candidate = parts[-1]
        else:
            candidate = h
        candidate = normalize_subject(candidate)
        if candidate and candidate not in cleaned_hards:
            cleaned_hards.append(candidate)
            add_subject(candidate)
    params["hard_subjects"] = cleaned_hards
    params["raw_text"] = text

    return params if params["subjects"] else None


def get_ai_response(user_message: str, history: list[dict], timetable_summary: str = None) -> str:
    """Generate AI response using HuggingFace Inference API (Mistral-7B-Instruct)."""

    # Build conversation history using Mistral's [INST] chat format
    timetable_context = ""
    if timetable_summary:
        timetable_context = (
            f"\n\n[ACTIVE STUDY PLAN GENERATED]\n{timetable_summary}\n"
            f"Use this information to help the student understand their schedule, "
            f"give subject-specific tips, and answer questions about their plan."
        )

    system_prompt = SYSTEM_CONTEXT + timetable_context

    # Build Mistral instruction format
    messages_text = ""
    for msg in history[-6:]:
        if msg["role"] == "user":
            messages_text += f"[INST] {msg['content']} [/INST] "
        else:
            messages_text += f"{msg['content']} </s> "

    # Final prompt
    full_prompt = f"<s>[INST] <<SYS>>\n{system_prompt}\n<</SYS>>\n\n{messages_text}{user_message} [/INST]"

    payload = {
        "inputs": full_prompt,
        "parameters": {
            "max_new_tokens": 512,
            "temperature": 0.7,
            "top_p": 0.9,
            "do_sample": True,
            "return_full_text": False,
        },
        "options": {
            "wait_for_model": True,
            "use_cache": False,
        }
    }

    try:
        response = requests.post(HF_API_URL, headers=HEADERS, json=payload, timeout=30)
        if response.status_code == 200:
            result = response.json()
            if isinstance(result, list) and result:
                ai_reply = result[0].get("generated_text", "").strip()
                # Strip any repeated instruction artifacts
                if "[/INST]" in ai_reply:
                    ai_reply = ai_reply.split("[/INST]")[-1].strip()
                return ai_reply if ai_reply else _fallback_reply(user_message, timetable_summary)
            else:
                return _fallback_reply(user_message, timetable_summary)
        elif response.status_code == 503:
            # Model is loading on HF servers — use fallback
            return "⏳ The AI model is warming up on HuggingFace servers (can take ~20s the first time). Please try again in a moment!"
        else:
            print(f"[StudyForge] HF API error {response.status_code}: {response.text[:200]}")
            return _fallback_reply(user_message, timetable_summary)
    except requests.exceptions.Timeout:
        return "⏳ The request timed out. HuggingFace servers might be busy — please try again!"
    except Exception as e:
        print(f"[StudyForge] API exception: {e}")
        return _fallback_reply(user_message, timetable_summary)


def _fallback_reply(user_message: str, timetable_summary: str = None) -> str:
    """Rule-based fallback when the API is unavailable."""
    msg = user_message.lower()
    if timetable_summary:
        return (
            "[OK] I've generated your personalized study roadmap! Check the left panel for your full schedule. "
            "Each subject has been prioritized based on difficulty and urgency. "
            "Remember — one chapter typically needs 6–8 hours of focused study. Good luck! "
        )
    if any(w in msg for w in ["hello", "hi", "hey"]):
        return "Hey! 👋 I'm StudyForge AI. Tell me your exam, subjects, and how many days you have — I'll build your perfect study plan!"
    if any(w in msg for w in ["timetable", "schedule", "plan", "routine"]):
        return "Tell me: **which exam** you're preparing for, **how many days/weeks/months** you have, **your subjects**, and **daily study hours** — I'll generate your smart study roadmap instantly!"
    return "I'm here to help you ace your exams!  Share your exam details and I'll craft a personalized study plan for you."
