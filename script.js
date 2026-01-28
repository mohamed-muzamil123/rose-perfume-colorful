// Premium Design - Physics & Animation Engine

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. Intersection Observer for Scroll Reveals ---
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const animatedElements = document.querySelectorAll('.product-card, .section-header, .story-content, .story-visual');
    const styleSheet = document.createElement("style");
    styleSheet.innerText = `
        .visible {
            opacity: 1 !important;
            transform: translateY(0) !important;
        }
    `;
    document.head.appendChild(styleSheet);

    animatedElements.forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.8s cubic-bezier(0.25, 1, 0.5, 1), transform 0.8s cubic-bezier(0.25, 1, 0.5, 1)';

        if (el.classList.contains('product-card')) {
            el.style.transitionDelay = `${index * 150}ms`;
        }
        observer.observe(el);
    });


    // --- 2. Custom Physics Engine for Floating Elements ---

    const canvas = document.createElement('canvas');
    const heroVisual = document.querySelector('.hero-visual');
    if (!heroVisual) return; // Exit if not on home page

    // Setup Canvas
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.zIndex = '0';
    canvas.style.pointerEvents = 'none'; // Click through
    heroVisual.insertBefore(canvas, heroVisual.firstChild);

    const ctx = canvas.getContext('2d');
    let width, height;

    // Physics Constants
    const GRAVITY = 0.05; // Ultra-low gravity
    const FRICTION = 0.99; // Air resistance
    const BOUNCE = 0.8; // High restitution (bouncy)

    // Particle Class
    class Particle {
        constructor(x, y, radius, color) {
            this.x = x;
            this.y = y;
            this.radius = radius;
            this.color = color;
            this.vx = (Math.random() - 0.5) * 2; // Random horizontal velocity
            this.vy = (Math.random() - 0.5) * 2; // Random vertical velocity
            this.mass = radius / 20;
        }

        update() {
            // Apply forces
            this.vy += GRAVITY * this.mass;
            this.vx *= FRICTION;
            this.vy *= FRICTION;

            // Move
            this.x += this.vx;
            this.y += this.vy;

            // Wall Collisions
            if (this.x + this.radius > width) {
                this.x = width - this.radius;
                this.vx *= -BOUNCE;
            } else if (this.x - this.radius < 0) {
                this.x = this.radius;
                this.vx *= -BOUNCE;
            }

            if (this.y + this.radius > height) {
                this.y = height - this.radius;
                this.vy *= -BOUNCE;
            } else if (this.y - this.radius < 0) {
                this.y = this.radius;
                this.vy *= -BOUNCE;
            }
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.shadowBlur = 20;
            ctx.shadowColor = this.color;
            ctx.fill();
            ctx.closePath();
        }
    }

    // Initialize Particles
    let particles = [];

    function init() {
        width = canvas.width = heroVisual.offsetWidth;
        height = canvas.height = heroVisual.offsetHeight;

        particles = [];

        // Create the two main blobs matching CSS colors but rendered here for physics
        // Big Blue Blob
        particles.push(new Particle(width * 0.8, 100, 150, 'rgba(19, 105, 175, 0.4)'));

        // Medium Cyan/Accent Blob
        particles.push(new Particle(width * 0.2, height - 100, 100, 'rgba(0, 180, 216, 0.4)'));

        // Add some smaller floating particles for "space dust" effect
        for (let i = 0; i < 5; i++) {
            particles.push(new Particle(
                Math.random() * width,
                Math.random() * height,
                Math.random() * 20 + 5,
                'rgba(255, 255, 255, 0.1)'
            ));
        }
    }

    // Animation Loop
    function animate() {
        ctx.clearRect(0, 0, width, height);

        particles.forEach(p => {
            p.update();
            p.draw();
        });

        requestAnimationFrame(animate);
    }

    // Resize Handler
    window.addEventListener('resize', () => {
        width = canvas.width = heroVisual.offsetWidth;
        height = canvas.height = heroVisual.offsetHeight;
        // Optional: re-init positions or just let them settle
    });

    // Start
    init();
    animate();

    // Interaction Handler
    const handleInteraction = (clientX, clientY) => {
        const rect = heroVisual.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;

        particles.forEach(p => {
            const dx = p.x - x;
            const dy = p.y - y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 200) {
                const force = (200 - dist) / 200;
                const angle = Math.atan2(dy, dx);
                p.vx += Math.cos(angle) * force * 0.8; // Increased force slightly
                p.vy += Math.sin(angle) * force * 0.8;
            }
        });
    };

    // Mouse Event
    heroVisual.addEventListener('mousemove', (e) => {
        handleInteraction(e.clientX, e.clientY);
    });

    // Touch Event (Mobile)
    heroVisual.addEventListener('touchmove', (e) => {
        e.preventDefault(); // Prevent scrolling while interacting with canvas if needed, or remove if scrolling is preferred
        const touch = e.touches[0];
        handleInteraction(touch.clientX, touch.clientY);
    }, { passive: false });

    // Scroll Momentum force
    let lastScrollY = window.scrollY;
    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;
        const scrollDelta = currentScrollY - lastScrollY;
        const scrollForce = scrollDelta * 0.05; // Force multiplier

        // Apply scroll force to particles ("Wind" effect)
        particles.forEach(p => {
            p.vy -= scrollForce * (p.mass * 5); // Heavier particles move less? No, try uniform or mass inverted. 
            // Actually, let's just push them up/down based on scroll direction
        });

        lastScrollY = currentScrollY;
    });

    // Hide original CSS circles since we are rendering them in Canvas
    const cssCircles = document.querySelectorAll('.circle');
    cssCircles.forEach(c => c.style.display = 'none');
});
