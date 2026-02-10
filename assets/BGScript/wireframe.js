/**
 * WIREFRAME THEME - ULTIMATE & EXTENDED (SLOW VERSION)
 * Features: Infinite Terrain, Elevation Colors, Particles, Horizon Glow, Click Pulse
 * Adjustment: Speed reduced by 60% (running at 40% original speed)
 */
class WireframeTheme {
    constructor() {
        this.config = {
            colors: {
                background: '#020204',   // Tiefschwarz-Grün
                linesLow: '#002244',     // Dunkles Blau für Täler
                linesHigh: '#00ff88',    // Neon Grün für Spitzen
                linesPeak: '#ccffee',    // Fast Weiß für extreme Spitzen
                glow: '#00ff88',         // Horizont Glow Farbe
                particles: '#88ffcc'     // Partikel Farbe
            },
            grid: {
                cols: 30,
                rows: 80,
                size: 50,
                amplitude: 140,
                slope: 10
            },
            // GESCHWINDIGKEITEN ANGEPASST (60% langsamer)
            speed: 0.05,                 // Vorher 0.12 -> Jetzt 0.05
            
            mouse: { radius: 300, force: 80, smooth: 0.08 },
            
            pulse: { 
                speed: 3,                // Vorher 8 -> Jetzt 3 (Welle breitet sich langsamer aus)
                force: 150, 
                decay: 0.97,             // Etwas langsamerer Zerfall, damit die Welle länger sichtbar bleibt
                width: 40 
            }, 
            
            particles: { 
                count: 80, 
                speed: 0.8               // Vorher 2 -> Jetzt 0.8 (Partikel schweben langsamer)
            } 
        };

        this.flightOffset = 0;
        this.active = true;
        
        // State
        this.mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        this.smoothMouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        this.pulses = []; 
        this.particles = []; 
        
        this.init();
    }

    init() {
        // 1. Canvas Setup
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'wireframe-bg';
        Object.assign(this.canvas.style, {
            position: 'fixed', top: '0', left: '0', 
            width: '100%', height: '100%', 
            zIndex: '-5', pointerEvents: 'none', 
            background: this.config.colors.background
        });
        document.body.insertBefore(this.canvas, document.body.firstChild);
        
        this.ctx = this.canvas.getContext('2d', { alpha: false });

        // 2. Event Listeners
        this.mouseHandler = (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        };
        
        this.clickHandler = (e) => {
            this.pulses.push({
                x: e.clientX, y: e.clientY, radius: 0, strength: 1.0
            });
        };

        window.addEventListener('mousemove', this.mouseHandler);
        window.addEventListener('mousedown', this.clickHandler);

        // 3. Init Systems
        this.resize();
        this.initParticles();
        this.animate();
    }

    resize() {
        this.w = window.innerWidth;
        this.h = window.innerHeight;
        this.canvas.width = this.w;
        this.canvas.height = this.h;
        
        this.config.grid.cols = Math.ceil(this.w / 35) + 15;
    }

    initParticles() {
        this.particles = [];
        for(let i=0; i<this.config.particles.count; i++) {
            this.resetParticle({});
        }
    }

    resetParticle(p) {
        p.x = (Math.random() - 0.5) * this.w * 3; 
        p.y = (Math.random() - 0.5) * this.h * 4 - this.h * 0.5; 
        p.z = Math.random() * 3000 + 100; 
        p.size = Math.random() * 2 + 0.5;
        p.opacity = Math.random();
        return p;
    }

    getNoise(x, z) {
        const n1 = Math.sin(x * 0.08 + z * 0.08);
        const n2 = Math.cos(z * 0.2 + x * 0.1) * 0.5;
        const n3 = Math.sin(x * 0.3 + z * 0.3) * 0.2; 
        return (n1 + n2 + n3) * this.config.grid.amplitude;
    }

    lerpColor(color1, color2, factor) {
        factor = Math.max(0, Math.min(1, factor));
        const r1 = parseInt(color1.substring(1,3), 16);
        const g1 = parseInt(color1.substring(3,5), 16);
        const b1 = parseInt(color1.substring(5,7), 16);
        
        const r2 = parseInt(color2.substring(1,3), 16);
        const g2 = parseInt(color2.substring(3,5), 16);
        const b2 = parseInt(color2.substring(5,7), 16);
        
        const r = Math.round(r1 + (r2 - r1) * factor);
        const g = Math.round(g1 + (g2 - g1) * factor);
        const b = Math.round(b1 + (b2 - b1) * factor);
        
        return `rgb(${r},${g},${b})`;
    }

