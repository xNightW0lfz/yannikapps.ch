class Starfield {
    constructor() {
        this.container = null;
        this.stars = [];
        this.starCount = 80; // Reduzierte Anzahl der Sterne
        this.init();
    }

    init() {
        // Container für Sterne erstellen
        this.container = document.createElement('div');
        this.container.id = 'starfield';
        this.container.style.position = 'fixed';
        this.container.style.top = '0';
        this.container.style.left = '0';
        this.container.style.width = '100%';
        this.container.style.height = '50%'; // Oberer Bildschirmhälfte
        this.container.style.pointerEvents = 'none';
        this.container.style.zIndex = '-1'; // Hinter allem anderen
        this.container.style.overflow = 'hidden';
        document.body.appendChild(this.container);

        // Sterne erstellen
        this.createStars();
        
        // Animation starten
        this.animate();
    }

    createStars() {
        // Bestehende Sterne entfernen
        while (this.container.firstChild) {
            this.container.removeChild(this.container.firstChild);
        }
        this.stars = [];

        // Neue Sterne erstellen
        for (let i = 0; i < this.starCount; i++) {
            this.createStar();
        }
    }

    createStar() {
        const star = document.createElement('div');
        
        // Zufällige Position (erweiterter vertikaler Bereich)
        const x = Math.random() * 100;
        const y = Math.random() * 50; // Obere 50% des Bildschirms
        
        // Zufällige Größe (0.5px - 2px)
        const size = 0.5 + Math.random() * 1.5;
        
        // Zufällige Helligkeit
        const opacity = 0.1 + Math.random() * 0.9;
        
        // Zufällige Animationsdauer (3-8 Sekunden)
        const duration = 3 + Math.random() * 5;
        
        // Zufällige Verzögerung der Animation
        const delay = Math.random() * 5;
        
        star.style.position = 'absolute';
        star.style.left = `${x}%`;
        star.style.top = `${y}%`;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        star.style.borderRadius = '50%';
        star.style.background = 'white';
        star.style.boxShadow = `0 0 ${size * 3}px ${size / 2}px rgba(255, 255, 255, ${opacity * 0.5})`;
        star.style.opacity = opacity;
        star.style.transform = 'translate(-50%, -50%)';
        star.style.willChange = 'opacity, box-shadow';
        
        // Animationseigenschaften
        star.style.animation = `twinkle ${duration}s ease-in-out ${delay}s infinite`;
        
        this.container.appendChild(star);
        this.stars.push(star);
    }

    handleResize() {
        // Container-Höhe anpassen
        this.container.style.height = '25%';
        // Sterne neu positionieren
        this.createStars();
    }

    animate() {
        // Sterne funkeln lassen
        this.stars.forEach(star => {
            // Zufällige Helligkeitsänderung
            if (Math.random() > 0.95) {
                const newOpacity = 0.1 + Math.random() * 0.9;
                star.style.opacity = newOpacity;
                star.style.boxShadow = `0 0 ${parseFloat(star.style.width) * 3}px ${parseFloat(star.style.width) / 2}px rgba(255, 255, 255, ${newOpacity * 0.5})`;
            }
        });
        
        requestAnimationFrame(() => this.animate());
    }

    destroy() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}

// Globale Initialisierung
window.initializeStars = function() {
    if (window.starfield) {
        window.starfield.destroy();
    }
    
    // Nur auf größeren Bildschirmen anzeigen
    if (window.innerWidth >= 769) {
        window.starfield = new Starfield();
        
        // Event-Listener für Fenstergrößenänderung
        window.addEventListener('resize', () => window.starfield.handleResize());
    }
};

// Initialisierung beim Laden der Seite
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.initializeStars);
} else {
    window.initializeStars();
}

// Initialisierung beim Zurücknavigieren
window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        setTimeout(() => {
            window.initializeStars();
        }, 10);
    }
});

// Event-Listener für Fenstergrößenänderung
window.addEventListener('resize', () => {
    if (window.innerWidth >= 769) {
        if (!window.starfield) {
            window.initializeStars();
        }
    } else if (window.starfield) {
        window.starfield.destroy();
        window.starfield = null;
    }
});

// CSS für die Animation
const style = document.createElement('style');
style.textContent = `
    @keyframes twinkle {
        0%, 100% { opacity: 0.2; }
        50% { opacity: 1; }
    }
`;
document.head.appendChild(style);
