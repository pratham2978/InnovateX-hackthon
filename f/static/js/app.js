// ── CHAT ──────────────────────────────────────────────────────────
const chatHistory = [];

function escapeHtml(text) {
  return text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function mdToHtml(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/^• (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>)/s, "<ul>$1</ul>")
    .replace(/\n/g, "<br>");
}

function addMessage(role, html) {
  const msgs = document.getElementById("messages");
  const wrap = document.createElement("div");
  wrap.className = `msg ${role}`;

  const av = document.createElement("div");
  av.className = "avatar";
  av.textContent = role === "ai" ? "AI" : "Me";

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.innerHTML = html;

  wrap.appendChild(av);
  wrap.appendChild(bubble);
  msgs.appendChild(wrap);
  msgs.scrollTop = msgs.scrollHeight;
  return bubble;
}

function addTyping() {
  const msgs = document.getElementById("messages");
  const wrap = document.createElement("div");
  wrap.className = "msg ai";
  wrap.id = "typing";

  const av = document.createElement("div");
  av.className = "avatar";
  av.textContent = "AI";

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.innerHTML = '<div class="dots"><span></span><span></span><span></span></div>';

  wrap.appendChild(av);
  wrap.appendChild(bubble);
  msgs.appendChild(wrap);
  msgs.scrollTop = msgs.scrollHeight;
}

function removeTyping() {
  const el = document.getElementById("typing");
  if (el) el.remove();
}

