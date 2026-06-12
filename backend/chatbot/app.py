from flask import Flask, render_template, request, jsonify, session
from timetable import generate_timetable, timetable_summary
from ai_model import get_ai_response, extract_study_params
import json, os, uuid

app = Flask(__name__)
app.secret_key = os.urandom(24)

@app.route("/")
def index():
    if "session_id" not in session:
        session["session_id"] = str(uuid.uuid4())
    return render_template("index.html")

@app.route("/chat", methods=["POST"])
def chat():
    data = request.json
    user_msg = data.get("message", "").strip()
    chat_history = data.get("history", [])

    if not user_msg:
        return jsonify({"error": "Empty message"}), 400

    # First, extract parameter profile from user message and history
    all_messages = chat_history + [{"role": "user", "content": user_msg}]
    params = extract_study_params(all_messages)

    timetable = None
    tt_summary = None

    if params and params["subjects"]:
        # Decide if we should generate a timetable now
        generate_now = (
            params.get("plan_days") != 7
            or params.get("exams")
            or params.get("deadlines")
            or params.get("scope") != "weekly"
            or params.get("target_exam") is not None
            or any(keyword in user_msg.lower() for keyword in ["timetable", "schedule", "plan", "study plan", "exam", "syllabus", "chapters", "weekly", "monthly", "daily", "yearly", "routine"])
            or any(keyword in params.get("raw_text", "") for keyword in ["mhtcet", "jee", "neet", "sat", "act"])
        )
        if generate_now:
            try:
                timetable = generate_timetable(params)
                if timetable:
                    tt_summary = timetable_summary(timetable)
            except Exception:
                pass

    # Get AI response, passing the generated timetable summary so it is fully context-aware!
    ai_reply = get_ai_response(user_msg, chat_history, tt_summary)

    # Sanitize AI reply: avoid leaking system prompt or empty outputs
    if timetable and (not ai_reply or "You are StudyForge AI" in ai_reply or len(ai_reply.split()) < 3):
        if tt_summary:
            ai_reply = tt_summary
        else:
            ai_reply = "I've generated your timetable — check the left panel."

    return jsonify({"reply": ai_reply, "timetable": timetable, "params": params})

@app.route("/generate-timetable", methods=["POST"])
def manual_timetable():
    params = request.json
    timetable = generate_timetable(params)
    return jsonify({"timetable": timetable, "params": params})

if __name__ == "__main__":
    app.run(debug=True, port=5002)