    animate() {
        if (!this.active) return;

        // Logic Updates
        this.flightOffset -= this.config.speed;

        // Smooth Mouse
        const dx = this.mouse.x - this.smoothMouse.x;
        const dy = this.mouse.y - this.smoothMouse.y;
        this.smoothMouse.x += dx * this.config.mouse.smooth;
        this.smoothMouse.y += dy * this.config.mouse.smooth;

        // Pulse Updates
        for (let i = this.pulses.length - 1; i >= 0; i--) {
            const p = this.pulses[i];
            p.radius += this.config.pulse.speed;
            p.strength *= this.config.pulse.decay;
            if (p.strength < 0.01) this.pulses.splice(i, 1);
        }

        // Render Setup
        const rw = this.canvas.width;
        const rh = this.canvas.height;
        this.ctx.fillStyle = this.config.colors.background;
        this.ctx.fillRect(0, 0, rw, rh);

        // --- HORIZON GLOW ---
        const horizonY = rh * 0.4 + (this.smoothMouse.y - rh/2) * 0.05; 
        
        const glowGrad = this.ctx.createLinearGradient(0, horizonY - 250, 0, horizonY + 150);
        glowGrad.addColorStop(0, 'rgba(0,0,0,0)');
        glowGrad.addColorStop(0.5, 'rgba(0, 255, 136, 0.12)'); 
        glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
        
        this.ctx.fillStyle = glowGrad;
        this.ctx.fillRect(0, horizonY - 250, rw, 400);

        // --- PARTICLES ---
        const fov = 350;
        const cx = rw / 2 + (this.smoothMouse.x - rw / 2) * 0.05;
        const cy = rh / 2 + (this.smoothMouse.y - rh / 2) * 0.05;

        this.ctx.fillStyle = this.config.colors.particles;
        
        this.particles.forEach(p => {
            // Partikel bewegen sich jetzt auch langsamer
            p.z -= this.config.particles.speed * 8; 
            if (p.z < 10) this.resetParticle(p); 

            const scale = fov / (fov + p.z);
            const px = p.x * scale + cx;
            const py = p.y * scale + cy;

            if (px > -50 && px < rw + 50 && py > -50 && py < rh + 50) {
                const alpha = Math.min(1, p.opacity * scale); 
                this.ctx.globalAlpha = alpha;
                const size = p.size * scale;
                this.ctx.beginPath();
                this.ctx.arc(px, py, size, 0, Math.PI*2);
                this.ctx.fill();
            }
        });
        this.ctx.globalAlpha = 1.0;

        // --- GRID RENDERING ---
        const { cols, rows, size, slope } = this.config.grid;
        const camHeight = 220; 
        const camZ = 50;
        const projPoints = [];

        // Punkte berechnen
        for (let z = 0; z < rows; z++) {
            for (let x = 0; x < cols; x++) {
                const wx = (x - cols / 2) * size;
                
                const trueZ = z + this.flightOffset;
                const noiseY = this.getNoise(x, trueZ);
                
                let wy = noiseY + camHeight - (z * slope);
                let wz = z * size + camZ;

                const scale = fov / (fov + wz);
                const px = wx * scale + cx;
                const py = wy * scale + cy;

                // Interaktionen
                let renderY = py;
                let renderX = px;

                // Maus Verzerrung
                const mDx = this.smoothMouse.x - px;
                const mDy = this.smoothMouse.y - py;
                const mDist = Math.sqrt(mDx*mDx + mDy*mDy);
                if (mDist < this.config.mouse.radius) {
                    const force = Math.cos((mDist / this.config.mouse.radius) * (Math.PI/2)) * this.config.mouse.force;
                    renderY += force;
                }

                // Pulse Wave
                this.pulses.forEach(pulse => {
                    const pDx = px - pulse.x;
                    const pDy = py - pulse.y;
                    const pDist = Math.sqrt(pDx*pDx + pDy*pDy);
                    const distFromRing = Math.abs(pDist - pulse.radius);
                    
                    if (distFromRing < this.config.pulse.width) {
                        const wave = Math.cos((distFromRing / this.config.pulse.width) * (Math.PI/2));
                        renderY -= wave * this.config.pulse.force * pulse.strength;
                    }
                });

                projPoints.push({ x: renderX, y: renderY, scale: scale, heightVal: noiseY });
            }
        }

        // Linien zeichnen
        this.ctx.lineWidth = 1.2;
        
        for (let z = 0; z < rows; z++) {
            for (let x = 0; x < cols; x++) {
                const i = z * cols + x;
                const p = projPoints[i];

                if (p.scale < 0.05) continue; 

                // Transparenz
                let opacity = 1;
                if (z > rows * 0.85) {
                    opacity = 1 - ((z - rows * 0.85) / (rows * 0.15));
                }
                if (z < 1) opacity = z; 

                if (opacity <= 0.01) continue;

                // Farben
                let color;
                const hVal = p.heightVal; 
                const normHeight = (hVal + this.config.grid.amplitude) / (this.config.grid.amplitude * 2); 
                
                if (normHeight < 0.5) {
                    color = this.lerpColor(this.config.colors.linesLow, this.config.colors.linesHigh, normHeight * 2);
                } else {
                    color = this.lerpColor(this.config.colors.linesHigh, this.config.colors.linesPeak, (normHeight - 0.5) * 2);
                }

                this.ctx.beginPath();
                this.ctx.strokeStyle = color;
                this.ctx.globalAlpha = opacity; 

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
                
                if (x < cols - 1 && z < rows - 1) {
                     const pDiag = projPoints[i + cols + 1];
                     this.ctx.moveTo(p.x, p.y);
                     this.ctx.lineTo(pDiag.x, pDiag.y);
                }

                this.ctx.stroke();
            }
        }
        
        this.ctx.globalAlpha = 1.0; 
        this.frameId = requestAnimationFrame(() => this.animate());
    }

    destroy() {
        this.active = false;
        cancelAnimationFrame(this.frameId);
        window.removeEventListener('mousemove', this.mouseHandler);
        window.removeEventListener('mousedown', this.clickHandler);
        if (this.canvas) this.canvas.remove();
    }
}

window.WireframeTheme = WireframeTheme;