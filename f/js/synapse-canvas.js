// ============================================
// SYNAPSE — Neural Network Canvas Background
// ============================================
(function() {
    const canvas = document.getElementById('canvas-synapse');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    const particles = [];
    const particleCount = 65;
    let mouse = { x: null, y: null, active: false };
    let glowX = width / 2;
    let glowY = height / 2;

    // Default color (orange theme)
    let currentRGB = { r: 201, g: 123, b: 61 };
    let targetRGB = { r: 201, g: 123, b: 61 };

    // Allow pages to set custom colors
    window.setSynapseCanvasColor = function(r, g, b) {
        targetRGB = { r, g, b };
    };

    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        mouse.active = true;
    });

    window.addEventListener('mouseleave', () => {
        mouse.active = false;
    });

    window.addEventListener('resize', () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });

    class Particle {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.vx = (Math.random() - 0.5) * 0.55;
            this.vy = (Math.random() - 0.5) * 0.55;
            this.radius = Math.random() * 2.2 + 1;
        }
        update() {
            this.x += this.vx;
            this.y += this.vy;
            if (mouse.active) {
                const dx = mouse.x - this.x;
                const dy = mouse.y - this.y;
                const distance = Math.hypot(dx, dy);
                if (distance < 170) {
                    const force = (170 - distance) / 170;
                    const angle = Math.atan2(dy, dx);
                    this.x -= Math.cos(angle) * force * 2.0;
                    this.y -= Math.sin(angle) * force * 2.0;
                }
            }
            if (this.x < 0 || this.x > width) this.vx = -this.vx;
            if (this.y < 0 || this.y > height) this.vy = -this.vy;
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius * 3.5, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${Math.round(currentRGB.r)}, ${Math.round(currentRGB.g)}, ${Math.round(currentRGB.b)}, 0.28)`;
            ctx.fill();
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = '#FFFFFF';
            ctx.fill();
        }
    }

    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);

        // Smooth color transition
        currentRGB.r += (targetRGB.r - currentRGB.r) * 0.05;
        currentRGB.g += (targetRGB.g - currentRGB.g) * 0.05;
        currentRGB.b += (targetRGB.b - currentRGB.b) * 0.05;

        // Move glow element
        const glow1 = document.getElementById('glow-1');
        if (glow1) {
            let targetX = mouse.active ? mouse.x : width / 2;
            let targetY = mouse.active ? mouse.y : height / 2;
            glowX += (targetX - glowX) * 0.04;
            glowY += (targetY - glowY) * 0.04;
            glow1.style.left = `${glowX - 300}px`;
            glow1.style.top = `${glowY - 300}px`;
        }

        const r = Math.round(currentRGB.r);
        const g = Math.round(currentRGB.g);
        const b = Math.round(currentRGB.b);

        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
            particles[i].draw();

            for (let j = i + 1; j < particles.length; j++) {
                const dist = Math.hypot(particles[i].x - particles[j].x, particles[i].y - particles[j].y);
                if (dist < 125) {
                    const alpha = (1 - dist / 125) * 0.55;
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.35})`;
                    ctx.lineWidth = 3.5;
                    ctx.stroke();

                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
                    ctx.lineWidth = 1.0;
                    ctx.stroke();
                }
            }

            if (mouse.active) {
                const distToMouse = Math.hypot(particles[i].x - mouse.x, particles[i].y - mouse.y);
                if (distToMouse < 170) {
                    const alpha = (1 - distToMouse / 170) * 0.75;
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(mouse.x, mouse.y);
                    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.35})`;
                    ctx.lineWidth = 5.0;
                    ctx.stroke();

                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(mouse.x, mouse.y);
                    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                }
            }
        }
        requestAnimationFrame(animate);
    }
    animate();
})();
