/**
 * CodePrep DSA Topic Renderer — Full Featured
 * Features: checkbox completion, revision stars, per-question notes,
 * search/filter by difficulty, revision-only tab, random problem, live progress
 * All state is persisted in localStorage per topic.
 */

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const activeTopicId = urlParams.get('id') || 'arrays';
    const topicData = topicsData[activeTopicId];

    if (!topicData) {
        document.querySelector('.q-title').innerText = 'Topic Not Found';
        return;
    }

    // ---- State (persisted to localStorage) ----
    const STORAGE_KEY = `codeprep_${activeTopicId}`;
    let state = loadState();

    function loadState() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
        } catch (e) { return {}; }
    }

    function saveState() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }

    // ---- UI state ----
    let activeTab = 'all';      // 'all' | 'revision'
    let diffFilter = 'all';     // 'all' | 'Easy' | 'Medium' | 'Hard'
    let searchQuery = '';
    let searchVisible = false;

    // ---- Header ----
    document.querySelector('.q-title').innerText = topicData.title;
    document.querySelector('.q-subtitle').innerText = topicData.subtitle;

    // ---- All questions flat (for random / progress) ----
    const allFlatQuestions = [];
    const difficultyKeys = ['Basic', 'Easy', 'Medium', 'Hard', 'Expert'];
    difficultyKeys.forEach(dk => {
        (topicData.difficulties[dk] || []).forEach(q => {
            allFlatQuestions.push({ ...q, _group: dk });
        });
    });

    // ---- Progress calc ----
    function updateProgress() {
        const total = allFlatQuestions.length;
        const done = allFlatQuestions.filter(q => state[q.name]?.done).length;
        const easyTotal = allFlatQuestions.filter(q => q.diff === 'Easy').length;
        const medTotal = allFlatQuestions.filter(q => q.diff === 'Medium').length;
        const hardTotal = allFlatQuestions.filter(q => q.diff === 'Hard').length;
        const easyDone = allFlatQuestions.filter(q => q.diff === 'Easy' && state[q.name]?.done).length;
        const medDone = allFlatQuestions.filter(q => q.diff === 'Medium' && state[q.name]?.done).length;
        const hardDone = allFlatQuestions.filter(q => q.diff === 'Hard' && state[q.name]?.done).length;

        const pct = total > 0 ? Math.round(done / total * 100) : 0;
        const circle = document.querySelector('.q-progress-circle');
        if (circle) {
            circle.textContent = pct + '%';
            circle.style.background = `conic-gradient(#C97B3D ${pct * 3.6}deg, rgba(255,255,255,0.06) ${pct * 3.6}deg)`;
        }
        const sp = document.getElementById('stat-progress');
        const st = document.getElementById('stat-total');
        if (sp) sp.textContent = done;
        if (st) st.textContent = total;
        const se = document.getElementById('stat-easy');
        const sm = document.getElementById('stat-med');
        const sh = document.getElementById('stat-hard');
        if (se) se.textContent = ` ${easyDone} / ${easyTotal}`;
        if (sm) sm.textContent = ` ${medDone} / ${medTotal}`;
        if (sh) sh.textContent = ` ${hardDone} / ${hardTotal}`;
    }

    // ---- Main render ----
    function render() {
        const container = document.querySelector('.q-accordion');
        container.innerHTML = '';

        difficultyKeys.forEach(diffKey => {
            let questionsList = (topicData.difficulties[diffKey] || []);

            // Filter: tab (revision only)
            if (activeTab === 'revision') {
                questionsList = questionsList.filter(q => state[q.name]?.starred);
            }

            // Filter: difficulty selector
            if (diffFilter !== 'all') {
                questionsList = questionsList.filter(q => q.diff === diffFilter);
            }

            // Filter: search
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                questionsList = questionsList.filter(p => p.name.toLowerCase().includes(q));
            }

            if (questionsList.length === 0 && activeTab === 'all' && diffFilter === 'all' && !searchQuery) return;

            const groupTotal = topicData.difficulties[diffKey]?.length || 0;
            const groupDone = (topicData.difficulties[diffKey] || []).filter(q => state[q.name]?.done).length;
            const groupPct = groupTotal > 0 ? Math.round(groupDone / groupTotal * 100) : 0;
            const isExpanded = diffKey === 'Basic' || questionsList.length > 0;

            let rowsHtml = '';
            if (questionsList.length === 0) {
                rowsHtml = `<tr><td colspan="9" style="text-align:center;padding:20px;color:#64748b;">No problems match current filters.</td></tr>`;
            } else {
                questionsList.forEach(q => {
                    const qs = state[q.name] || {};
                    const isDone = !!qs.done;
                    const isStarred = !!qs.starred;
                    const note = qs.note || '';
                    const diffLower = q.diff.toLowerCase();
                    const qKey = encodeURIComponent(q.name);

                    const vidHtml = q.vid
                        ? `<button class="vid-sol-btn" onclick="openVideoSolution('${q.name.replace(/'/g, "\\'")}', event)" title="Watch Video Solution"><i class="fa-brands fa-youtube" style="color:#C97B3D;font-size:1.1rem;"></i></button>`
                        : `<span style="color:#64748b;">—</span>`;

                    const docHtml = q.doc
                        ? `<a href="https://leetcode.com/problems/${q.name.toLowerCase().replace(/\s+/g, '-')}/" target="_blank"><i class="fa-regular fa-file-lines" style="color:#60a5fa;font-size:1.05rem;"></i></a>`
                        : '';

                    const docVidHtml = `${docHtml} ${vidHtml}`;

                    const pracHtml = q.prac
                        ? `<a href="solve.html?q=${qKey}" title="Open in editor"><i class="fa-solid fa-code" style="color:#a78bfa;font-size:1.1rem;"></i></a>`
                        : `<span style="color:#64748b;">—</span>`;

                    rowsHtml += `
                        <tr class="q-row${isDone ? ' row-done' : ''}" data-name="${q.name}" data-diff="${q.diff}">
                            <td>
                                <span class="checkbox${isDone ? ' checked' : ''}" 
                                    data-q="${q.name}" 
                                    title="${isDone ? 'Mark incomplete' : 'Mark complete'}"
                                    onclick="toggleDone('${q.name}')">
                                    ${isDone ? '<i class="fa-solid fa-check" style="font-size:0.75rem;"></i>' : ''}
                                </span>
                            </td>
                            <td style="font-weight:${isDone ? '400' : '500'};color:${isDone ? '#64748b' : '#fff'};text-decoration:${isDone ? 'line-through' : 'none'};">${q.name}</td>
                            <td><a href="solve.html?q=${qKey}" class="link-solve">Solve</a></td>
                            <td>${vidHtml}</td>
                            <td>${docVidHtml}</td>
                            <td>${pracHtml}</td>
                            <td>
                                <button class="note-btn${note ? ' has-note' : ''}" 
                                    onclick="openNote('${q.name}')" 
                                    title="${note ? 'View/Edit Note' : 'Add Note'}">
                                    <i class="fa-${note ? 'solid' : 'regular'} fa-note-sticky" style="color:${note ? '#fbbf24' : '#64748b'};"></i>
                                </button>
                            </td>
                            <td>
                                <i class="fa-${isStarred ? 'solid' : 'regular'} fa-star star-btn${isStarred ? ' starred' : ''}" 
                                    style="color:${isStarred ? '#fbbf24' : '#64748b'};cursor:pointer;font-size:1rem;"
                                    onclick="toggleStar('${q.name}')"
                                    title="${isStarred ? 'Remove from Revision' : 'Add to Revision'}"></i>
                            </td>
                            <td><span class="badge ${diffLower === 'medium' ? 'med' : diffLower}">${q.diff}</span></td>
                        </tr>
                    `;
                });
            }

            const accHtml = `
                <div class="q-acc-item ${isExpanded ? 'expanded' : ''}">
                    <div class="q-acc-header">
                        <div class="q-acc-title">
                            <i class="fa-solid fa-chevron-right"></i> ${diffKey}
                        </div>
                        <div class="q-acc-progress">
                            <div class="q-acc-bar" style="position:relative;width:120px;height:4px;background:rgba(255,255,255,0.06);border-radius:4px;overflow:hidden;display:inline-block;vertical-align:middle;margin-right:8px;">
                                <div style="position:absolute;left:0;top:0;height:100%;width:${groupPct}%;background:linear-gradient(90deg,#C97B3D,#fbbf24);border-radius:4px;transition:width 0.4s;"></div>
                            </div>
                            ${groupDone} / ${groupTotal}
                        </div>
                    </div>
                    <div class="q-acc-body">
                        <div class="q-table-wrap">
                            <table class="q-table">
                                <thead>
                                    <tr>
                                        <th>Status</th>
                                        <th>Problem</th>
                                        <th style="min-width:60px;"></th>
                                        <th>Resource<br><span class="plus-tag" style="margin-left:0;">Plus</span></th>
                                        <th>Resource</th>
                                        <th>Practice</th>
                                        <th>Note</th>
                                        <th>Revision</th>
                                        <th>Difficulty</th>
                                    </tr>
                                </thead>
                                <tbody>${rowsHtml}</tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;
            container.innerHTML += accHtml;
        });

        // Rebind accordion
        document.querySelectorAll('.q-acc-header').forEach(header => {
            header.addEventListener('click', () => {
                header.parentElement.classList.toggle('expanded');
            });
        });

        updateProgress();
    }

    // ---- Global action handlers (on window so inline onclick can reach them) ----
    window.toggleDone = function (name) {
        if (!state[name]) state[name] = {};
        state[name].done = !state[name].done;
        if (state[name].done) {
            state[name].date = new Date().toISOString().split('T')[0];
        } else {
            delete state[name].date;
        }
        saveState();
        render();
    };

    window.toggleStar = function (name) {
        if (!state[name]) state[name] = {};
        state[name].starred = !state[name].starred;
        saveState();
        render();
    };

    window.openNote = function (name) {
        if (!state[name]) state[name] = {};
        const existing = state[name].note || '';

        // Build modal
        let modal = document.getElementById('note-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'note-modal';
            modal.style.cssText = `
                position:fixed;inset:0;background:rgba(0,0,0,0.75);backdrop-filter:blur(10px);
                z-index:1000;display:flex;align-items:center;justify-content:center;
            `;
            document.body.appendChild(modal);
        }

        modal.innerHTML = `
            <div style="background:#111111;border:1px solid rgba(255,255,255,0.08);border-radius:18px;padding:32px;width:90%;max-width:520px;box-shadow:0 20px 60px rgba(0,0,0,0.6);">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
                    <h3 style="margin:0;font-size:1.1rem;color:#fff;"><i class="fa-solid fa-note-sticky" style="color:#C97B3D;"></i> Note: ${name}</h3>
                    <button onclick="document.getElementById('note-modal').remove()" style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:#fff;width:32px;height:32px;border-radius:8px;cursor:pointer;font-size:1rem;">✕</button>
                </div>
                <textarea id="note-textarea" style="width:100%;height:160px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:14px;color:#fff;font-family:'Inter',sans-serif;font-size:0.95rem;resize:vertical;box-sizing:border-box;" placeholder="Write your approach, key insight, edge cases...">${existing}</textarea>
                <div style="display:flex;gap:12px;margin-top:16px;justify-content:flex-end;">
                    <button onclick="document.getElementById('note-modal').remove()" style="padding:10px 18px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:#fff;border-radius:8px;cursor:pointer;font-weight:600;">Cancel</button>
                    <button onclick="saveNote('${name}')" style="padding:10px 22px;background:linear-gradient(135deg,#C97B3D,#fbbf24);border:none;color:#000;border-radius:8px;cursor:pointer;font-weight:700;"><i class='fa-solid fa-floppy-disk'></i> Save Note</button>
                </div>
            </div>
        `;
        modal.style.display = 'flex';
    };

    window.saveNote = function (name) {
        if (!state[name]) state[name] = {};
        state[name].note = document.getElementById('note-textarea').value;
        saveState();
        document.getElementById('note-modal')?.remove();
        render();
    };

    // ---- Tab buttons (All Problems / Revision) ----
    document.querySelector('.questions-container').addEventListener('click', (e) => {
        const btn = e.target.closest('[data-tab]');
        if (btn) {
            activeTab = btn.dataset.tab;
            document.querySelectorAll('[data-tab]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            render();
        }
    });

    // Fix the tab buttons to have data-tab attributes after DOM ready
    const filterBar = document.querySelector('.questions-container > div:nth-child(2) > div:first-child');
    if (filterBar) {
        filterBar.querySelectorAll('.q-btn').forEach((btn, i) => {
            btn.setAttribute('data-tab', i === 0 ? 'all' : 'revision');
            if (i === 0) btn.classList.add('active');
        });
    }

    // ---- Difficulty Filter Select ----
    const diffSelect = document.querySelectorAll('.q-select')[1];
    if (diffSelect) {
        diffSelect.innerHTML = `
            <option value="all">Difficulty</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
        `;
        diffSelect.addEventListener('change', (e) => {
            diffFilter = e.target.value;
            render();
        });
    }

    // ---- Status Filter Select ----
    const statusSelect = document.querySelectorAll('.q-select')[0];
    if (statusSelect) {
        statusSelect.innerHTML = `
            <option value="all">All problems</option>
            <option value="done">Completed</option>
            <option value="todo">Not Completed</option>
        `;
        statusSelect.addEventListener('change', (e) => {
            const val = e.target.value;
            // Override render to apply status filter 
            window._statusFilter = val;
            render();
        });
    }

    // ---- Search ----
    const searchBtn = document.querySelector('.q-btn i.fa-magnifying-glass')?.parentElement;
    if (searchBtn) {
        let searchInput = null;
        searchBtn.addEventListener('click', () => {
            if (!searchInput) {
                searchInput = document.createElement('input');
                searchInput.type = 'text';
                searchInput.placeholder = 'Search...';
                searchInput.style.cssText = `
                    background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);
                    border-radius:8px;padding:8px 14px;color:#fff;font-family:'Inter',sans-serif;
                    font-size:0.9rem;width:150px;transition:0.2s;outline:none;
                `;
                searchInput.addEventListener('input', (e) => {
                    searchQuery = e.target.value;
                    render();
                });
                searchBtn.parentElement.insertBefore(searchInput, searchBtn.nextSibling);
            } else {
                searchInput.remove();
                searchInput = null;
                searchQuery = '';
                render();
            }
        });
    }

    // ---- Random Problem ----
    const randomBtn = [...document.querySelectorAll('.q-btn')].find(b => b.textContent.includes('Random'));
    if (randomBtn) {
        randomBtn.addEventListener('click', () => {
            const unsolvedProblems = allFlatQuestions.filter(q => !state[q.name]?.done);
            const pool = unsolvedProblems.length > 0 ? unsolvedProblems : allFlatQuestions;
            if (pool.length === 0) return;
            const pick = pool[Math.floor(Math.random() * pool.length)];

            let overlay = document.getElementById('random-modal');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.id = 'random-modal';
                overlay.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,0.75);backdrop-filter:blur(10px);z-index:1000;display:flex;align-items:center;justify-content:center;`;
                document.body.appendChild(overlay);
            }

            const diffColor = { Easy: '#10b981', Medium: '#fbbf24', Hard: '#ef4444' }[pick.diff] || '#fff';
            overlay.innerHTML = `
                <div style="background:#111111;border:1px solid rgba(255,255,255,0.08);border-radius:18px;padding:36px;width:90%;max-width:480px;text-align:center;">
                    <div style="font-size:2.5rem;margin-bottom:12px;">🎲</div>
                    <p style="color:#94a3b8;margin:0 0 8px;font-size:0.85rem;text-transform:uppercase;font-weight:700;letter-spacing:0.05em;">Random Problem</p>
                    <h2 style="margin:0 0 12px;font-size:1.4rem;color:#fff;">${pick.name}</h2>
                    <span style="background:rgba(16,185,129,0.1);color:${diffColor};border:1px solid ${diffColor}44;padding:4px 14px;border-radius:20px;font-size:0.85rem;font-weight:700;">${pick.diff}</span>
                    <p style="color:#64748b;margin:12px 0 0;font-size:0.85rem;">Group: ${pick._group}</p>
                    <div style="display:flex;gap:12px;margin-top:24px;justify-content:center;">
                        <button onclick="document.getElementById('random-modal').remove()" style="padding:10px 20px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:#fff;border-radius:10px;cursor:pointer;font-weight:600;">Cancel</button>
                        <button onclick="document.getElementById('random-modal').remove()" style="padding:10px 24px;background:linear-gradient(135deg,#C97B3D,#fbbf24);border:none;color:#000;border-radius:10px;cursor:pointer;font-weight:800;">
                            <a href="solve.html?q=${encodeURIComponent(pick.name)}" style="text-decoration:none;color:#000;">Solve Now →</a>
                        </button>
                    </div>
                </div>
            `;
        });
    }

    // ---- Reset Button ----
    const resetBtn = [...document.querySelectorAll('.q-btn')].find(b => b.textContent.trim().includes('Reset'));
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (confirm('Reset all progress for this topic? This cannot be undone.')) {
                state = {};
                saveState();
                render();
            }
        });
    }

    // ---- Initial render ----
    render();
});

