/**
 * NATURE THEME (Sun, Rain, Stars & Landscape)
 * Combined from original background.js, rain.js, stars.js
 * Global Class: window.NatureTheme
 */
class NatureTheme {
    constructor() {
        this.active = true;
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        
        // Sun Configuration
        this.sun = {
            x: 0, y: 0, radius: 200, glow: 250,
            pulseSpeed: 0.002, pulseAmount: 0.1, time: 0
        };
        
        // Rain Configuration
        this.drops = [];

        // Star Configuration
        this.starCount = 80;
        
        this.init();
    }

    init() {
        // 1. SKY & SUN CANVAS (z-index: -4)
        this.skyCanvas = document.createElement('canvas');
        this.skyCanvas.id = 'nature-sky';
        Object.assign(this.skyCanvas.style, {
            position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
            zIndex: '-4', pointerEvents: 'none'
        });
        document.body.insertBefore(this.skyCanvas, document.body.firstChild);
        this.skyCtx = this.skyCanvas.getContext('2d');

        // 2. STARS CONTAINER (z-index: -3)
        this.starContainer = document.createElement('div');
        this.starContainer.id = 'nature-stars';
        Object.assign(this.starContainer.style, {
            position: 'fixed', top: '0', left: '0', width: '100%', height: '50%',
            zIndex: '-3', pointerEvents: 'none', overflow: 'hidden'
        });
        document.body.insertBefore(this.starContainer, this.skyCanvas.nextSibling);
        this.injectStarCSS();
        this.createStars();

        // 3. LANDSCAPE CANVAS (z-index: -2)
        this.landCanvas = document.createElement('canvas');
        this.landCanvas.id = 'nature-land';
        Object.assign(this.landCanvas.style, {
            position: 'fixed', bottom: '0', left: '0', width: '100%', height: '40%',
            zIndex: '-2', pointerEvents: 'none'
        });
        document.body.insertBefore(this.landCanvas, this.starContainer.nextSibling);
        this.landCtx = this.landCanvas.getContext('2d');

        // 4. RAIN CANVAS (z-index: -1)
        this.rainCanvas = document.createElement('canvas');
        this.rainCanvas.id = 'nature-rain';
        Object.assign(this.rainCanvas.style, {
            position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
            zIndex: '-1', pointerEvents: 'none'
        });
        document.body.insertBefore(this.rainCanvas, this.landCanvas.nextSibling);
        this.rainCtx = this.rainCanvas.getContext('2d');

        // Initial Sizing & Drawing
        this.resize();
        
        // Start Loop
        this.animate();
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        // Resize Canvases
        this.skyCanvas.width = this.width;
        this.skyCanvas.height = this.height;
        
        this.landCanvas.width = this.width;
        this.landCanvas.height = this.height * 0.4;
        
        this.rainCanvas.width = this.width;
        this.rainCanvas.height = this.height;

        // Reset Components
        this.skyGradient = null; // Force gradient rebuild
        this.createStars(); // Re-distribute stars
        this.initDrops(); // Reset rain
        
        // Redraw Static Landscape (Expensive operation, only on resize)
        this.drawLandscape();
    }

    animate() {
        if (!this.active) return;

        // --- 1. Sun & Sky Animation ---
        this.sun.time += this.sun.pulseSpeed;
        this.skyCtx.clearRect(0, 0, this.width, this.height);
        this.drawSky();
        this.drawSun();

        // --- 2. Rain Animation ---
        this.drawRain();

        // --- 3. Stars (CSS Animated) & Landscape (Static) ---
        // No JS update needed per frame

        this.frameId = requestAnimationFrame(() => this.animate());
    }

    // ==========================================
    // COMPONENT: SKY & SUN
    // ==========================================
    drawSky() {
        if (!this.skyGradient) {
            this.skyGradient = this.skyCtx.createLinearGradient(0, this.height, 0, 0);
            this.skyGradient.addColorStop(0, '#4682B4'); // Steel Blue
            this.skyGradient.addColorStop(1, '#1a1a4a'); // Deep Blue
        }
        this.skyCtx.fillStyle = this.skyGradient;
        this.skyCtx.fillRect(0, 0, this.width, this.height);
    }

