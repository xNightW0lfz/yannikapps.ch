/**
 * LOW POLY WIREFRAME THEME (VERTICAL EDITION)
 * Global Class: window.WireframeTheme
 * Vibe: Cyber-Canyon, Steep Slope, Verticality
 */
class WireframeTheme {
    constructor() {
        this.config = {
            colors: {
                background: '#050805',   // Tiefschwarz-Grün
                lines: '#00ff88',        // Neon-Grün
                linesFade: '#00220a'     // Fade-Out Farbe
            },
            grid: {
                cols: 40,                // Breiteres Gitter
                rows: 50,                // Tieferes Gitter (wichtig für die Höhe)
                size: 50,                // Zellgröße
                amplitude: 120,          // Viel höhere Berge (Vertikalität!)
                slope: 12                // Neigung nach oben (Rampen-Effekt)
            },
            speed: 0.15,                 // Etwas schnellerer Flug
            mouseRadius: 350,            // Radius der Interaktion
            mouseForce: 100,             // Stärke der Interaktion
            smoothness: 0.08             // Sehr weiche Bewegung
        };

        this.points = [];
        this.flightOffset = 0;
        this.active = true;
        
        // Maus-Interpolation
        this.mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        this.smoothMouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        
        this.init();
    }

    init() {
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'wireframe-bg';
        Object.assign(this.canvas.style, {
            position: 'fixed', 
            top: '0', 
            left: '0', 
            width: '100%', 
            height: '100%',            // Volle Höhe nutzen
            zIndex: '-5', 
            pointerEvents: 'none', 
            background: this.config.colors.background
        });
        document.body.insertBefore(this.canvas, document.body.firstChild);
        
        this.ctx = this.canvas.getContext('2d', { alpha: false });

        this.mouseHandler = (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        };
        window.addEventListener('mousemove', this.mouseHandler);

        this.resize();
        this.animate();
    }

    resize() {
        this.w = window.innerWidth;
        this.h = window.innerHeight;
        this.canvas.width = this.w;
        this.canvas.height = this.h;
        
        // Gitter-Dimensionen an Screen anpassen
        this.config.grid.cols = Math.ceil(this.w / 30) + 10;
        // Rows fixieren wir hoch genug, damit es oben nicht abreißt
    }

    getNoise(x, z) {
        // Komplexeres Noise für interessantere Berge
        const base = Math.sin(x * 0.1 + z * 0.1) * Math.cos(z * 0.15);
        const detail = Math.sin(x * 0.3 + z * 0.2) * 0.5;
        return (base + detail) * this.config.grid.amplitude;
    }

    animate() {
        if (!this.active) return;

        this.flightOffset -= this.config.speed;

        // Smooth Mouse
        const dx = this.mouse.x - this.smoothMouse.x;
        const dy = this.mouse.y - this.smoothMouse.y;
        this.smoothMouse.x += dx * this.config.smoothness;
        this.smoothMouse.y += dy * this.config.smoothness;

        // Render
        const rw = this.canvas.width;
        const rh = this.canvas.height;

        this.ctx.fillStyle = this.config.colors.background;
        this.ctx.fillRect(0, 0, rw, rh);

        // Kamera & Parallax
        const cx = rw / 2 + (this.smoothMouse.x - rw / 2) * 0.08;
        const cy = rh / 2 + (this.smoothMouse.y - rh / 2) * 0.08;

        const fov = 350;
        const camHeight = 250; // Kamera höher setzen, damit wir "in" das Tal schauen
        const camZ = 50;

        const { cols, rows, size, slope } = this.config.grid;
        const projPoints = [];

        for (let z = 0; z < rows; z++) {
            for (let x = 0; x < cols; x++) {
                const wx = (x - cols / 2) * size;
                
                // Noise wandert
                const noiseY = this.getNoise(x, z + this.flightOffset);
                
                // HIER IST DER TRICK: Slope
                // Wir ziehen z * slope ab. Da Y nach unten positiv ist,
                // bedeutet abziehen -> nach oben wandern.
                // Das Gitter steigt also in der Ferne an wie eine Rampe.
                let wy = noiseY + camHeight - (z * slope);
                
                let wz = z * size + camZ;

                // Projektion
                const scale = fov / (fov + wz);
                const px = wx * scale + cx;
                const py = wy * scale + cy;

                // Maus-Verzerrung (Push-Effekt)
                const mDx = this.smoothMouse.x - px;
                const mDy = this.smoothMouse.y - py;
                const dist = Math.sqrt(mDx*mDx + mDy*mDy);
                
                let renderY = py;
                if (dist < this.config.mouseRadius) {
                    // Welle erzeugen
                    const force = Math.sin((1 - dist / this.config.mouseRadius) * Math.PI) * this.config.mouseForce;
                    renderY += force;
                }

                projPoints.push({ x: px, y: renderY, scale: scale, zIndex: z });
            }
        }

        this.ctx.lineWidth = 1.2;
        
        for (let z = 0; z < rows; z++) {
            for (let x = 0; x < cols; x++) {
                const i = z * cols + x;
                const p = projPoints[i];

                if (p.scale < 0.05) continue; // Zu weit weg

                // Opacity: Vorne unsichtbar (damit es nicht durch die Kamera clippt),
                // Mitte sichtbar, Hinten Fade-Out
                // Wir wollen, dass es "von oben" kommt.
                
                let opacity = 1;
                
                // Fade out in der Distanz
                if (z > rows * 0.7) {
                    opacity = 1 - ((z - rows * 0.7) / (rows * 0.3));
                }
                // Fade in ganz nah an der Kamera (damit keine harten Linien ins Gesicht springen)
                if (z < 5) {
                    opacity = z / 5;
                }

                if (opacity <= 0.01) continue;

                this.ctx.strokeStyle = `rgba(0, 255, 136, ${opacity})`;
                this.ctx.beginPath();

                if (x < cols - 1) {
                    const pRight = projPoints[i + 1];
                    this.ctx.moveTo(p.x, p.y);
                    this.ctx.lineTo(pRight.x, pRight.y);
                }

                if (z < rows - 1) {
                    const pBack = projPoints[i + cols];
                    this.ctx.moveTo(p.x, p.y);
                    this.ctx.lineTo(pBack.x, pBack.y);
                }

                // Diagonal (für den Low-Poly Look)
                if (x < cols - 1 && z < rows - 1) {
                    const pDiag = projPoints[i + cols + 1];
                    this.ctx.moveTo(p.x, p.y);
                    this.ctx.lineTo(pDiag.x, pDiag.y);
                }

                this.ctx.stroke();
            }
        }

        this.frameId = requestAnimationFrame(() => this.animate());
    }

    destroy() {
        this.active = false;
        cancelAnimationFrame(this.frameId);
        window.removeEventListener('mousemove', this.mouseHandler);
        if (this.canvas) this.canvas.remove();
    }
}

// Global Export
window.WireframeTheme = WireframeTheme;