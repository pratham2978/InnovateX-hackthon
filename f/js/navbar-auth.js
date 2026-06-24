// ============================================
// SYNAPSE — Shared Navbar Auth + Mobile Menu + Notifications + Demo Mode
// ============================================

const SYNAPSE_BACKEND = (() => {
    const { protocol, hostname, port, origin } = window.location;
    const isLocal = protocol === 'file:' || hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]' || hostname.startsWith('192.168.') || hostname.startsWith('10.') || hostname.startsWith('172.');
    if (isLocal) return port === '5000' ? origin : `http://${hostname === 'localhost' || hostname === '[::1]' || protocol === 'file:' ? '127.0.0.1' : hostname}:5000`;
    return localStorage.getItem('synapse_backend_url') || 'https://innovatex-hackthon.onrender.com';
})();

// ==========================================
// XP / GAMIFICATION SYSTEM
// ==========================================
const XP_ACTIONS = {
    login: 5,
    resume_analyze: 15,
    dsa_solve: 10,
    mock_interview: 25,
    study_session: 20,
    daily_streak: 5
};

const BADGES = [
    { id: 'first_scan', name: 'First Scan', icon: 'fa-file-circle-check', description: 'Analyzed your first resume', xpRequired: 0, condition: 'resume_count >= 1' },
    { id: 'problem_solver', name: '10 Problems Solved', icon: 'fa-code', description: 'Solved 10 DSA problems', xpRequired: 0, condition: 'dsa_count >= 10' },
    { id: 'interview_ready', name: 'Interview Ready', icon: 'fa-microphone', description: 'Completed 5 mock interviews', xpRequired: 0, condition: 'interview_count >= 5' },
    { id: 'xp_100', name: 'Rising Star', icon: 'fa-star', description: 'Earned 100 XP', xpRequired: 100 },
    { id: 'xp_500', name: 'Elite Student', icon: 'fa-trophy', description: 'Earned 500 XP', xpRequired: 500 },
    { id: 'xp_1000', name: 'Synapse Master', icon: 'fa-crown', description: 'Earned 1000 XP', xpRequired: 1000 },
    { id: 'streak_7', name: 'Week Warrior', icon: 'fa-fire', description: '7-day login streak', xpRequired: 0, condition: 'streak >= 7' },
];

function getSynapseStats() {
    const stats = JSON.parse(localStorage.getItem('synapse_stats') || '{}');
    return {
        xp: stats.xp || 0,
        level: Math.floor((stats.xp || 0) / 100) + 1,
        resume_count: stats.resume_count || 0,
        dsa_count: stats.dsa_count || 0,
        interview_count: stats.interview_count || 0,
        study_minutes: stats.study_minutes || 0,
        streak: stats.streak || 0,
        last_login: stats.last_login || null,
        badges: stats.badges || [],
        notifications: stats.notifications || []
    };
}

function saveSynapseStats(stats) {
    localStorage.setItem('synapse_stats', JSON.stringify(stats));

    // Sync to backend MongoDB database if logged in
    const token = localStorage.getItem('synapse_token');
    if (token) {
        fetch(`${SYNAPSE_BACKEND}/api/users/sync-stats`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                xp: stats.xp || 0,
                streak: stats.streak || 0
            })
        }).catch(e => console.warn('Failed to sync stats to database:', e.message));
    }
}