    drawSun() {
        const pulse = 1 + Math.sin(this.sun.time) * this.sun.pulseAmount;
        const ctx = this.skyCtx;
        
        ctx.save();
        
        // Position logic from original background.js
        this.sun.x = this.sun.glow * 0.8;
        this.sun.y = -this.sun.glow * 0.4;
        
        // Clipping
        ctx.beginPath();
        ctx.rect(0, 0, this.sun.x + this.sun.glow * 1.2, this.sun.glow * 2 * pulse);
        ctx.clip();

        // Rays
        const time = Date.now() * 0.001;
        const rayCount = 40;
        const rayLength = this.sun.radius * 2.5 * pulse;
        
        ctx.translate(this.sun.x, this.sun.y);
        ctx.globalCompositeOperation = 'lighter';

        for (let i = 0; i < rayCount; i++) {
            const t = i / (rayCount - 1);
            const angle = t * Math.PI * 2 + Math.sin(time * 0.25 + i * 0.2) * 0.03;
            const rayPulse = 0.95 + Math.sin(time * 0.8 + i * 0.5) * 0.1;
            const width = 2.6 + Math.sin(time * 0.8 + i) * 1.2;

            const grad = ctx.createLinearGradient(0, 0, rayLength, 0);
            grad.addColorStop(0, `rgba(255, 250, 210, ${0.22 * rayPulse})`);
            grad.addColorStop(0.2, `rgba(255, 220, 150, ${0.16 * rayPulse})`);
            grad.addColorStop(1, 'rgba(255, 170, 60, 0)');

            ctx.save();
            ctx.rotate(angle);
            ctx.beginPath();
            const innerR = this.sun.radius * 0.72;
            const outerR = innerR + rayLength * rayPulse;
            ctx.moveTo(innerR, 0);
            ctx.lineTo(outerR, -width);
            ctx.lineTo(outerR, width);
            ctx.fillStyle = grad;
            ctx.fill();
            ctx.restore();
        }
        
        ctx.restore(); // Undo clip & translate

        // Sun Body (Glow, Middle, Core)
        // Outer Glow
        const outerGrad = ctx.createRadialGradient(this.sun.x, this.sun.y, 0, this.sun.x, this.sun.y, this.sun.glow);
        outerGrad.addColorStop(0, 'rgba(255, 230, 100, 0.9)');
        outerGrad.addColorStop(0.5, 'rgba(255, 180, 50, 0.6)');
        outerGrad.addColorStop(1, 'rgba(255, 100, 0, 0)');
        
        ctx.beginPath();
        ctx.arc(this.sun.x, this.sun.y, this.sun.glow, 0, Math.PI * 2);
        ctx.fillStyle = outerGrad;
        ctx.fill();

        // Core
        const coreGrad = ctx.createRadialGradient(this.sun.x, this.sun.y, 0, this.sun.x, this.sun.y, this.sun.radius);
        coreGrad.addColorStop(0, '#FFF5D1');
        coreGrad.addColorStop(0.7, '#FFE066');
        coreGrad.addColorStop(1, '#FFA500');
        
        ctx.shadowColor = 'rgba(255, 200, 100, 0.8)';
        ctx.shadowBlur = 40;
        ctx.beginPath();
        ctx.arc(this.sun.x, this.sun.y, this.sun.radius, 0, Math.PI * 2);
        ctx.fillStyle = coreGrad;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Corona Bands
        for (let i = 1; i <= 4; i++) {
            const r = this.sun.radius * (1.05 + i * 0.18);
            const alpha = 0.12 - i * 0.02;
            const stroke = ctx.createRadialGradient(this.sun.x, this.sun.y, r * 0.6, this.sun.x, this.sun.y, r);
            stroke.addColorStop(0, `rgba(255, 210, 120, ${alpha})`);
            stroke.addColorStop(1, 'rgba(255, 140, 40, 0)');
            
            ctx.beginPath();
            ctx.arc(this.sun.x, this.sun.y, r, 0, Math.PI * 2);
            ctx.strokeStyle = stroke;
            ctx.lineWidth = 6 - i;
            ctx.stroke();
        }
    }

