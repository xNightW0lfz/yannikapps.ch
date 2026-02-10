// =========================================
// KONFIGURATION
// =========================================
const SHEET_BASE_ID = '1BSvSMhiEpOc-USXOhCSoyaV3NfD3MxX7QPTNUWH2ZCU';
const BASE_URL = `https://docs.google.com/spreadsheets/d/${SHEET_BASE_ID}/export?format=csv`;

const MAINTENANCE_GID = '1575409910'; // GID für Wartungs-Check

const PROJECT_CONFIG = [
    { name: 'Hauptprojekte', gid: '1301522918', containerId: 'mainProjectsContainer' },
    { name: 'Nebenprojekte', gid: '0', containerId: 'tilesContainer' },
    { name: 'Drittanbieter', gid: '1136544950', containerId: 'thirdPartyContainer' }
];

// =========================================
// 3D PARTICLE SPHERE
// =========================================
class ParticleSphere {
    constructor() {
        this.canvas = document.getElementById('loaderCanvas');
        if(!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.ctx.scale(dpr, dpr);
        this.width = rect.width;
        this.height = rect.height;

        this.particles = [];
        this.isActive = true;
        this.rotation = 0;
        
        this.particleCount = 750; 
        this.radius = 85; 
        
        this.initParticles();
        this.animate();
    }

    initParticles() {
        for (let i = 0; i < this.particleCount; i++) {
            const phi = Math.acos( -1 + ( 2 * i ) / this.particleCount );
            const theta = Math.sqrt( this.particleCount * Math.PI ) * phi;

            this.particles.push({
                x: this.radius * Math.cos( theta ) * Math.sin( phi ),
                y: this.radius * Math.sin( theta ) * Math.sin( phi ),
                z: this.radius * Math.cos( phi ),
                baseX: this.radius * Math.cos( theta ) * Math.sin( phi ),
                baseY: this.radius * Math.sin( theta ) * Math.sin( phi ),
                baseZ: this.radius * Math.cos( phi ),
                size: Math.random() * 1.8 + 0.3,
                colorOffset: Math.random() * 120,
                pulseSpeed: Math.random() * 0.08 + 0.02
            });
        }
    }

    animate() {
        if (!this.isActive) return;

        this.ctx.clearRect(0, 0, this.width, this.height);
        const cx = this.width / 2;
        const cy = this.height / 2;

        this.rotation += 0.015;
        const time = Date.now() * 0.002;

        this.particles.sort((a, b) => b.rotatedZ - a.rotatedZ);

        this.particles.forEach(p => {
            const pulse = 1 + Math.sin(time * p.pulseSpeed) * 0.15;
            let px = p.baseX * pulse;
            let py = p.baseY * pulse;
            let pz = p.baseZ * pulse;

            let rotX = px * Math.cos(this.rotation) - pz * Math.sin(this.rotation);
            let rotZ = px * Math.sin(this.rotation) + pz * Math.cos(this.rotation);
            let rotY = py * Math.cos(0.4) - rotZ * Math.sin(0.4);
            let finalZ = py * Math.sin(0.4) + rotZ * Math.cos(0.4);

            p.rotatedZ = finalZ;

            const perspective = 300 / (300 + finalZ);
            const x2d = cx + rotX * perspective;
            const y2d = cy + rotY * perspective;
            const scale = perspective * p.size;
            const alpha = (finalZ + this.radius) / (this.radius * 2); 
            
            const hue = (this.rotation * 60 + p.colorOffset) % 360;

            if (scale > 0) {
                this.ctx.fillStyle = `hsla(${hue}, 85%, 60%, ${Math.max(0.1, alpha)})`;
                this.ctx.beginPath();
                this.ctx.arc(x2d, y2d, scale, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });

        requestAnimationFrame(() => this.animate());
    }

    stop() {
        this.isActive = false;
    }
}

// =========================================
// LOADING LOGIC
// =========================================
const loadingText = document.getElementById('loadingText');
const progressFill = document.getElementById('loaderProgressFill');
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function updateLoader(text, percentage) {
    if(!loadingText) return;

    loadingText.style.opacity = '0';
    await wait(150); 

    loadingText.innerText = text;
    if(progressFill) progressFill.style.width = percentage + '%';

    loadingText.style.opacity = '1';
    await wait(150); 
}

// Robustere Wartungs-Prüfung
async function checkMaintenanceStatus() {
    const url = `${BASE_URL}&gid=${MAINTENANCE_GID}`;
    try {
        const response = await fetch(url, { cache: 'no-store' });
        if (!response.ok) return true; // Wenn Fetch fehlschlägt, Seite online lassen
        
        const text = await response.text();
        
        // Prüfen ob es HTML ist (Google Login Page redirection)
        if(text.trim().startsWith('<')) {
            console.warn("Wartungs-Check erhielt HTML statt CSV. Sheet nicht öffentlich?");
            return true; 
        }

        const cleanText = text.trim().toUpperCase();
        const lines = cleanText.split(/\r?\n/);
        
        // Wir schauen uns die erste Zeile an
        if (lines.length > 0) {
            // Entferne Anführungszeichen, die CSV Export manchmal hinzufügt: "FALSE" -> FALSE
            let firstCell = lines[0].split(',')[0].trim().replace(/^"|"$/g, '');
            
            // Direkter Check auf FALSE
            if (firstCell === 'FALSE') return false;
            
            // Check auf Key-Value Paar (IsOn, FALSE)
            // Falls Zeile 1 "IsOn,TRUE" ist und Zeile 2 "FALSE" (oder umgekehrt)
            // Wir suchen einfach im ganzen Text nach dem Key
            
            // Wir parsen kurz sauber
            const rows = lines.map(l => l.split(',').map(c => c.trim().replace(/^"|"$/g, '')));
            
            // Suche nach Zeile wo erste Spalte "ISON" ist
            const isOnRow = rows.find(r => r[0] === 'ISON');
            if (isOnRow && isOnRow.length > 1) {
                if (isOnRow[1] === 'FALSE') return false;
            }
        }

        return true; // Standard: Online
    } catch (e) {
        console.warn("Wartungscheck Fehler:", e);
        return true; 
    }
}

async function initOptimizedLoading() {
    try {
        if(loadingText) loadingText.innerText = "Verbinde...";
        if(progressFill) progressFill.style.width = '10%';
        await wait(200);

        // 1. Wartungscheck
        const isOnline = await checkMaintenanceStatus();
        
        if (!isOnline) {
            if(window.particleSphere) window.particleSphere.stop();
            if(progressFill) progressFill.style.width = '0%';
            
            // UI Verstecken / Ändern
            if(loadingText) loadingText.style.display = 'none';
            const progressBar = document.querySelector('.loader-progress-bar');
            if(progressBar) progressBar.style.display = 'none';
            const canvas = document.getElementById('loaderCanvas');
            if(canvas) canvas.style.opacity = '0.3';
            
            const msg = document.getElementById('maintenanceMessage');
            if(msg) msg.style.display = 'block';
            return; // STOPPT HIER
        }

        // 2. Parallel Loading
        updateLoader("Lade Inhalte...", 40);

        const promises = PROJECT_CONFIG.map(config => 
            fetchTilesData(config.gid)
                .then(tiles => ({ config, tiles }))
                .catch(err => ({ config, error: err }))
        );

        const results = await Promise.all(promises);

        updateLoader("Verarbeite Daten...", 75);

        // Rendern
        results.forEach(res => {
            if (res.tiles) {
                renderTiles(res.tiles, res.config.containerId);
            }
        });

        // 3. Bilder Check (FIX: Wartet wirklich auf Bilder)
        const images = Array.from(document.querySelectorAll('.tile-image'));
        if (images.length > 0) {
            updateLoader("Optimiere Ansicht...", 90);
            
            const imagePromises = images.map(img => {
                if (img.complete && img.naturalHeight !== 0) return Promise.resolve();
                return new Promise(resolve => {
                    // Falls Bild cached, feuert onload evtl nicht mehr, daher Check oben wichtig.
                    // Falls noch am laden:
                    img.addEventListener('load', resolve, { once: true });
                    img.addEventListener('error', resolve, { once: true });
                });
            });
            
            // Timeout nach 1.5s falls ein Bild hängt
            await Promise.race([Promise.all(imagePromises), wait(1500)]);
        }
        
        if(progressFill) progressFill.style.width = '100%';
        if(loadingText) loadingText.innerText = "Bereit";
        await wait(200);
        
        finishLoading();

    } catch (err) {
        console.error("Ladefehler:", err);
        finishLoading(); 
    }
}

function finishLoading() {
    const screen = document.getElementById('loadingScreen');
    const wrapper = document.getElementById('mainWrapper');
    
    if(window.particleSphere) window.particleSphere.stop();

    screen.classList.add('fade-out');
    wrapper.classList.add('content-visible');
    document.body.classList.remove('loading-active');
    
    setTimeout(() => {
        screen.style.display = 'none';
    }, 900);
}


// =========================================
// PARSING & RENDERING
// =========================================
function parseCsvLine(line) {
    // Einfaches CSV Splitting
    return line.split(',').map(v => v.trim().replace(/^\"|\"$/g, ''));
}

function parseTilesCsv(csvText) {
    const lines = csvText.trim().split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length === 0) return [];

    const header = parseCsvLine(lines[0]).map(h => h.toLowerCase());
    const getIndex = (name) => header.indexOf(name);
    
    const idxKey = getIndex('key');
    const idxTitle = getIndex('title');
    const idxSubtitle = getIndex('subtitle');
    const idxUrl = getIndex('url');
    const idxImageUrl = getIndex('image_url');
    const idxStatus = getIndex('status');
    const idxShowStatus = getIndex('show status');
    const idxDate = getIndex('date');
    const idxIsColored = getIndex('is_colored');
    const idxColorCode = getIndex('color_code');
    const idxRadius = getIndex('radius');
    const idxIntensity = getIndex('intensity');

    const tiles = [];

    for (let i = 1; i < lines.length; i++) {
        const row = parseCsvLine(lines[i]);
        if (!row.length) continue;
        const getByIndex = (index) => (index >= 0 && index < row.length) ? row[index].trim() : '';

        const tile = {
            key: getByIndex(idxKey),
            title: getByIndex(idxTitle),
            subtitle: getByIndex(idxSubtitle),
            url: getByIndex(idxUrl),
            imageUrl: getByIndex(idxImageUrl),
            status: getByIndex(idxStatus).toLowerCase(),
            showStatus: ['true','1','yes'].includes(getByIndex(idxShowStatus).toLowerCase()),
            date: getByIndex(idxDate),
            isColored: ['true','1','yes'].includes(getByIndex(idxIsColored).toLowerCase()),
            colorCode: getByIndex(idxColorCode),
            radius: getByIndex(idxRadius) || '25',
            intensity: getByIndex(idxIntensity) || '40'
        };

        if(tile.title || tile.url) {
            tiles.push(tile);
        }
    }
    return tiles;
}

async function fetchTilesData(gid) {
    const url = `${BASE_URL}&gid=${gid}`;
    try {
        const response = await fetch(url, { cache: 'no-store' });
        if (!response.ok) throw new Error('Network error');
        return parseTilesCsv(await response.text());
    } catch (err) {
        throw err;
    }
}

function hexToRgba(hex, alpha) {
    let c;
    if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
        c = hex.substring(1).split('');
        if(c.length === 3) c= [c[0], c[0], c[1], c[1], c[2], c[2]];
        c = '0x'+c.join('');
        return 'rgba('+[(c>>16)&255, (c>>8)&255, c&255].join(',')+','+alpha+')';
    }
    return hex;
}

function renderTiles(tiles, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    if (!tiles || tiles.length === 0) {
        container.innerHTML = '<p class="no-tiles-message">Keine Inhalte.</p>';
        return;
    }

    tiles.forEach(tile => {
        if(tile.key && tile.key.toLowerCase() === 'ison') return;
        if(!tile.title && !tile.url) return;

        const a = document.createElement('a');
        a.className = 'tile';
        a.href = tile.url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';

        // GLOW
        if (tile.isColored && tile.colorCode) {
            const alpha = Math.max(0, Math.min(1, parseInt(tile.intensity) / 100));
            const blurRadius = parseInt(tile.radius) || 25;
            const spreadRadius = blurRadius * 0.6;
            const shadowColor = hexToRgba(tile.colorCode, alpha);
            
            a.style.boxShadow = `0 0 ${blurRadius}px ${spreadRadius}px ${shadowColor}`;
            a.style.borderColor = hexToRgba(tile.colorCode, Math.min(1, alpha + 0.2));
            a.style.zIndex = '1';
        }

        // BILD LOGIK (FIXED)
        if (tile.imageUrl) {
            const imgContainer = document.createElement('div');
            imgContainer.className = 'tile-image-container';

            const img = document.createElement('img');
            img.className = 'tile-image';
            img.alt = tile.title;
            // WICHTIG: loading="lazy" entfernt, da es den Start verzögert
            
            const placeholder = document.createElement('div');
            placeholder.className = 'image-placeholder';

            // Event Listener ZUERST definieren
            img.onload = function() {
                this.classList.add('loaded');
                placeholder.style.display = 'none';
            };
            img.onerror = function() {
                placeholder.style.display = 'none';
            };

            // DANN Source setzen
            img.src = tile.imageUrl;

            // Falls Cache sofort liefert
            if(img.complete) {
                img.classList.add('loaded');
                placeholder.style.display = 'none';
            }

            imgContainer.appendChild(img);
            imgContainer.appendChild(placeholder);
            a.appendChild(imgContainer);
        }

        const content = document.createElement('div');
        content.className = 'tile-content';
        
        const header = document.createElement('div');
        header.className = 'tile-header';
        
        const titleEl = document.createElement('div');
        titleEl.className = 'tile-title';
        titleEl.textContent = tile.title;
        
        if (tile.status === 'online' && tile.date && tile.date.toLowerCase() !== 'none') {
            const dateSpan = document.createElement('span');
            dateSpan.className = 'tile-date';
            dateSpan.textContent = tile.date;
            titleEl.appendChild(dateSpan);
        }
        header.appendChild(titleEl);

        if (tile.showStatus && tile.status) {
            const statusEl = document.createElement('span');
            statusEl.className = 'tile-status';
            const rawStatus = tile.status.toLowerCase();
            statusEl.textContent = rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1);
            statusEl.setAttribute('data-status', rawStatus);
            header.appendChild(statusEl);
        }
        content.appendChild(header);

        if (tile.subtitle) {
            const desc = document.createElement('div');
            desc.className = 'tile-description';
            desc.textContent = tile.subtitle;
            content.appendChild(desc);
        }
        a.appendChild(content);
        container.appendChild(a);
    });
}

// =========================================
// EFFECTS MANAGER
// =========================================
class EffectsManager {
    constructor() {
        this.currentEffect = null;
        this.selectEl = document.getElementById('bgSelect');
        this.mobileBreakpoint = 769;
        
        const saved = localStorage.getItem('yannikApps_bg') || 'wireframe';
        
        if (this.selectEl) {
            const newEl = this.selectEl.cloneNode(true);
            this.selectEl.parentNode.replaceChild(newEl, this.selectEl);
            this.selectEl = newEl;
            this.selectEl.value = saved;
            this.selectEl.addEventListener('change', (e) => this.switchEffect(e.target.value));
        }

        this.switchEffect(saved);
        window.addEventListener('resize', () => this.handleResize());
    }

    handleResize() {
        if (window.innerWidth >= this.mobileBreakpoint) {
            if (this.currentEffect) {
                if (typeof this.currentEffect.resize === 'function') this.currentEffect.resize();
            } else {
                const saved = localStorage.getItem('yannikApps_bg') || 'wireframe';
                this.switchEffect(saved);
            }
        } else {
            if (this.currentEffect) {
                this.currentEffect.destroy();
                this.currentEffect = null;
            }
        }
    }

    switchEffect(name) {
        if(window.innerWidth < this.mobileBreakpoint) return;

        if (this.currentEffect) {
            this.currentEffect.destroy();
            this.currentEffect = null;
        }

        localStorage.setItem('yannikApps_bg', name);

        switch(name) {
            case 'nature': if (window.NatureTheme) this.currentEffect = new window.NatureTheme(); break;
            case 'minimal': if (window.MinimalTheme) this.currentEffect = new window.MinimalTheme(); break;
            case 'wireframe': if (window.WireframeTheme) this.currentEffect = new window.WireframeTheme(); break;
        }
    }
}

// =========================================
// INIT
// =========================================
document.addEventListener('DOMContentLoaded', function () {
    
    // 1. Hintergrund SOFORT starten
    window.effectsManager = new EffectsManager();

    // 2. Start Optimized Loader
    window.particleSphere = new ParticleSphere();
    initOptimizedLoading();

    // 3. Footer
    const year = new Date().getFullYear();
    document.querySelectorAll('[data-current-year]').forEach(el => el.textContent = year);

    // 4. Info Overlay Logic
    const infoOverlay = document.getElementById('infoOverlay');
    const infoButton = document.getElementById('infoButton');
    const closeButton = document.getElementById('closeInfoOverlay');
    
    if (infoButton) {
        infoButton.addEventListener('click', () => {
            infoOverlay.style.display = 'flex';
            setTimeout(() => infoOverlay.classList.add('show'), 10);
        });
    }
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            infoOverlay.classList.remove('show');
            setTimeout(() => infoOverlay.style.display = 'none', 200);
        });
    }

    if(infoOverlay) {
        infoOverlay.addEventListener('click', (e) => {
            if(e.target === infoOverlay) {
                infoOverlay.classList.remove('show');
                setTimeout(() => infoOverlay.style.display = 'none', 200);
            }
        });
    }
});