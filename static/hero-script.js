// ===== PARTICLE SYSTEM =====
class ParticleSystem {
    constructor(container) {
        this.container = container;
        this.particles = [];
        this.init();
    }

    init() {
        for (let i = 0; i < 50; i++) {
            this.createParticle();
        }
    }

    createParticle() {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        const size = Math.random() * 3 + 1;
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        const duration = Math.random() * 10 + 10;
        const delay = Math.random() * 5;
        
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';
        particle.style.left = x + '%';
        particle.style.top = y + '%';
        particle.style.animation = `float ${duration}s ease-in-out infinite`;
        particle.style.animationDelay = delay + 's';
        
        this.container.appendChild(particle);
        this.particles.push(particle);
    }
}

// ===== SCROLL ANIMATIONS =====
class ScrollAnimations {
    constructor() {
        this.observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        this.observer = new IntersectionObserver(
            this.observerCallback.bind(this),
            this.observerOptions
        );
        this.init();
    }

    init() {
        document.querySelectorAll('.feature-card, .step-card, .stat').forEach(element => {
            this.observer.observe(element);
        });
    }

    observerCallback(entries) {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.animation = 'slideInUp 0.6s ease forwards';
                    entry.target.style.opacity = '0';
                    entry.target.animate(
                        [
                            { opacity: 0, transform: 'translateY(30px)' },
                            { opacity: 1, transform: 'translateY(0)' }
                        ],
                        {
                            duration: 600,
                            fill: 'forwards'
                        }
                    );
                }, index * 100);
                this.observer.unobserve(entry.target);
            }
        });
    }
}

// ===== ANIMATED COUNTER =====
class AnimatedCounter {
    constructor(element, target, duration = 2000) {
        this.element = element;
        this.target = target;
        this.duration = duration;
        this.current = 0;
        this.isAnimating = false;
    }

    start() {
        if (this.isAnimating) return;
        
        this.isAnimating = true;
        const increment = this.target / (this.duration / 16);
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / this.duration, 1);
            this.current = Math.floor(this.target * progress);
            this.element.textContent = this.current;

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.element.textContent = this.target;
                this.isAnimating = false;
            }
        };

        requestAnimationFrame(animate);
    }
}

// ===== SMOOTH SCROLL LINKS =====
class SmoothScroll {
    constructor() {
        this.init();
    }

    init() {
        document.querySelectorAll('a[href^="#"]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(link.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });
    }
}

// ===== PARALLAX EFFECT =====
class ParallaxEffect {
    constructor() {
        this.elements = document.querySelectorAll('.hero-title, .hero-subtitle');
        this.init();
    }

    init() {
        window.addEventListener('scroll', () => {
            this.elements.forEach(element => {
                const scrollY = window.scrollY;
                const speed = 0.5;
                element.style.transform = `translateY(${scrollY * speed}px)`;
            });
        });
    }
}

// ===== GRADIENT MOUSE FOLLOW =====
class GradientFollow {
    constructor() {
        this.cards = document.querySelectorAll('.score-card, .feature-card, .step-card');
        this.init();
    }

    init() {
        this.cards.forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                card.style.setProperty('--mouse-x', x + 'px');
                card.style.setProperty('--mouse-y', y + 'px');
            });
        });
    }
}

// ===== SVG GRADIENT ANIMATION =====
function initProgressGradient() {
    const svg = document.querySelector('.circular-progress');
    if (!svg) return;

    // Create gradient dynamically
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    gradient.setAttribute('id', 'progressGradient');
    gradient.setAttribute('x1', '0%');
    gradient.setAttribute('y1', '0%');
    gradient.setAttribute('x2', '100%');
    gradient.setAttribute('y2', '100%');

    const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop1.setAttribute('offset', '0%');
    stop1.setAttribute('stop-color', '#7c3aed');

    const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop2.setAttribute('offset', '100%');
    stop2.setAttribute('stop-color', '#06b6d4');

    gradient.appendChild(stop1);
    gradient.appendChild(stop2);
    defs.appendChild(gradient);
    svg.appendChild(defs);
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    // Initialize particle system
    const particlesContainer = document.getElementById('particlesContainer');
    if (particlesContainer) {
        new ParticleSystem(particlesContainer);
    }

    // Initialize scroll animations
    new ScrollAnimations();

    // Initialize smooth scroll
    new SmoothScroll();

    // Initialize parallax
    new ParallaxEffect();

    // Initialize gradient follow
    new GradientFollow();

    // Initialize SVG gradient
    initProgressGradient();

    // Add entrance animations
    document.body.style.opacity = '0';
    document.body.animate(
        [{ opacity: 0 }, { opacity: 1 }],
        {
            duration: 800,
            fill: 'forwards'
        }
    );

    // Add glow effect on mouse move
    document.addEventListener('mousemove', (e) => {
        const x = e.clientX / window.innerWidth;
        const y = e.clientY / window.innerHeight;
        
        document.documentElement.style.setProperty('--cursor-x', x);
        document.documentElement.style.setProperty('--cursor-y', y);
    });

    // Nav scroll effect
    const navbar = document.querySelector('.navbar');
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.scrollY;

        if (currentScroll > 100) {
            navbar.style.boxShadow = '0 5px 30px rgba(124, 58, 237, 0.2)';
            navbar.style.background = 'rgba(15, 23, 42, 0.95)';
        } else {
            navbar.style.boxShadow = 'none';
            navbar.style.background = 'rgba(15, 23, 42, 0.8)';
        }

        lastScroll = currentScroll;
    });

    // Add active nav link on scroll
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    window.addEventListener('scroll', () => {
        let current = '';

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            if (pageYOffset >= sectionTop - 200) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#' + current) {
                link.classList.add('active');
            }
        });
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'Enter') {
            window.location.href = '/';
        }
    });

    console.log('✅ Hero page initialized successfully!');
});

// ===== GSAP-LIKE ANIMATIONS (Without External Library) =====
class AnimationController {
    static animate(element, properties, duration = 500) {
        const startTime = performance.now();
        const initialValues = {};

        // Get initial values
        Object.keys(properties).forEach(prop => {
            const style = window.getComputedStyle(element);
            initialValues[prop] = this.parseValue(style[prop]);
        });

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            Object.keys(properties).forEach(prop => {
                const start = initialValues[prop];
                const end = properties[prop];
                const current = start + (end - start) * this.easeInOutCubic(progress);
                element.style[prop] = current;
            });

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    static parseValue(value) {
        return parseFloat(value) || 0;
    }

    static easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
}

// Export for use
window.AnimationController = AnimationController;