    // ==========================================
    // COMPONENT: STARS (DOM)
    // ==========================================
    injectStarCSS() {
        if (!document.getElementById('star-css')) {
            const style = document.createElement('style');
            style.id = 'star-css';
            style.textContent = `
                @keyframes twinkle {
                    0%, 100% { opacity: 0.2; }
                    50% { opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
    }

    createStars() {
        this.starContainer.innerHTML = '';
        for (let i = 0; i < this.starCount; i++) {
            const star = document.createElement('div');
            const size = 0.5 + Math.random() * 1.5;
            const opacity = 0.1 + Math.random() * 0.9;
            const duration = 3 + Math.random() * 5;
            const delay = Math.random() * 5;

            Object.assign(star.style, {
                position: 'absolute',
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 50}%`, // Only top 50%
                width: `${size}px`, height: `${size}px`,
                borderRadius: '50%', background: 'white',
                opacity: opacity,
                boxShadow: `0 0 ${size * 3}px ${size / 2}px rgba(255,255,255,${opacity * 0.5})`,
                transform: 'translate(-50%, -50%)',
                animation: `twinkle ${duration}s ease-in-out ${delay}s infinite`
            });
            this.starContainer.appendChild(star);
        }
    }

    // ==========================================
    // COMPONENT: LANDSCAPE
    // ==========================================
    drawLandscape() {
        const ctx = this.landCtx;
        const w = this.landCanvas.width;
        const h = this.landCanvas.height;

        ctx.clearRect(0, 0, w, h);

        // Far Mountains
        const farGrad = ctx.createLinearGradient(0, 0, 0, h * 0.7);
        farGrad.addColorStop(0, '#4a7c4a'); farGrad.addColorStop(1, '#2d4a2d');
        this.drawMountains(ctx, 0, 0, w, h * 0.7, 6, farGrad, 0.7);

        // Mid Mountains
        const midGrad = ctx.createLinearGradient(0, h * 0.4, 0, h * 0.8);
        midGrad.addColorStop(0, '#5a8f5a'); midGrad.addColorStop(1, '#3a6b3a');
        this.drawMountains(ctx, 0, h * 0.3, w, h * 0.8, 8, midGrad, 0.8);

        // Grass
        const grassStart = h * 0.6;
        const grassGrad = ctx.createLinearGradient(0, grassStart, 0, h);
        grassGrad.addColorStop(0, '#6bbd6b'); grassGrad.addColorStop(1, '#3d8b3d');
        ctx.fillStyle = grassGrad;
        ctx.fillRect(0, grassStart, w, h - grassStart);

        this.drawGrass(ctx, 0, grassStart, w, h, 200);
        this.drawFlowers(ctx, 0, grassStart, w, h - grassStart, 15);

        // Objects (Houses, Trees, Bushes)
        this.generateObjects(w, grassStart);
    }

    generateObjects(w, grassStart) {
        const minSpacing = 150;
        const housePos = [], treePos = [], bushPos = [];
        
        const isValid = (x, positions, spacing) => !positions.some(p => Math.abs(p - x) < spacing);

        // Houses
        const houseCount = 2 + Math.floor(Math.random() * 3);
        for(let i=0; i<houseCount; i++) {
            let x, attempts = 0;
            while(attempts++ < 50) {
                x = 50 + Math.random() * (w - 100);
                if(isValid(x, housePos, minSpacing * 1.5)) {
                    housePos.push(x);
                    const hw = 40 + Math.random()*40, hh = 40 + Math.random()*40;
                    const colors = [['#8b4513','#a0522d'],['#5f9ea0','#4682b4'],['#cd853f','#d2691e']];
                    const c = colors[Math.floor(Math.random()*colors.length)];
                    this.drawHouse(this.landCtx, x-hw/2, grassStart-hh, hw, hh, c[0], c[1]);
                    break;
                }
            }
        }

        // Trees
        const treeCount = 3 + Math.floor(Math.random() * 4);
        for(let i=0; i<treeCount; i++) {
            let x, attempts = 0;
            while(attempts++ < 50) {
                x = 30 + Math.random() * (w - 60);
                if(isValid(x, [...housePos, ...treePos], minSpacing)) {
                    treePos.push(x);
                    const tw = 20 + Math.random()*30, th = 50 + Math.random()*60;
                    const colors = ['#2e8b57', '#228b22', '#006400'];
                    this.drawTree(this.landCtx, x, grassStart + (Math.random()*20-10), tw, th, colors[Math.floor(Math.random()*colors.length)]);
                    break;
                }
            }
        }
        
        // Bushes
        const bushCount = 4 + Math.floor(Math.random() * 5);
        for(let i=0; i<bushCount; i++) {
            let x, attempts = 0;
            while(attempts++ < 50) {
                x = 20 + Math.random() * (w - 40);
                if(isValid(x, [...housePos, ...treePos, ...bushPos], minSpacing*0.7)) {
                    bushPos.push(x);
                    const bw = 30 + Math.random()*40, bh = 15 + Math.random()*25;
                    this.drawBush(this.landCtx, x, grassStart + Math.random()*15, bw, bh, '#2e8b57');
                    break;
                }
            }
        }
    }

    drawMountains(ctx, x, y, width, height, count, gradient, detail) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(x - 50, y + height);
        const segments = Math.max(3, Math.floor(count * 1.5));
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const px = x + (t * width);
            let py = y + (Math.random() * height * 0.2 * detail);
            if (i % 3 === 0) py = y - (Math.random() * height * 0.4 * detail);
            const detailNoise = Math.sin(t * Math.PI * 2) * (height * 0.1 * detail);
            if (i === 0) ctx.moveTo(px, py + detailNoise);
            else {
                const cx = x + ((t - 0.5/segments) * width);
                const cy = y + (Math.random() * height * 0.3 * detail) + detailNoise;
                ctx.quadraticCurveTo(cx, cy, px, py + detailNoise);
            }
        }
        ctx.lineTo(x + width + 50, y + height);
        ctx.lineTo(x - 50, y + height);
        ctx.fillStyle = gradient;
        ctx.shadowColor = 'rgba(0,0,0,0.2)';
        ctx.shadowBlur = 15 * detail;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.restore();
    }

    drawHouse(ctx, x, y, w, h, wallC, roofC) {
        ctx.save();
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath(); ctx.ellipse(x+w/2, y+h, w*0.8, h*0.1, 0, 0, Math.PI*2); ctx.fill();
        
        // Wall
        const wg = ctx.createLinearGradient(x,y,x+w,y);
        wg.addColorStop(0, this.adj(wallC, 15)); wg.addColorStop(1, this.adj(wallC, -15));
        ctx.fillStyle = wg; ctx.fillRect(x,y,w,h);
        
        // Roof
        const rg = ctx.createLinearGradient(x,y,x,y-w/3);
        rg.addColorStop(0, this.adj(roofC, -20)); rg.addColorStop(1, this.adj(roofC, 20));
        ctx.fillStyle = rg;
        ctx.beginPath(); ctx.moveTo(x-5, y); ctx.lineTo(x+w/2, y-w/3); ctx.lineTo(x+w+5, y); ctx.fill();
        
        // Window
        this.drawWin(ctx, x+w*0.15, y+h*0.2, w*0.3, h*0.25);
        this.drawWin(ctx, x+w*0.55, y+h*0.2, w*0.3, h*0.25);
        // Door
        ctx.fillStyle = '#5d2906'; ctx.fillRect(x+w*0.35, y+h*0.5, w*0.3, h*0.5);
        ctx.restore();
    }

    drawWin(ctx, x, y, w, h) {
        ctx.fillStyle = '#87ceeb'; ctx.fillRect(x,y,w,h);
        ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth=1;
        ctx.strokeRect(x,y,w,h);
        ctx.beginPath(); ctx.moveTo(x+w/2,y); ctx.lineTo(x+w/2,y+h); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x,y+h/2); ctx.lineTo(x+w,y+h/2); ctx.stroke();
    }

    drawTree(ctx, x, y, w, h, color) {
        ctx.save();
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath(); ctx.ellipse(x, y, w*0.6, w*0.1, 0,0,Math.PI*2); ctx.fill();
        // Trunk
        ctx.fillStyle = '#8b4513'; ctx.fillRect(x-w/8, y-h/2, w/4, h/2);
        // Leaves
        for(let i=0; i<3; i++) {
            const sz = w/2 * (1.2 - i*0.3);
            const grad = ctx.createRadialGradient(x, y-h*0.7, 0, x, y-h*0.7, sz);
            grad.addColorStop(0, this.adj(color, 30)); grad.addColorStop(1, this.adj(color, -20));
            ctx.fillStyle = grad;
            ctx.beginPath(); ctx.ellipse(x, y-h*0.7, sz, h/(3+i*0.5), 0,0,Math.PI*2); ctx.fill();
        }
        ctx.restore();
    }

    drawBush(ctx, x, y, w, h, color) {
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.beginPath(); ctx.ellipse(x, y+h*0.8, w*0.6, h*0.2, 0,0,Math.PI*2); ctx.fill();
        const g = ctx.createRadialGradient(x,y,0,x,y,Math.max(w,h));
        g.addColorStop(0, this.adj(color, 20)); g.addColorStop(1, this.adj(color, -20));
        ctx.fillStyle = g;
        for(let i=0; i<3; i++) {
            ctx.beginPath(); 
            ctx.ellipse(x+(Math.random()-0.5)*w*0.2, y+(Math.random()-0.5)*h*0.2, w*(0.4+Math.random()*0.2), h*(0.4+Math.random()*0.2), 0,0,Math.PI*2);
            ctx.fill();
        }
        ctx.restore();
    }

    drawGrass(ctx, x, y, w, h, count) {
        ctx.save(); ctx.strokeStyle = '#4cae4c'; ctx.lineWidth = 1.5;
        for(let i=0; i<count; i++) {
            const bx = x + Math.random()*w, by = y + Math.random()*h*0.2;
            const bh = 5 + Math.random()*15;
            ctx.beginPath(); ctx.moveTo(bx, by);
            ctx.quadraticCurveTo(bx+(Math.random()-0.5)*10, by-bh/2, bx+(Math.random()-0.5)*6, by-bh);
            ctx.stroke();
        }
        ctx.restore();
    }

    drawFlowers(ctx, x, y, w, h, count) {
        ctx.save();
        for(let i=0; i<count; i++) {
            const fx = x + Math.random()*w, fy = y + Math.random()*h;
            ctx.fillStyle = `hsl(${Math.random()*60+300}, 70%, 70%)`;
            const size = 2 + Math.random()*3;
            for(let p=0; p<5; p++) {
                const a = (p/5)*Math.PI*2;
                ctx.beginPath(); ctx.ellipse(fx+Math.cos(a)*size, fy+Math.sin(a)*size, size, size*0.5, a, 0, Math.PI*2); ctx.fill();
            }
            ctx.fillStyle = '#ffd700'; ctx.beginPath(); ctx.arc(fx, fy, size*0.7, 0, Math.PI*2); ctx.fill();
        }
        ctx.restore();
    }

    // ==========================================
    // COMPONENT: RAIN
    // ==========================================
    initDrops() {
        this.drops = [];
        const count = Math.floor((this.width * this.height) / 3000);
        for (let i = 0; i < count; i++) {
            this.drops.push({
                x: Math.random() * this.width,
                y: Math.random() * -this.height,
                l: 10 + Math.random() * 20,
                s: 2 + Math.random() * 5,
                o: 0.1 + Math.random() * 0.3
            });
        }
    }

    drawRain() {
        const ctx = this.rainCtx;
        ctx.clearRect(0, 0, this.width, this.height);
        ctx.lineWidth = 1; ctx.lineCap = 'round';
        
        for (let drop of this.drops) {
            ctx.beginPath();
            ctx.moveTo(drop.x, drop.y);
            ctx.lineTo(drop.x, drop.y + drop.l);
            ctx.strokeStyle = `rgba(174, 194, 224, ${drop.o})`;
            ctx.stroke();

            drop.y += drop.s;
            if (drop.y > this.height) {
                drop.y = -drop.l; drop.x = Math.random() * this.width;
            }
        }
    }

    // ==========================================
    // HELPERS
    // ==========================================
    adj(hex, amount) {
        let r=0,g=0,b=0;
        if(hex.startsWith('#')) {
            const h = hex.substring(1);
            r = parseInt(h.substr(0,2),16); g = parseInt(h.substr(2,2),16); b = parseInt(h.substr(4,2),16);
        }
        const clamp = v => Math.max(0,Math.min(255,v));
        return `rgb(${clamp(r+amount)},${clamp(g+amount)},${clamp(b+amount)})`;
    }

    destroy() {
        this.active = false;
        cancelAnimationFrame(this.frameId);
        if(this.skyCanvas) this.skyCanvas.remove();
        if(this.starContainer) this.starContainer.remove();
        if(this.landCanvas) this.landCanvas.remove();
        if(this.rainCanvas) this.rainCanvas.remove();
    }
}

window.NatureTheme = NatureTheme;