function awardXP(action, customAmount) {
    const stats = getSynapseStats();
    const amount = customAmount || XP_ACTIONS[action] || 0;
    stats.xp = (stats.xp || 0) + amount;

    // Track specific counters
    if (action === 'resume_analyze') stats.resume_count = (stats.resume_count || 0) + 1;
    if (action === 'dsa_solve') stats.dsa_count = (stats.dsa_count || 0) + 1;
    if (action === 'mock_interview') stats.interview_count = (stats.interview_count || 0) + 1;

    // Check for new badges
    const newBadges = [];
    BADGES.forEach(badge => {
        if (stats.badges && stats.badges.includes(badge.id)) return;
        let earned = false;
        if (badge.xpRequired > 0 && stats.xp >= badge.xpRequired) earned = true;
        if (badge.condition) {
            try { earned = eval(badge.condition.replace(/(\w+)/g, (m) => stats[m] !== undefined ? stats[m] : `'${m}'`)); } catch (e) { }
        }
        if (earned) {
            if (!stats.badges) stats.badges = [];
            stats.badges.push(badge.id);
            newBadges.push(badge);
        }
    });

    saveSynapseStats(stats);

    // Show XP popup
    showXPPopup(amount, newBadges);
    return stats;
}

function showXPPopup(amount, newBadges = []) {
    // Remove existing popups
    document.querySelectorAll('.xp-float-popup').forEach(el => el.remove());

    const popup = document.createElement('div');
    popup.className = 'xp-float-popup';
    popup.style.cssText = 'position:fixed;top:80px;right:24px;z-index:9999;display:flex;flex-direction:column;gap:8px;';

    // XP notification
    const xpEl = document.createElement('div');
    xpEl.style.cssText = 'background:#111;border:1px solid rgba(201,123,61,0.4);color:#C97B3D;padding:12px 20px;border-radius:12px;font-size:14px;font-weight:700;font-family:Inter,sans-serif;box-shadow:0 8px 30px rgba(201,123,61,0.15);display:flex;align-items:center;gap:8px;';
    xpEl.innerHTML = `<i class="fa-solid fa-bolt"></i> +${amount} XP`;
    xpEl.classList.add('xp-popup');
    popup.appendChild(xpEl);

    // Badge notifications
    newBadges.forEach(badge => {
        const badgeEl = document.createElement('div');
        badgeEl.style.cssText = 'background:#111;border:1px solid rgba(16,185,129,0.4);color:#10b981;padding:12px 20px;border-radius:12px;font-size:13px;font-weight:600;font-family:Inter,sans-serif;box-shadow:0 8px 30px rgba(16,185,129,0.15);display:flex;align-items:center;gap:8px;';
        badgeEl.innerHTML = `<i class="fa-solid ${badge.icon}"></i> Badge: ${badge.name}!`;
        badgeEl.classList.add('xp-popup');
        popup.appendChild(badgeEl);
    });

    document.body.appendChild(popup);
    setTimeout(() => { popup.style.opacity = '0'; popup.style.transition = 'opacity 0.5s'; }, 2500);
    setTimeout(() => popup.remove(), 3000);
}

// ==========================================
// NOTIFICATION SYSTEM
// ==========================================
function addNotification(message, type = 'info') {
    const stats = getSynapseStats();
    if (!stats.notifications) stats.notifications = [];
    stats.notifications.unshift({
        id: Date.now(),
        message,
        type,
        time: new Date().toISOString(),
        read: false
    });
    // Keep only last 20 
    stats.notifications = stats.notifications.slice(0, 20);
    saveSynapseStats(stats);
    updateNotificationBadge();
}

