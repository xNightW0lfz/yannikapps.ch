class RainEffect {
    constructor() {
        // Nur initialisieren, wenn die Bildschirmbreite ausreicht
        if (window.innerWidth < 769) return;
        
        // Verwende das vordefinierte Canvas-Element
        this.canvas = document.getElementById('rain-effect');
        if (!this.canvas) {
            this.canvas = document.createElement('canvas');
            this.canvas.id = 'rain-effect';
            document.body.appendChild(this.canvas);
        }
        
        this.ctx = this.canvas.getContext('2d');
        this.drops = [];
        this.animationFrame = null;
        this.resize();
        this.setupEventListeners();
        this.animate();
    }

    setupEventListeners() {
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        if (window.innerWidth < 769) {
            if (this.canvas.parentNode) {
                this.canvas.parentNode.removeChild(this.canvas);
            }
            return;
        } else if (!document.body.contains(this.canvas)) {
            document.body.appendChild(this.canvas);
        }
        
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.initDrops();
    }

    initDrops() {
        const dropCount = Math.floor((window.innerWidth * window.innerHeight) / 3000);
        this.drops = [];
        
        for (let i = 0; i < dropCount; i++) {
            this.drops.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * -this.canvas.height,
                length: 10 + Math.random() * 20,
                speed: 2 + Math.random() * 5,
                opacity: 0.1 + Math.random() * 0.3
            });
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.strokeStyle = 'rgba(174, 194, 224, 0.5)';
        this.ctx.lineWidth = 1;
        this.ctx.lineCap = 'round';

        for (let i = 0; i < this.drops.length; i++) {
            const drop = this.drops[i];
            
            this.ctx.beginPath();
            this.ctx.moveTo(drop.x, drop.y);
            this.ctx.lineTo(drop.x, drop.y + drop.length);
            this.ctx.strokeStyle = `rgba(174, 194, 224, ${drop.opacity})`;
            this.ctx.stroke();

            drop.y += drop.speed;

            if (drop.y > this.canvas.height) {
                drop.y = -drop.length;
                drop.x = Math.random() * this.canvas.width;
            }
        }
    }

    animate() {
        this.draw();
        this.animationFrame = requestAnimationFrame(() => this.animate());
    }
    
    destroy() {
        cancelAnimationFrame(this.animationFrame);
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
    }
}

// Globale Initialisierungsfunktion
window.initializeRain = function() {
    // Bestehende Instanz aufräumen, falls vorhanden
    if (window.rainEffect) {
        window.rainEffect.destroy();
        window.rainEffect = null;
    }
    
    // Nur auf großen Bildschirmen initialisieren
    if (window.innerWidth >= 769) {
        window.rainEffect = new RainEffect();
    }
};

// Funktion zum Behandeln von Fenstergrößenänderungen
function handleResize() {
    if (window.innerWidth >= 769) {
        if (!window.rainEffect) {
            window.initializeRain();
        }
    } else if (window.rainEffect) {
        window.rainEffect.destroy();
        window.rainEffect = null;
    }
}

// Initialisierung beim Laden der Seite
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.initializeRain();
        window.addEventListener('resize', handleResize);
    });
} else {
    window.initializeRain();
    window.addEventListener('resize', handleResize);
}

// Initialisierung beim Zurücknavigieren
window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        // Kleine Verzögerung, um sicherzustellen, dass das DOM bereit ist
        setTimeout(() => {
            window.initializeRain();
            // Erneute Initialisierung nach einer weiteren Verzögerung
            setTimeout(window.initializeRain, 100);
        }, 10);
    }
});
