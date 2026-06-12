"""
timetable.py -- Smart multi-scope timetable generator.

Takes study parameters and produces a prioritized schedule.
Harder subjects + closer exams = more time allocated.

Chapter time estimates (realistic):
  - Hard chapter:   8 hours (480 min) -- heavy concepts, lots of problems
  - Medium chapter: 6 hours (360 min) -- standard competitive exam chapter
  - Easy chapter:   4 hours (240 min) -- lighter, familiar topics
"""

from datetime import datetime, timedelta
import re
import math

DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
POMODORO_MINS = 25


def compute_weights(params: dict) -> dict:
    """Assign priority weights to subjects based on difficulty and urgency."""
    weights = {}
    subjects = params.get("subjects", [])
    hard = [s.lower() for s in params.get("hard_subjects", [])]
    exams = params.get("exams", [])
    deadlines = params.get("deadlines", [])
    raw = params.get("raw_text", "").lower()
    chapters = params.get("chapters", {})

    for sub in subjects:
        w = 1.0
        if sub.lower() in hard:
            w += 1.5  # harder subject = more time

        # Closer exam = higher priority
        for exam in exams:
            if exam["subject"].lower() in sub.lower() or sub.lower() in exam["subject"].lower():
                urgency = max(0, (14 - exam["days"]) * 0.2)
                w += urgency

        # Closer deadline = higher priority
        for dl in deadlines:
            if dl["subject"].lower() in sub.lower() or sub.lower() in dl["subject"].lower():
                urgency = max(0, (7 - dl["days"]) * 0.3)
                w += urgency

        # Boost if subject explicitly mentioned as high-weight in user's text
        try:
            if re.search(rf"\b{re.escape(sub.lower())}\b(.{{0,30}})?(high weight|high weightage|high-weightage|high-weight)", raw):
                w += 1.0
        except re.error:
            pass

        # Boost focus for common competitive exam subjects
        if any(k in raw for k in ("mhtcet", "jee", "neet")):
            if sub.lower() in ("physics", "chemistry", "maths", "biology"):
                w += 0.4

        # Adjust weight based on chapter counts if provided
        try:
            chap_count = int(chapters.get(sub, 0))
        except Exception:
            chap_count = 0
        if chap_count:
            avg = max(1, sum(chapters.values()) / len(chapters))
            if chap_count > avg:
                w += 0.5
            if chap_count >= 9:
                w += 0.5

        weights[sub] = round(w, 2)

    return weights


def format_time(hour: float) -> str:
    """Convert hour (e.g. 9.5) to readable time (9:30 AM)."""
    h = int(hour)
    m = int((hour - h) * 60)
    period = "AM" if h < 12 else "PM"
    hr = h if h <= 12 else h - 12
    hr = 12 if hr == 0 else hr
    return f"{hr}:{m:02d} {period}"


