/**
 * MINIMAL THEME
 * Global Class: window.MinimalTheme
 */
class MinimalTheme {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'minimal-bg';
        Object.assign(this.canvas.style, {
            position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
            zIndex: '-5', pointerEvents: 'none', background: '#0a0a0a'
        });
        document.body.insertBefore(this.canvas, document.body.firstChild);
        this.ctx = this.canvas.getContext('2d');
        
        this.active = true;
        this.stars = [];
        this.resize();
        this.animate();
    }

    resize() {
        this.w = window.innerWidth;
        this.h = window.innerHeight;
        this.canvas.width = this.w;
        this.canvas.height = this.h;
        this.stars = [];
        // Einfache Partikel
        for(let i=0; i<150; i++) {
            this.stars.push({
                x: Math.random()*this.w, 
                y: Math.random()*this.h,
                r: Math.random()*1.5, 
                a: Math.random(), 
                s: 0.005 + Math.random()*0.01
            });
        }
    }

    animate() {
        if(!this.active) return;
        this.ctx.fillStyle = '#0a0a0a';
        this.ctx.fillRect(0,0,this.w,this.h);
        
        this.ctx.fillStyle = 'white';
        for (let s of this.stars) {
            s.a += s.s;
            if(s.a > 1 || s.a < 0) s.s = -s.s;
            
            this.ctx.globalAlpha = Math.max(0, Math.min(1, s.a));
            this.ctx.beginPath();
            this.ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
            this.ctx.fill();
        }
        
        this.frameId = requestAnimationFrame(() => this.animate());
    }

    destroy() {
        this.active = false;
        cancelAnimationFrame(this.frameId);
        if(this.canvas) this.canvas.remove();
    }
}

// Export global
window.MinimalTheme = MinimalTheme;