function updateNotificationBadge() {
    const stats = getSynapseStats();
    const unread = (stats.notifications || []).filter(n => !n.read).length;
    const badge = document.getElementById('notification-count');
    if (badge) {
        if (unread > 0) {
            badge.textContent = unread > 9 ? '9+' : unread;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }
}

// ==========================================
// DAILY STREAK TRACKER
// ==========================================
function trackDailyLogin() {
    const stats = getSynapseStats();
    const today = new Date().toISOString().split('T')[0];

    if (stats.last_login === today) return; // Already logged in today

    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (stats.last_login === yesterday) {
        stats.streak = (stats.streak || 0) + 1;
        if (stats.streak % 7 === 0) {
            addNotification(`🔥 ${stats.streak}-day login streak! Keep it up!`, 'achievement');
        }
    } else {
        stats.streak = 1;
    }
    stats.last_login = today;
    saveSynapseStats(stats);
    awardXP('daily_streak');
}

// ==========================================
// DEMO MODE
// ==========================================
function activateDemoMode() {
    // Set demo user data
    const demoUser = {
        id: 'demo_user_001',
        name: 'Demo Student',
        email: 'demo@synapse.ai'
    };
    localStorage.setItem('synapse_token', 'demo_token_' + Date.now());
    localStorage.setItem('synapse_user', JSON.stringify(demoUser));

    // Set demo stats
    const demoStats = {
        xp: 275,
        resume_count: 3,
        dsa_count: 15,
        interview_count: 4,
        study_minutes: 180,
        streak: 5,
        last_login: new Date().toISOString().split('T')[0],
        badges: ['first_scan', 'xp_100'],
        notifications: [
            { id: 1, message: '🎯 Welcome to Synapse Demo Mode!', type: 'info', time: new Date().toISOString(), read: false },
            { id: 2, message: '📊 Your resume score improved by 12 points!', type: 'achievement', time: new Date(Date.now() - 3600000).toISOString(), read: false },
            { id: 3, message: '🔥 5-day login streak! Keep going!', type: 'achievement', time: new Date(Date.now() - 86400000).toISOString(), read: true }
        ]
    };
    saveSynapseStats(demoStats);

    window.location.href = 'features.html';
}

// ==========================================
// MOBILE MENU
// ==========================================
function injectMobileMenu() {
    const path = window.location.pathname.toLowerCase();
    if (path.endsWith('/admin') || path.endsWith('/admin.html') || path.includes('/admin.html')) return;

    // Create hamburger button
    const nav = document.querySelector('nav .max-w-7xl');
    if (!nav) return;

    // Find the hidden md:flex links div
    const desktopLinks = nav.querySelector('.hidden.md\\:flex');
    if (!desktopLinks) return;

    // Add hamburger button before auth container
    const authContainer = document.getElementById('nav-auth-container') || nav.querySelector('.flex.items-center.gap-4:last-child');

    const hamburger = document.createElement('button');
    hamburger.id = 'mobile-menu-btn';
    hamburger.className = 'md:hidden p-2 text-neutral-400 hover:text-white transition-colors cursor-pointer';
    hamburger.innerHTML = '<i class="fa-solid fa-bars text-lg"></i>';
    hamburger.onclick = () => toggleMobileMenu();

    if (authContainer) {
        authContainer.insertBefore(hamburger, authContainer.firstChild);
    }

    // Create mobile menu overlay
    const overlay = document.createElement('div');
    overlay.id = 'mobile-menu-overlay';
    overlay.className = 'mobile-menu-overlay';
    overlay.onclick = (e) => { if (e.target === overlay) toggleMobileMenu(); };

    const panel = document.createElement('div');
    panel.className = 'mobile-menu-panel';

    // Clone nav links for mobile
    const links = desktopLinks.querySelectorAll('a');
    let linksHtml = '';
    links.forEach(link => {
        linksHtml += `<a href="${link.getAttribute('href')}" class="block py-3 px-4 text-sm font-medium text-neutral-300 hover:text-white hover:bg-white/5 rounded-lg transition-all">${link.textContent.trim()}</a>`;
    });

    panel.innerHTML = `
        <div class="flex items-center justify-between mb-8">
            <span class="text-lg font-bold tracking-wider text-white" style="font-family:'Plus Jakarta Sans',sans-serif;">SYNAPSE</span>
            <button onclick="toggleMobileMenu()" class="p-2 text-neutral-400 hover:text-white cursor-pointer"><i class="fa-solid fa-xmark text-lg"></i></button>
        </div>
        <div class="flex flex-col gap-1">
            ${linksHtml}
            <a href="analytics.html" class="block py-3 px-4 text-sm font-medium text-neutral-300 hover:text-white hover:bg-white/5 rounded-lg transition-all">📊 Analytics</a>
            <a href="study-plan.html" class="block py-3 px-4 text-sm font-medium text-neutral-300 hover:text-white hover:bg-white/5 rounded-lg transition-all">📋 AI Study Plan</a>
        </div>
        <div class="mt-8 pt-6 border-t border-neutral-800" id="mobile-auth-area"></div>
    `;

    overlay.appendChild(panel);
    document.body.appendChild(overlay);
}

function toggleMobileMenu() {
    const overlay = document.getElementById('mobile-menu-overlay');
    if (overlay) {
        overlay.classList.toggle('active');
        document.body.style.overflow = overlay.classList.contains('active') ? 'hidden' : '';
    }
}

// ==========================================
// SYNC NAVBAR AUTH STATE
// ==========================================
function syncNavbarAuth() {
    const token = localStorage.getItem("synapse_token");
    const userStr = localStorage.getItem("synapse_user");
    const container = document.getElementById("nav-auth-container");

    if (token && userStr && container) {
        try {
            const user = JSON.parse(userStr);
            const initials = user.name ? user.name.split(" ").map(n => n.charAt(0)).join("").toUpperCase().slice(0, 2) : "U";
            const stats = getSynapseStats();
            const unreadCount = (stats.notifications || []).filter(n => !n.read).length;

            const path = window.location.pathname.toLowerCase();
            const isadminPage = path.endsWith('/admin') || path.endsWith('/admin.html') || path.includes('/admin.html');

            // Determine if we have a hamburger already inserted
            const hamburger = document.getElementById('mobile-menu-btn');
            const hamburgerHtml = hamburger ? hamburger.outerHTML : '';

            container.innerHTML = `
                ${hamburgerHtml}
                <div class="flex items-center gap-3">
                    <!-- Notification Bell -->
                    <div class="relative cursor-pointer" onclick="toggleNotifications()" title="Notifications">
                        <i class="fa-solid fa-bell text-neutral-400 hover:text-white transition-colors"></i>
                        <span id="notification-count" class="notification-badge" style="${unreadCount > 0 ? '' : 'display:none'}">${unreadCount}</span>
                    </div>
                    <!-- XP Badge -->
                    <span class="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-bold" title="Experience Points">
                        <i class="fa-solid fa-bolt text-[8px]"></i> ${stats.xp || 0} XP
                    </span>
                    <div onclick="window.location.href='analytics.html'" class="w-8 h-8 rounded-full bg-amber-600/20 border border-amber-500/40 hover:border-amber-400 hover:bg-amber-500/35 flex items-center justify-center text-amber-400 text-xs font-bold font-mono cursor-pointer transition-all" title="View Profile">
                        ${initials}
                    </div>
                    ${!isadminPage ? `<span onclick="window.location.href='analytics.html'" class="text-xs text-neutral-300 hover:text-white font-semibold hidden sm:inline cursor-pointer transition-all" title="View Profile">${user.name || 'User'}</span>` : ''}
                    
                    ${(user.role === 'admin' && !isadminPage) ? `
                    <button onclick="window.location.href='admin.html'" class="text-[10px] font-bold px-3 py-1.5 border border-brand-orange/40 bg-brand-orange/10 rounded-lg text-brand-orange hover:bg-brand-orange/20 hover:text-white hover:border-brand-orange transition-all cursor-pointer">
                        Admin Panel
                    </button>
                    ` : ''}

                    <button onclick="handleLogout()" class="text-xs font-semibold px-3 py-1.5 border border-neutral-800 rounded-lg text-neutral-400 hover:text-white hover:border-neutral-500 transition-all cursor-pointer">
                        Log Out
                    </button>
                </div>
            `;

            // Re-attach hamburger click if it was recreated
            const newHamburger = document.getElementById('mobile-menu-btn');
            if (newHamburger) {
                newHamburger.onclick = () => toggleMobileMenu();
            }

            // Toggle hero buttons based on auth state (if on index page)
            const btnLoginCta = document.getElementById("btn-login-cta");
            const btnExplore = document.getElementById("btn-explore");
            const btnWorkspaceCta = document.getElementById("btn-workspace-cta");
            const btnProfile = document.getElementById("btn-profile");

            if (btnLoginCta && btnExplore && btnWorkspaceCta && btnProfile) {
                btnLoginCta.classList.add("hidden");
                btnExplore.classList.add("hidden");
                btnWorkspaceCta.classList.remove("hidden");
                btnProfile.classList.remove("hidden");
            }

            // Update mobile menu auth area
            const mobileAuth = document.getElementById('mobile-auth-area');
            if (mobileAuth) {
                mobileAuth.innerHTML = `
                    <div class="flex items-center gap-3 mb-4">
                        <div class="w-10 h-10 rounded-full bg-amber-600/20 border border-amber-500/40 flex items-center justify-center text-amber-400 text-sm font-bold">${initials}</div>
                        <div>
                            ${!isadminPage ? `<div class="text-sm text-white font-semibold">${user.name || 'User'}</div>` : ''}
                            <div class="text-[10px] text-amber-400 font-bold"><i class="fa-solid fa-bolt"></i> ${stats.xp || 0} XP · Level ${stats.level || 1}</div>
                        </div>
                    </div>
                    ${(user.role === 'admin' && !isadminPage) ? `<a href="admin.html" class="block w-full py-2 bg-brand-orange/10 border border-brand-orange/40 text-brand-orange hover:text-white text-center text-xs font-semibold rounded-lg mt-2 transition-all">Admin Panel</a>` : ''}
                    <button onclick="handleLogout()" class="w-full py-2.5 border border-neutral-800 rounded-lg text-sm font-semibold text-neutral-400 hover:text-white hover:border-neutral-600 transition-all cursor-pointer mt-2">Log Out</button>
                `;
            }

            // Track daily login
            trackDailyLogin();
        } catch (e) {
            console.error("Auth sync error:", e);
        }
    } else if (container) {
        // Not logged in — show demo button
        const hamburger = document.getElementById('mobile-menu-btn');
        const hamburgerHtml = hamburger ? hamburger.outerHTML : '';

        // Check if there's already auth buttons, don't overwrite if custom
        if (!container.querySelector('[data-custom-auth]')) {
            const existingHtml = container.innerHTML;
            // Only add demo button if not already present
            if (!existingHtml.includes('Demo Mode')) {
                const demoBtn = document.createElement('button');
                demoBtn.className = 'text-[10px] font-bold px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-all cursor-pointer hidden sm:inline-flex items-center gap-1 mr-2';
                demoBtn.innerHTML = '<i class="fa-solid fa-play text-[8px]"></i> Demo Mode';
                demoBtn.onclick = activateDemoMode;

                container.insertBefore(demoBtn, container.firstChild);
            }
        }

        // Update mobile menu auth area
        const mobileAuth = document.getElementById('mobile-auth-area');
        if (mobileAuth) {
            mobileAuth.innerHTML = `
                <a href="auth.html" class="block w-full py-2.5 bg-gradient-to-r from-amber-600 to-red-600 text-white text-center text-sm font-bold rounded-lg mb-3">Register / Login</a>
                <button onclick="activateDemoMode()" class="w-full py-2.5 border border-emerald-500/30 bg-emerald-500/10 rounded-lg text-sm font-semibold text-emerald-400 cursor-pointer"><i class="fa-solid fa-play mr-1"></i> Try Demo Mode</button>
            `;
        }
    }
    centerNavbarLinks();
}

function centerNavbarLinks() {
    const nav = document.querySelector('nav');
    if (!nav) return;
    const navContainer = nav.querySelector('.max-w-7xl');
    if (!navContainer) return;
    const linksContainer = navContainer.querySelector('.hidden.md\\:flex');
    if (!linksContainer) return;
    
    navContainer.classList.add('relative');
    linksContainer.classList.remove('hidden', 'md:flex');
    linksContainer.classList.add('hidden', 'md:absolute', 'md:left-1/2', 'md:-translate-x-1/2', 'md:flex');
}

// ==========================================
// NOTIFICATION PANEL
// ==========================================
function toggleNotifications() {
    let panel = document.getElementById('notification-panel');
    if (panel) {
        panel.remove();
        return;
    }

    const stats = getSynapseStats();
    const notifications = stats.notifications || [];

    panel = document.createElement('div');
    panel.id = 'notification-panel';
    panel.style.cssText = 'position:fixed;top:64px;right:16px;width:320px;max-height:400px;background:#111;border:1px solid #222;border-radius:16px;z-index:9999;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.5);font-family:Inter,sans-serif;';

    let notifHtml = '';
    if (notifications.length === 0) {
        notifHtml = '<div style="padding:32px;text-align:center;color:#666;font-size:12px;">No notifications yet</div>';
    } else {
        notifications.forEach(n => {
            const timeAgo = getTimeAgo(n.time);
            const bgColor = n.read ? '' : 'background:rgba(201,123,61,0.03);';
            notifHtml += `
                <div style="padding:12px 16px;border-bottom:1px solid #1a1a1a;${bgColor}display:flex;gap:10px;align-items:start;">
                    <div style="flex:1;">
                        <div style="font-size:12px;color:#ccc;line-height:1.5;">${n.message}</div>
                        <div style="font-size:10px;color:#555;margin-top:4px;">${timeAgo}</div>
                    </div>
                    ${!n.read ? '<div style="width:6px;height:6px;border-radius:50%;background:#C97B3D;margin-top:6px;flex-shrink:0;"></div>' : ''}
                </div>
            `;
        });
    }

    panel.innerHTML = `
        <div style="padding:14px 16px;border-bottom:1px solid #222;display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:13px;font-weight:700;color:white;">Notifications</span>
            <button onclick="markAllNotificationsRead()" style="font-size:10px;color:#C97B3D;font-weight:600;cursor:pointer;background:none;border:none;">Mark all read</button>
        </div>
        <div style="max-height:340px;overflow-y:auto;">
            ${notifHtml}
        </div>
    `;

    document.body.appendChild(panel);

    // Close on outside click
    setTimeout(() => {
        document.addEventListener('click', function closePanel(e) {
            if (!panel.contains(e.target) && !e.target.closest('[onclick*="toggleNotifications"]')) {
                panel.remove();
                document.removeEventListener('click', closePanel);
            }
        });
    }, 100);
}

function markAllNotificationsRead() {
    const stats = getSynapseStats();
    (stats.notifications || []).forEach(n => n.read = true);
    saveSynapseStats(stats);
    updateNotificationBadge();
    const panel = document.getElementById('notification-panel');
    if (panel) { panel.remove(); toggleNotifications(); }
}

function getTimeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
}

