/**
 * CYBERPUNK THEME
 * Global Class: window.CyberpunkTheme
 */
class CyberpunkTheme {
    constructor() {
        this.config = {
            colors: {
                bgTop: '#020205', bgBottom: '#100b1f',
                gridLines: '#ff0055', gridGlow: '#bc13fe',
                sunTop: '#ffd700', sunBottom: '#ff0055'
            },
            grid: { speed: 80, spacing: 50, horizonY: 0.5 }
        };
        this.init();
    }

    init() {
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'cyberpunk-bg';
        Object.assign(this.canvas.style, {
            position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
            zIndex: '-5', pointerEvents: 'none'
        });
        document.body.insertBefore(this.canvas, document.body.firstChild);
        
        this.ctx = this.canvas.getContext('2d', { alpha: false });
        this.active = true;
        this.offset = 0;
        this.stars = this.createStars(4000);
        this.resize();
        this.animate();
    }

    createStars(density) {
        const arr = [];
        const count = Math.floor((window.innerWidth * window.innerHeight) / density);
        for(let i=0; i<count; i++) arr.push({
            x: Math.random(), y: Math.random() * 0.5,
            size: Math.random() * 1.5 + 0.5, opacity: Math.random(),
            speed: 0.02 + Math.random() * 0.05
        });
        return arr;
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }

    animate() {
        if (!this.active) return;
        const dt = 0.016; // Approx 60fps
        this.offset = (this.offset + this.config.grid.speed * dt) % this.config.grid.spacing;
        this.draw();
        this.frameId = requestAnimationFrame(() => this.animate());
    }

    draw() {
        const hY = this.height * this.config.grid.horizonY;
        
        // Sky
        const sky = this.ctx.createLinearGradient(0, 0, 0, hY);
        sky.addColorStop(0, this.config.colors.bgTop);
        sky.addColorStop(1, this.config.colors.bgBottom);
        this.ctx.fillStyle = sky;
        this.ctx.fillRect(0, 0, this.width, hY);

        // Stars
        this.ctx.fillStyle = 'white';
        this.stars.forEach(s => {
            s.opacity += Math.sin(Date.now() * s.speed * 0.1) * 0.05;
            this.ctx.globalAlpha = Math.max(0.1, Math.min(1, s.opacity));
            this.ctx.beginPath();
            this.ctx.arc(s.x * this.width, s.y * this.height, s.size, 0, Math.PI*2);
            this.ctx.fill();
        });
        this.ctx.globalAlpha = 1;

        // Sun
        this.drawSun(this.width/2, hY - this.height*0.05, this.height*0.25);

        // Floor Background
        this.ctx.fillStyle = '#050010';
        this.ctx.fillRect(0, hY, this.width, this.height - hY);

        // Grid
        this.drawGrid(hY);

        // Horizon Glow
        const glow = this.ctx.createLinearGradient(0, hY - this.height*0.15, 0, hY);
        glow.addColorStop(0, 'rgba(188, 19, 254, 0)');
        glow.addColorStop(1, 'rgba(188, 19, 254, 0.4)');
        this.ctx.fillStyle = glow;
        this.ctx.fillRect(0, hY - this.height*0.15, this.width, this.height*0.15);
    }

    drawSun(x, y, r) {
        const g = this.ctx.createLinearGradient(x, y-r*2, x, y);
        g.addColorStop(0, this.config.colors.sunTop);
        g.addColorStop(1, this.config.colors.sunBottom);
        this.ctx.fillStyle = g;
        this.ctx.shadowColor = this.config.colors.sunBottom;
        this.ctx.shadowBlur = 40;
        this.ctx.beginPath();
        this.ctx.arc(x, y-r*0.6, r, 0, Math.PI*2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
        // Scanlines
        this.ctx.globalCompositeOperation = 'destination-out';
        for(let i=0; i<8; i++) {
            this.ctx.fillRect(x-r-10, y-r + (i/8)*r, r*2+20, (r*0.05)+(i/8)*r*0.15);
        }
        this.ctx.globalCompositeOperation = 'source-over';
    }

    drawGrid(hY) {
        this.ctx.strokeStyle = this.config.colors.gridLines;
        this.ctx.shadowColor = this.config.colors.gridGlow;
        this.ctx.shadowBlur = 10;
        this.ctx.beginPath();
        
        // Verticals
        const cx = this.width/2;
        for(let i=-20; i<=20; i++) {
            const xBot = cx + (i/20) * this.width * 1.5;
            this.ctx.moveTo(cx, hY);
            this.ctx.lineTo(xBot, this.height);
        }
        this.ctx.stroke();

        // Horizontals
        const fh = this.height - hY;
        for(let z=20; z<300; z+=5) {
            const mz = z - (this.offset/this.config.grid.spacing)*5;
            if(mz < 20) continue;
            const df = (mz-20)/(280);
            const sy = hY + (Math.pow(df, 3) * fh);
            if(sy > this.height) continue;
            this.ctx.strokeStyle = `rgba(188, 19, 254, ${Math.pow(df,2)*0.8})`;
            this.ctx.beginPath();
            this.ctx.moveTo(0, sy);
            this.ctx.lineTo(this.width, sy);
            this.ctx.stroke();
        }
    }

    destroy() {
        this.active = false;
        cancelAnimationFrame(this.frameId);
        if(this.canvas) this.canvas.remove();
    }
}

// Export global
window.CyberpunkTheme = CyberpunkTheme;