async function sendMessage() {
  const input = document.getElementById("userInput");
  const text = input.value.trim();
  if (!text) return;

  input.value = "";
  input.style.height = "auto";
  addMessage("user", escapeHtml(text));

  chatHistory.push({ role: "user", content: text });

  document.getElementById("sendBtn").disabled = true;
  document.getElementById("statusDot").classList.add("thinking");
  addTyping();

  try {
    const backendUrl = (() => {
      const { protocol, hostname } = window.location;
      const isLocal = protocol === 'file:' || hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
      if (isLocal) return 'http://localhost:5000';
      return localStorage.getItem('synapse_backend_url') || 'https://synapse-ai-hackathon.onrender.com';
    })();
    const res = await fetch(`${backendUrl}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, history: chatHistory }),
    });

    const data = await res.json();
    removeTyping();

    if (data.error) {
      addMessage("ai", `<span style="color:#e24b4a">Error: ${data.error}</span>`);
    } else {
      addMessage("ai", mdToHtml(data.reply));
      chatHistory.push({ role: "assistant", content: data.reply });

      if (data.params) {
        renderProfileHUD(data.params);
      }
      if (data.timetable && data.timetable.length) {
        renderTimetable(data.timetable);
        addMessage("ai", "✅ Your study roadmap has been generated! Check the left panel.");
      }
    }
  } catch (err) {
    removeTyping();
    addMessage("ai", "⚠️ Could not reach the server. Make sure the Node server is running on port 5000 and Flask is running on port 5002.");
  }

  document.getElementById("sendBtn").disabled = false;
  document.getElementById("statusDot").classList.remove("thinking");
}

// ── STUDY PROFILE HUD ─────────────────────────────────────────────
function renderProfileHUD(params) {
  const hud = document.getElementById("profileHud");
  if (!params || !params.subjects || params.subjects.length === 0) {
    hud.innerHTML = '<div class="profile-placeholder">Chat with the AI to build your smart study profile.</div>';
    return;
  }

  const exam = params.target_exam || "General Academics";
  const scope = params.scope || "weekly";
  const days = params.plan_days || 7;
  const hours = params.hours_per_day || 3;
  const subjects = params.subjects || [];
  const hardSubjects = params.hard_subjects || [];

  const subjectsHtml = subjects.map(s => {
    const isHard = hardSubjects.some(hs => hs.toLowerCase() === s.toLowerCase());
    return `<span class="profile-badge-subject ${isHard ? 'hard' : ''}">${s}</span>`;
  }).join("");

  hud.innerHTML = `
    <div class="profile-hud-card">
      <div class="profile-hud-row">
        <span class="profile-hud-label">Exam Focus</span>
        <span class="profile-hud-val highlight">${exam}</span>
      </div>
      <div class="profile-hud-row">
        <span class="profile-hud-label">Horizon</span>
        <span class="profile-hud-val">${days} Days (${scope.toUpperCase()})</span>
      </div>
      <div class="profile-hud-row">
        <span class="profile-hud-label">Study Goal</span>
        <span class="profile-hud-val">${hours} hrs / day</span>
      </div>
      <div class="profile-hud-subjects">
        <div class="profile-hud-sub-title">Subjects Focus</div>
        <div class="profile-badges-container">${subjectsHtml}</div>
      </div>
    </div>
  `;
}

// ── TIMETABLE ─────────────────────────────────────────────────────
function renderTimetable(slots) {
  const container = document.getElementById("ttSlots");
  container.innerHTML = "";

  if (!slots || !slots.length) {
    container.innerHTML = '<p class="empty-msg">No plan data available yet.</p>';
    return;
  }

  const scope = slots[0].scope || "weekly";

  if (scope === "monthly") {
    // 1. MONTHLY VIEW (WEEK-BY-WEEK CARDS WITH PROGRESS CHECKBOXES)
    const grouped = slots.reduce((acc, slot) => {
      const key = slot.week_label;
      acc[key] = acc[key] || { header: key, date_range: slot.date_range, items: [] };
      acc[key].items.push(slot);
      return acc;
    }, {});

    Object.keys(grouped).forEach((key) => {
      const group = grouped[key];
      const card = document.createElement("div");
      card.className = "tt-week-card";
      
      let itemsHtml = "";
      group.items.forEach(slot => {
        if (slot.type === "weekly_focus") {
          const hours = (slot.duration_mins / 60).toFixed(1);
          itemsHtml += `
            <div class="week-sub-row">
              <label class="checkbox-container">
                <input type="checkbox" class="week-checkbox">
                <span class="checkmark"></span>
                <div class="checkbox-text">
                  <span class="week-sub-name">${slot.subject}</span>
                  <span class="week-sub-chapters">${slot.focus_chapters}</span>
                </div>
              </label>
              <span class="week-sub-hours">${hours} hrs (${slot.pomodoros} pomos)</span>
            </div>
          `;
        } else {
          // Exam / Deadline
          itemsHtml += `
            <div class="week-milestone-row ${slot.type}">
              <span class="milestone-badge">${slot.type.toUpperCase()}</span>
              <span class="milestone-title">${slot.subject}</span>
            </div>
          `;
        }
      });

      card.innerHTML = `
        <div class="week-header">
          <span class="week-title">${group.header}</span>
          <span class="week-dates">${group.date_range}</span>
        </div>
        <div class="week-body">
          ${itemsHtml}
        </div>
      `;
      container.appendChild(card);
    });

  } else if (scope === "yearly") {
    // 2. YEARLY VIEW (VERTICAL INTERACTIVE SYLLABUS ROADMAP)
    const timeline = document.createElement("div");
    timeline.className = "tt-timeline-container";

    const grouped = slots.reduce((acc, slot) => {
      const key = slot.month_label;
      acc[key] = acc[key] || { header: key, date_range: slot.date_range, items: [] };
      acc[key].items.push(slot);
      return acc;
    }, {});

    Object.keys(grouped).forEach((key) => {
      const group = grouped[key];
      const node = document.createElement("div");
      node.className = "tt-timeline-node";
      
      let subjectsHtml = "";
      group.items.forEach(slot => {
        if (slot.type === "monthly_focus") {
          const hours = (slot.duration_mins / 60).toFixed(1);
          subjectsHtml += `
            <div class="timeline-subject-item">
              <span class="timeline-sub-dot"></span>
              <div class="timeline-sub-details">
                <div class="timeline-sub-top">
                  <span class="timeline-sub-name">${slot.subject}</span>
                  <span class="timeline-sub-hours">${hours} hrs</span>
                </div>
                <span class="timeline-sub-detail">${slot.focus_chapters}</span>
              </div>
            </div>
          `;
        } else {
          // Milestone Exam / Deadline
          subjectsHtml += `
            <div class="timeline-milestone-item ${slot.type}">
              <span class="timeline-milestone-icon">🏆</span>
              <span class="timeline-milestone-title">${slot.subject}</span>
            </div>
          `;
        }
      });

      node.innerHTML = `
        <div class="timeline-badge">${group.header}</div>
        <div class="timeline-content-card">
          <div class="timeline-date-range">${group.date_range}</div>
          <div class="timeline-subjects-list">${subjectsHtml}</div>
        </div>
      `;
      timeline.appendChild(node);
    });

    container.appendChild(timeline);

  } else {
    // 3. DAILY / WEEKLY VIEW (HORIZONTAL HORIZON DAY TAB SELECTORS)
    const grouped = slots.reduce((acc, slot) => {
      const key = slot.date;
      acc[key] = acc[key] || { date: slot.date, day: slot.day, items: [] };
      acc[key].items.push(slot);
      return acc;
    }, {});

    const dayKeys = Object.keys(grouped);
    if (!dayKeys.length) {
      container.innerHTML = '<p class="empty-msg">No plan data available.</p>';
      return;
    }

    const tabContainer = document.createElement("div");
    tabContainer.className = "tt-tabs-bar";
    
    const contentsContainer = document.createElement("div");
    contentsContainer.className = "tt-tab-contents";

    dayKeys.forEach((key, index) => {
      const group = grouped[key];
      
      // Tab button
      const btn = document.createElement("button");
      btn.className = `tt-tab-btn ${index === 0 ? 'active' : ''}`;
      
      const dateNum = group.date.split("-")[2];
      const monthShort = new Date(group.date).toLocaleString('default', { month: 'short' });
      btn.innerHTML = `
        <span class="tab-day-name">${group.day}</span>
        <span class="tab-date-num">${dateNum} ${monthShort}</span>
      `;
      
      // Tab content pane
      const content = document.createElement("div");
      content.className = `tt-tab-pane ${index === 0 ? 'active' : ''}`;
      content.id = `day-pane-${index}`;

      const list = document.createElement("div");
      list.className = "tt-slot-list";

      group.items.forEach(slot => {
        const item = document.createElement("div");
        item.className = `tt-slot-item ${slot.type}`;
        
        const time = slot.end_time ? `${slot.start_time} – ${slot.end_time}` : slot.start_time;
        const badge = `<span class="badge ${slot.type}">${slot.type}</span>`;
        const pomos = slot.pomodoros ? `<span class="slot-pomos">⏱ ${slot.pomodoros} Pomo</span>` : "";

        item.innerHTML = `
          <div class="slot-left">
            <div class="slot-time">${time}</div>
            <div class="slot-subject">${slot.subject}</div>
          </div>
          <div class="slot-right">
            ${pomos}
            ${badge}
          </div>
        `;
        list.appendChild(item);
      });

      content.appendChild(list);
      contentsContainer.appendChild(content);

      btn.addEventListener("click", () => {
        tabContainer.querySelectorAll(".tt-tab-btn").forEach(b => b.classList.remove("active"));
        contentsContainer.querySelectorAll(".tt-tab-pane").forEach(p => p.classList.remove("active"));
        
        btn.classList.add("active");
        content.classList.add("active");
      });

      tabContainer.appendChild(btn);
    });

    container.appendChild(tabContainer);
    container.appendChild(contentsContainer);
  }
}

// ── POMODORO ──────────────────────────────────────────────────────
let pomoLeft = 25 * 60;
let pomoInterval = null;
let pomoSessions = 0;

function pomoDisplay() {
  const m = Math.floor(pomoLeft / 60);
  const s = pomoLeft % 60;
  document.getElementById("pomoTime").textContent =
    String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
}

function pomoStart() {
  if (pomoInterval) return;
  document.getElementById("pomoRing").classList.add("active");
  pomoInterval = setInterval(() => {
    pomoLeft--;
    pomoDisplay();
    if (pomoLeft <= 0) {
      clearInterval(pomoInterval);
      pomoInterval = null;
      document.getElementById("pomoRing").classList.remove("active");
      pomoSessions++;
      document.getElementById("pomoSessions").textContent = pomoSessions;
      pomoLeft = 25 * 60;
      pomoDisplay();
      addMessage(
        "ai",
        `⏱ Pomodoro complete! Take a 5-min break. <strong>${pomoSessions} session${pomoSessions > 1 ? "s" : ""}</strong> done today!`
      );
    }
  }, 1000);
}

function pomoPause() {
  clearInterval(pomoInterval);
  pomoInterval = null;
  document.getElementById("pomoRing").classList.remove("active");
}

function pomoReset() {
  pomoPause();
  pomoLeft = 25 * 60;
  pomoDisplay();
}

// ── INIT ──────────────────────────────────────────────────────────
document.getElementById("userInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

document.getElementById("userInput").addEventListener("input", function () {
  this.style.height = "auto";
  this.style.height = Math.min(this.scrollHeight, 120) + "px";
});

// Welcome message
window.addEventListener("load", () => {
  addMessage(
    "ai",
    `Hey! I'm <strong>StudyForge AI</strong> 🚀<br><br>
    Let's build your perfect study plan. Tell me:<br><br>
    • Your <strong>subjects</strong> (e.g. Math, Physics, History)<br>
    • Your <strong>exam dates</strong> (e.g. "Math exam in 5 days")<br>
    • Any <strong>assignment deadlines</strong><br>
    • How many <strong>hours/day</strong> you can study<br>
    • Which subjects you find <strong>hardest</strong>`
  );
});

pomoDisplay();