// ==========================================
// SHARED TOAST
// ==========================================
function showToast(msg, color = '#C97B3D') {
    // Remove existing toasts
    document.querySelectorAll('.synapse-toast').forEach(el => el.remove());

    const toast = document.createElement('div');
    toast.className = 'synapse-toast';
    toast.style.cssText = `position:fixed;bottom:24px;right:24px;background:#111;border:1px solid ${color}44;color:${color};padding:14px 22px;border-radius:14px;font-size:13px;font-weight:600;font-family:Inter,sans-serif;z-index:9999;box-shadow:0 10px 40px rgba(0,0,0,0.3);display:flex;align-items:center;gap:10px;transform:translateY(20px);opacity:0;transition:all 0.3s ease;`;
    toast.innerHTML = `<i class="fa-solid fa-circle-info"></i> ${msg}`;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
        toast.style.transform = 'translateY(0)';
        toast.style.opacity = '1';
    });

    setTimeout(() => {
        toast.style.transform = 'translateY(20px)';
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ==========================================
// LOGOUT
// ==========================================
function handleLogout() {
    localStorage.removeItem("synapse_token");
    localStorage.removeItem("synapse_user");
    window.location.href = 'index.html';
}

// ==========================================
// STUDENT-SIDE FEEDBACK FLOATING WIDGET
// ==========================================
function injectFeedbackWidget() {
    const path = window.location.pathname.toLowerCase();
    const isadminPage = path.endsWith('/admin') || path.endsWith('/admin.html') || path.includes('/admin.html');
    if (isadminPage) return; // Don't show feedback widget to admin inside admin panel

    if (document.getElementById("synapse-feedback-widget")) return;

    // Create widget container
    const widget = document.createElement("div");
    widget.id = "synapse-feedback-widget";
    widget.className = "fixed bottom-6 left-6 z-40";

    // Floating Button styled beautifully
    const btn = document.createElement("button");
    btn.className = "flex items-center gap-2 px-4 py-2.5 bg-[#111] hover:bg-[#1a1a1a] text-neutral-400 hover:text-white border border-[#222] rounded-xl text-xs font-semibold shadow-2xl transition-all hover:scale-105 cursor-pointer";
    btn.innerHTML = `<i class="fa-solid fa-circle-question text-[#C97B3D]"></i> Feedback`;
    btn.onclick = () => openFeedbackModal();
    widget.appendChild(btn);

    // Modal Overlay
    const overlay = document.createElement("div");
    overlay.id = "feedback-modal-overlay";
    overlay.className = "fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center opacity-0 pointer-events-none transition-all duration-300";
    overlay.onclick = (e) => { if (e.target === overlay) closeFeedbackModal(); };

    // Get user details
    const userStr = localStorage.getItem("synapse_user");
    let nameVal = "";
    let emailVal = "";
    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            nameVal = user.name || "";
            emailVal = user.email || "";
        } catch(e) {}
    }

    // Modal Content Card
    const modal = document.createElement("div");
    modal.className = "bg-[#111] border border-[#222] rounded-3xl p-8 w-full max-w-[420px] shadow-2xl relative transform translate-y-8 transition-all duration-300";
    modal.innerHTML = `
        <button onclick="closeFeedbackModal()" class="absolute top-5 right-5 text-neutral-500 hover:text-white transition-colors cursor-pointer text-sm">
            <i class="fa-solid fa-xmark"></i>
        </button>
        <div class="flex items-center gap-2 text-[#C97B3D] mb-3">
            <i class="fa-solid fa-comments text-xl"></i>
            <span class="font-bold text-sm tracking-wider uppercase text-white font-display">Feedback & Bugs</span>
        </div>
        <h3 class="text-lg font-bold text-white mb-1">Help Us Improve</h3>
        <p class="text-neutral-400 text-xs font-light mb-6">Found a bug or have a suggestion? Let us know below!</p>
        
        <form id="feedback-form" class="flex flex-col gap-4">
            <div class="flex flex-col gap-1">
                <label class="text-[10px] uppercase font-bold text-neutral-400 pl-1">Your Name</label>
                <input type="text" id="fb-name" required placeholder="John Doe" value="${nameVal}" 
                    class="bg-[#181818] border border-[#222] focus:border-[#C97B3D]/60 rounded-xl p-3 text-white text-xs outline-none transition-all">
            </div>
            <div class="flex flex-col gap-1">
                <label class="text-[10px] uppercase font-bold text-neutral-400 pl-1">Email Address</label>
                <input type="email" id="fb-email" required placeholder="john@example.com" value="${emailVal}" 
                    class="bg-[#181818] border border-[#222] focus:border-[#C97B3D]/60 rounded-xl p-3 text-white text-xs outline-none transition-all">
            </div>
            <div class="flex flex-col gap-1">
                <label class="text-[10px] uppercase font-bold text-neutral-400 pl-1">Submission Type</label>
                <select id="fb-type" class="bg-[#181818] border border-[#222] focus:border-[#C97B3D]/60 rounded-xl p-3 text-white text-xs outline-none transition-all cursor-pointer">
                    <option value="bug">🐛 Bug Report</option>
                    <option value="feedback" selected>💬 General Feedback</option>
                    <option value="feature">💡 Feature Request</option>
                </select>
            </div>
            <div class="flex flex-col gap-1">
                <label class="text-[10px] uppercase font-bold text-neutral-400 pl-1">Message</label>
                <textarea id="fb-message" required rows="4" placeholder="Describe the bug or share your suggestion here..." 
                    class="bg-[#181818] border border-[#222] focus:border-[#C97B3D]/60 rounded-xl p-3 text-white text-xs outline-none transition-all resize-none"></textarea>
            </div>
            
            <button type="submit" id="fb-submit-btn" 
                class="w-full bg-gradient-to-r from-[#C97B3D] to-[#D90429] hover:brightness-110 text-white font-bold py-3 rounded-xl transition-all shadow-xl cursor-pointer text-xs mt-2 flex items-center justify-center gap-1.5">
                Send Submission
            </button>
        </form>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(widget);
    document.body.appendChild(overlay);

    // Form submit listener
    const form = modal.querySelector("#feedback-form");
    form.onsubmit = async (e) => {
        e.preventDefault();
        const submitBtn = modal.querySelector("#fb-submit-btn");
        const name = modal.querySelector("#fb-name").value.trim();
        const email = modal.querySelector("#fb-email").value.trim();
        const type = modal.querySelector("#fb-type").value;
        const message = modal.querySelector("#fb-message").value.trim();

        submitBtn.disabled = true;
        submitBtn.innerHTML = `<i class="fa-solid fa-spinner animate-spin"></i> Submitting...`;

        try {
            const token = localStorage.getItem("synapse_token");
            const headers = { "Content-Type": "application/json" };
            if (token) {
                headers["Authorization"] = `Bearer ${token}`;
            }

            const res = await fetch(`${SYNAPSE_BACKEND}/api/feedback`, {
                method: "POST",
                headers,
                body: JSON.stringify({ name, email, type, message })
            });
            const data = await res.json();
            if (data.success) {
                showToast("Feedback submitted successfully!", "#10b981");
                closeFeedbackModal();
                form.reset();
                modal.querySelector("#fb-name").value = name;
                modal.querySelector("#fb-email").value = email;
            } else {
                showToast("Failed: " + data.error, "#ef4444");
            }
        } catch (err) {
            console.error("Feedback submit error:", err);
            showToast("Failed to submit. Server unreachable.", "#ef4444");
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `Send Submission`;
        }
    };
}

function openFeedbackModal() {
    const overlay = document.getElementById("feedback-modal-overlay");
    if (overlay) {
        overlay.classList.remove("opacity-0", "pointer-events-none");
        overlay.classList.add("opacity-100");
        const modal = overlay.firstElementChild;
        modal.classList.remove("translate-y-8");
        modal.classList.add("translate-y-0");
    }
}

function closeFeedbackModal() {
    const overlay = document.getElementById("feedback-modal-overlay");
    if (overlay) {
        overlay.classList.remove("opacity-100");
        overlay.classList.add("opacity-0", "pointer-events-none");
        const modal = overlay.firstElementChild;
        modal.classList.remove("translate-y-0");
        modal.classList.add("translate-y-8");
    }
}

// ==========================================
// INIT
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
    injectMobileMenu();
    syncNavbarAuth();
    updateNotificationBadge();
    injectFeedbackWidget();
});