// ---- Video Solution Modal (global, outside DOMContentLoaded) ----
window.openVideoSolution = function (problemName, event) {
    if (event) event.stopPropagation();

    let overlay = document.getElementById('video-modal');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'video-modal';
        overlay.style.cssText = [
            'position:fixed', 'inset:0', 'background:rgba(0,0,0,0.88)',
            'backdrop-filter:blur(14px)', 'z-index:2000',
            'display:flex', 'align-items:center', 'justify-content:center',
            'padding:20px'
        ].join(';');
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.remove();
        });
        document.body.appendChild(overlay);
    }

    overlay.innerHTML = `
        <div style="background:#111111;border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:0;width:100%;max-width:720px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.8);">
            <div style="padding:20px 24px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid rgba(255,255,255,0.07);background:rgba(201,123,61,0.06);">
                <div style="display:flex;align-items:center;gap:12px;">
                    <i class="fa-brands fa-youtube" style="color:#C97B3D;font-size:1.5rem;"></i>
                    <div>
                        <h3 style="margin:0;font-size:1rem;font-weight:700;color:#fff;">${problemName}</h3>
                        <p style="margin:0;font-size:0.8rem;color:#94a3b8;">Video Solution</p>
                    </div>
                </div>
                <button onclick="document.getElementById('video-modal').remove()" style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:#fff;width:34px;height:34px;border-radius:8px;cursor:pointer;font-size:1rem;">✕</button>
            </div>
            <div style="padding:28px;text-align:center;">
                <div style="font-size:3rem;margin-bottom:12px;">▶️</div>
                <h3 style="margin:0 0 8px;color:#fff;">${problemName}</h3>
                <p style="color:#94a3b8;margin:0 0 20px;font-size:0.9rem;">Watch curated video explanations and solutions for this problem on YouTube.</p>
                <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
                    <a href="https://www.youtube.com/results?search_query=${encodeURIComponent(problemName + ' solution NeetCode')}" target="_blank" 
                       style="padding:12px 22px;background:rgba(239,68,68,0.12);border:1px solid rgba(239,68,68,0.3);color:#f87171;border-radius:10px;font-weight:700;text-decoration:none;display:flex;align-items:center;gap:8px;">
                        <i class="fa-brands fa-youtube"></i> NeetCode Solution
                    </a>
                    <a href="https://www.youtube.com/results?search_query=${encodeURIComponent(problemName + ' solution explained')}" target="_blank"
                       style="padding:12px 22px;background:rgba(201,123,61,0.1);border:1px solid rgba(201,123,61,0.3);color:#D08B4E;border-radius:10px;font-weight:700;text-decoration:none;display:flex;align-items:center;gap:8px;">
                        <i class="fa-solid fa-magnifying-glass"></i> All Solutions
                    </a>
                    <a href="https://leetcode.com/problems/${encodeURIComponent(problemName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))}/solutions/" target="_blank"
                       style="padding:12px 22px;background:rgba(251,191,36,0.08);border:1px solid rgba(251,191,36,0.25);color:#fbbf24;border-radius:10px;font-weight:700;text-decoration:none;display:flex;align-items:center;gap:8px;">
                        <i class="fa-solid fa-code"></i> LeetCode Discuss
                    </a>
                </div>
            </div>
        </div>
    `;
};

// Inject vid-sol-btn style
(function () {
    const s = document.createElement('style');
    s.textContent = '.vid-sol-btn{background:transparent;border:none;cursor:pointer;padding:4px 6px;border-radius:6px;transition:0.2s;}.vid-sol-btn:hover{background:rgba(201,123,61,0.1);transform:scale(1.2);}';
    document.head.appendChild(s);
})();
