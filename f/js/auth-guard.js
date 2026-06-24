/**
 * auth-guard.js — Synapse Auth Guard
 * Include this script on every page that requires login.
 * It immediately checks localStorage for a valid token,
 * and redirects to auth.html if not found.
 * It also automatically updates the navbar on DOMContentLoaded.
 */
(function () {
    const token = localStorage.getItem('synapse_token');
    const userRaw = localStorage.getItem('synapse_user');

    if (!token || !userRaw) {
        // Store the intended destination so we can redirect back after login
        sessionStorage.setItem('synapse_redirect_after_login', window.location.pathname + window.location.search);
        window.location.replace('auth.html');
        // Stop any further page scripts from running
        throw new Error('Auth guard: not authenticated, redirecting to login.');
    }

    // ── Expose helpers globally ──────────────────────────────────────────────

    window.synapseAuth = {
        getToken: () => localStorage.getItem('synapse_token'),
        getUser: () => {
            try { return JSON.parse(localStorage.getItem('synapse_user')); } catch { return null; }
        },
        logout: () => {
            localStorage.removeItem('synapse_token');
            localStorage.removeItem('synapse_user');
            window.location.href = 'auth.html';
        },

        /**
         * Render the authenticated navbar section.
         * @param {string} containerId  - id of the nav auth container element
         */
        renderNav: function (containerId) {
            const container = document.getElementById(containerId || 'nav-auth-container');
            if (!container) return;
            const user = this.getUser();
            if (!user) return;
            const initials = user.name
                ? user.name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2)
                : 'U';
            container.innerHTML = `
                <div class="flex items-center gap-3">
                    <div onclick="window.location.href='analytics.html'"
                        class="w-8 h-8 rounded-full bg-brand-orange/20 border border-brand-orange/40 hover:border-brand-orange
                               hover:bg-brand-orange/35 flex items-center justify-center text-brand-orange text-xs font-bold
                               font-mono cursor-pointer transition-all" title="View Profile">
                        ${initials}
                    </div>
                    <span onclick="window.location.href='analytics.html'"
                        class="text-xs text-neutral-300 hover:text-white font-semibold hidden sm:inline cursor-pointer transition-all"
                        title="View Profile">${user.name || 'User'}</span>
                    <button onclick="synapseAuth.logout()"
                        class="text-xs font-semibold px-3 py-1.5 border border-brand-border rounded-lg text-neutral-400
                               hover:text-white hover:border-neutral-500 transition-all cursor-pointer">
                        Log Out
                    </button>
                </div>`;
        }
    };

    // ── Auto-render the navbar as soon as the DOM is ready ───────────────────
    function autoRenderNav() {
        window.synapseAuth.renderNav('nav-auth-container');
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

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', autoRenderNav);
    } else {
        // DOM already ready (script loaded late)
        autoRenderNav();
    }
})();