def generate_timetable(params: dict) -> list[dict]:
    """Generate a timetable for the requested number of days and scope."""
    subjects = [s.strip() for s in params.get("subjects", []) if s and s.strip()]
    hours_per_day = float(params.get("hours_per_day", 3))
    exams = params.get("exams", [])
    deadlines = params.get("deadlines", [])
    plan_days = int(params.get("plan_days", 7))
    scope = params.get("scope", "weekly")
    chapters = params.get("chapters", {})
    raw = params.get("raw_text", "").lower()

    # Realistic estimation of required hours if chapter counts are provided
    # A chapter in a competitive exam subject typically needs 6-8 hours of study
    if chapters and (not params.get("user_supplied_hours", False)):
        total_minutes_needed = 0
        for s, c in chapters.items():
            subj = s
            try:
                cnum = int(c)
            except Exception:
                cnum = 0
            # REALISTIC chapter time estimates:
            if subj.lower() in [h.lower() for h in params.get("hard_subjects", [])]:
                mins_per_chapter = 480  # 8 hours for hard chapters (e.g. Organic Chemistry, Calculus)
            elif re.search(rf"\b{re.escape(subj.lower())}\b(.{{0,20}})?easy", raw):
                mins_per_chapter = 240  # 4 hours for easy/familiar chapters
            else:
                mins_per_chapter = 360  # 6 hours for standard competitive exam chapters
            total_minutes_needed += cnum * mins_per_chapter

        # Add 30% buffer for revision + practice + mock tests
        total_minutes_needed = int(total_minutes_needed * 1.3) + 600  # 10 hr extra for mocks
        suggested_hours = max(1, -(-total_minutes_needed // (60 * plan_days)))
        if any(k in raw for k in ("mhtcet", "jee", "neet", "competitive", "entrance")):
            suggested_hours = max(suggested_hours, 6)  # Minimum 6hrs/day for competitive exams
        # Cap at 14 hours (physically impossible to study more)
        suggested_hours = min(suggested_hours, 14)
        hours_per_day = max(hours_per_day, suggested_hours)

    if not subjects:
        subjects = [item["subject"] for item in exams + deadlines]

    subjects = [s for s in subjects if s]
    if not subjects:
        return []

    weights = compute_weights(params)
    if not weights:
        return []

    subjects = sorted(subjects, key=lambda s: (-weights.get(s, 1), s))
    total_weight = sum(weights.values())
    start_date = datetime.now().date()
    slots = []

    # ----- MULTI-SCOPE TIMETABLE GENERATION -----

    if scope == "monthly":
        # Group study plan by weeks
        num_weeks = max(1, math.ceil(plan_days / 7))
        for w_idx in range(num_weeks):
            start_w_date = start_date + timedelta(days=w_idx * 7)
            end_w_date = start_w_date + timedelta(days=6)
            date_label = f"{start_w_date.strftime('%b %d')} - {end_w_date.strftime('%b %d')}"
            
            for sub in subjects:
                ratio = weights.get(sub, 1.0) / total_weight
                weekly_mins = ratio * hours_per_day * 7 * 60
                pomodoros = max(1, round(weekly_mins / POMODORO_MINS))
                duration_mins = pomodoros * POMODORO_MINS

                # Distribute chapter counts across weeks
                total_ch = 0
                try:
                    total_ch = int(chapters.get(sub, 0))
                except Exception:
                    pass

                if total_ch > 0:
                    ch_per_week = max(1, math.ceil(total_ch / num_weeks))
                    start_ch = w_idx * ch_per_week + 1
                    end_ch = min((w_idx + 1) * ch_per_week, total_ch)
                    if start_ch <= total_ch:
                        ch_label = f"Chapters {start_ch}-{end_ch}"
                    else:
                        ch_label = "Revision & Practice Questions"
                else:
                    ch_label = "Syllabus Coverage & Problems"

                slots.append({
                    "week_index": w_idx,
                    "week_label": f"Week {w_idx + 1}",
                    "date_range": date_label,
                    "subject": sub,
                    "focus_chapters": ch_label,
                    "duration_mins": duration_mins,
                    "pomodoros": pomodoros,
                    "type": "weekly_focus",
                    "priority": weights.get(sub, 1.0),
                    "scope": "monthly",
                })

            # Check if there are exams or deadlines falling in this week
            for exam in exams:
                exam_week = (exam["days"] - 1) // 7
                if exam_week == w_idx:
                    slots.append({
                        "week_index": w_idx,
                        "week_label": f"Week {w_idx + 1}",
                        "date_range": date_label,
                        "subject": f"{exam['subject']} -- EXAM WEEK",
                        "focus_chapters": "Major Milestone Exam!",
                        "duration_mins": 0,
                        "pomodoros": 0,
                        "type": "exam",
                        "priority": 99,
                        "scope": "monthly",
                    })

            for dl in deadlines:
                dl_week = (dl["days"] - 1) // 7
                if dl_week == w_idx:
                    slots.append({
                        "week_index": w_idx,
                        "week_label": f"Week {w_idx + 1}",
                        "date_range": date_label,
                        "subject": f"{dl['subject']} -- DEADLINE WEEK",
                        "focus_chapters": "Assignment / Project Submission",
                        "duration_mins": 0,
                        "pomodoros": 0,
                        "type": "deadline",
                        "priority": 88,
                        "scope": "monthly",
                    })

        slots.sort(key=lambda x: (x["week_index"], -x["priority"]))
        return slots

    elif scope == "yearly":
        # Group study plan by months
        num_months = max(1, math.ceil(plan_days / 30))
        for m_idx in range(num_months):
            date_label = f"Month {m_idx + 1} (Days {m_idx * 30 + 1}-{min((m_idx + 1) * 30, plan_days)})"
            
            for sub in subjects:
                ratio = weights.get(sub, 1.0) / total_weight
                monthly_mins = ratio * hours_per_day * 30 * 60
                pomodoros = max(1, round(monthly_mins / POMODORO_MINS))
                duration_mins = pomodoros * POMODORO_MINS

                total_ch = 0
                try:
                    total_ch = int(chapters.get(sub, 0))
                except Exception:
                    pass

                if total_ch > 0:
                    ch_per_month = max(1, math.ceil(total_ch / num_months))
                    start_ch = m_idx * ch_per_month + 1
                    end_ch = min((m_idx + 1) * ch_per_month, total_ch)
                    if start_ch <= total_ch:
                        ch_label = f"Chapters {start_ch}-{end_ch}"
                    else:
                        ch_label = "Comprehensive Mock Tests & Final Revision"
                else:
                    ch_label = "Syllabus Breakdown & Milestones"

                slots.append({
                    "month_index": m_idx,
                    "month_label": f"Month {m_idx + 1}",
                    "date_range": date_label,
                    "subject": sub,
                    "focus_chapters": ch_label,
                    "duration_mins": duration_mins,
                    "pomodoros": pomodoros,
                    "type": "monthly_focus",
                    "priority": weights.get(sub, 1.0),
                    "scope": "yearly",
                })

            # Check if there are exams or deadlines falling in this month
            for exam in exams:
                exam_month = (exam["days"] - 1) // 30
                if exam_month == m_idx:
                    slots.append({
                        "month_index": m_idx,
                        "month_label": f"Month {m_idx + 1}",
                        "date_range": date_label,
                        "subject": f"{exam['subject']} -- EXAM MONTH",
                        "focus_chapters": "Crucial Exam Milestone!",
                        "duration_mins": 0,
                        "pomodoros": 0,
                        "type": "exam",
                        "priority": 99,
                        "scope": "yearly",
                    })

            for dl in deadlines:
                dl_month = (dl["days"] - 1) // 30
                if dl_month == m_idx:
                    slots.append({
                        "month_index": m_idx,
                        "month_label": f"Month {m_idx + 1}",
                        "date_range": date_label,
                        "subject": f"{dl['subject']} -- DEADLINE MONTH",
                        "focus_chapters": "Major Project / Assignment Submission",
                        "duration_mins": 0,
                        "pomodoros": 0,
                        "type": "deadline",
                        "priority": 88,
                        "scope": "yearly",
                    })

        slots.sort(key=lambda x: (x["month_index"], -x["priority"]))
        return slots

    else:
        # Standard daily or weekly scope (hour-by-hour slot lists)
        chapter_counters = {}
        chapter_alloc_per_day = {}
        review_counters = {}
        for s, c in chapters.items():
            try:
                total_c = int(c)
            except Exception:
                total_c = 0
            if total_c <= 0:
                chapter_alloc_per_day[s] = 0
            else:
                chapter_alloc_per_day[s] = max(1, math.ceil(total_c / plan_days))
            chapter_counters[s] = 0
            review_counters[s] = 0

        total_minutes = hours_per_day * 60

        for day_idx in range(plan_days):
            current_hour = 9.0
            date = start_date + timedelta(days=day_idx)
            day = date.strftime("%a")
            date_label = date.strftime("%Y-%m-%d")

            for sub in subjects:
                ratio = weights.get(sub, 1.0) / total_weight
                raw_mins = ratio * total_minutes
                pomodoros = max(1, round(raw_mins / POMODORO_MINS))
                duration_mins = pomodoros * POMODORO_MINS

                start = current_hour
                end = current_hour + duration_mins / 60

                subj_label = sub
                if chapters and chapters.get(sub):
                    total_ch = int(chapters.get(sub, 0))
                    alloc = chapter_alloc_per_day.get(sub, 0)
                    if alloc > 0 and chapter_counters.get(sub, 0) < total_ch:
                        start_ch = chapter_counters[sub] + 1
                        end_ch = min(chapter_counters[sub] + alloc, total_ch)
                        subj_label = f"{sub} - Chapters {start_ch}-{end_ch}"
                        chapter_counters[sub] = end_ch
                    elif total_ch > 0:
                        review_counters[sub] += 1
                        review_ch = ((review_counters[sub] - 1) % total_ch) + 1
                        subj_label = f"{sub} - Review Chapter {review_ch}"

                slots.append({
                    "date": date_label,
                    "day": day,
                    "day_index": day_idx,
                    "subject": subj_label,
                    "start_time": format_time(start),
                    "end_time": format_time(end),
                    "pomodoros": pomodoros,
                    "duration_mins": duration_mins,
                    "type": "study",
                    "priority": weights.get(sub, 1.0),
                    "scope": scope,
                })

                current_hour = end + 0.25

            for exam in exams:
                if exam["days"] == day_idx + 1:
                    slots.append({
                        "date": date_label,
                        "day": day,
                        "day_index": day_idx,
                        "subject": f"{exam['subject']} -- EXAM DAY",
                        "start_time": "All day",
                        "end_time": "",
                        "pomodoros": 0,
                        "duration_mins": 0,
                        "type": "exam",
                        "priority": 99,
                        "scope": scope,
                    })

            for dl in deadlines:
                if dl["days"] == day_idx + 1:
                    slots.append({
                        "date": date_label,
                        "day": day,
                        "day_index": day_idx,
                        "subject": f"{dl['subject']} -- DEADLINE",
                        "start_time": "11:59 PM",
                        "end_time": "",
                        "pomodoros": 0,
                        "duration_mins": 0,
                        "type": "deadline",
                        "priority": 88,
                        "scope": scope,
                    })

        slots.sort(key=lambda x: (x["day_index"], -x["priority"]))
        return slots


def timetable_summary(slots: list[dict]) -> str:
    """Generate a human-readable summary of the timetable based on its scope."""
    if not slots:
        return "No study plan generated."

    first_slot = slots[0]
    scope = first_slot.get("scope", "weekly")

    if scope == "monthly":
        weeks_count = max(s.get("week_index", 0) for s in slots) + 1
        lines = [f"Your Monthly Study Roadmap ({weeks_count} Weeks):\n"]
        
        # Group by week
        grouped = {}
        for s in slots:
            if s["type"] == "weekly_focus":
                w_lbl = s["week_label"]
                grouped.setdefault(w_lbl, []).append(s)
                
        # Sort weeks numerically
        for w_lbl in sorted(grouped.keys(), key=lambda x: int(x.split()[1])):
            lines.append(f"• {w_lbl}:")
            for item in grouped[w_lbl]:
                hours = round(item["duration_mins"] / 60, 1)
                lines.append(f"  - {item['subject']}: study {item['focus_chapters']} ({hours} hrs)")
            
        # Add exams under specific weeks if any
        exams = [s for s in slots if s["type"] == "exam"]
        if exams:
            lines.append("\nMilestone Exams:")
            for e in exams:
                lines.append(f"- {e['subject']} scheduled in Week {e.get('week_index', 0) + 1}")
                
        return "\n".join(lines)

    elif scope == "yearly":
        months_count = max(s.get("month_index", 0) for s in slots) + 1
        lines = [f"Your Yearly Strategic Roadmap ({months_count} Months):\n"]
        
        # Group by month
        grouped = {}
        for s in slots:
            if s["type"] == "monthly_focus":
                m_lbl = s["month_label"]
                grouped.setdefault(m_lbl, []).append(s)
                
        for m_lbl in sorted(grouped.keys(), key=lambda x: int(x.split()[1])):
            lines.append(f"• {m_lbl}:")
            for item in grouped[m_lbl]:
                hours = round(item["duration_mins"] / 60, 1)
                lines.append(f"  - {item['subject']}: target {item['focus_chapters']} ({hours} hrs)")
                
        exams = [s for s in slots if s["type"] == "exam"]
        if exams:
            lines.append("\nMajor Exams / Milestones:")
            for e in exams:
                lines.append(f"- {e['subject']} scheduled in Month {e.get('month_index', 0) + 1}")
                
        return "\n".join(lines)

    else:
        # Standard daily or weekly plan summary
        study_slots = [s for s in slots if s["type"] == "study"]
        subject_totals = {}
        for s in study_slots:
            subj = s["subject"]
            base = subj.split(" - ")[0].split(" -- ")[0]
            subject_totals[base] = subject_totals.get(base, 0) + s["pomodoros"]
            
        days = len(set(s.get("date") for s in slots)) or 1

        lines = [f"Your Daily/Weekly Study Plan ({days} Days):\n"]
        for sub, total in subject_totals.items():
            avg_per_day = round(total / days, 1)
            hours_total = round(total * 25 / 60, 1)
            lines.append(f"- {sub}: {total} Pomodoros total ({hours_total} hrs), avg {avg_per_day} Pomodoros/day")

        exams = [s for s in slots if s["type"] == "exam"]
        if exams:
            lines.append("\nUpcoming Exams:")
            seen = set()
            for e in exams:
                if e["subject"] not in seen:
                    lines.append(f"- {e['subject']} on Day {e['day_index'] + 1} ({e['date']})")
                    seen.add(e["subject"])

        return "\n".join(lines)
