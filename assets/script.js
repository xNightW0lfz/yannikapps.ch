// =========================================
// KONFIGURATION
// =========================================
const IS_BETA = false;

// =========================================
// EFFECTS MANAGER
// =========================================
class EffectsManager {
    constructor() {
        this.currentEffect = null;
        this.selectEl = document.getElementById('bgSelect');
        this.mobileBreakpoint = 769;
        
        const saved = localStorage.getItem('yannikApps_bg') || 'nature';
        
        if (this.selectEl) {
            this.selectEl.value = saved;
            this.selectEl.addEventListener('change', (e) => this.switchEffect(e.target.value));
        }

        this.switchEffect(saved);
        window.addEventListener('resize', () => this.handleResize());
    }

    handleResize() {
        if (window.innerWidth >= this.mobileBreakpoint) {
            if (this.currentEffect) {
                if (typeof this.currentEffect.resize === 'function') {
                    this.currentEffect.resize();
                }
            } else {
                const saved = localStorage.getItem('yannikApps_bg') || 'cyberpunk';
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
            case 'nature': 
                if (window.NatureTheme) this.currentEffect = new window.NatureTheme(); 
                break;
            case 'minimal': 
                if (window.MinimalTheme) this.currentEffect = new window.MinimalTheme(); 
                break;
            case 'wireframe': 
                if (window.WireframeTheme) this.currentEffect = new window.WireframeTheme(); 
                break;
            case 'cyberpunk': 
            default:
                if (window.CyberpunkTheme) this.currentEffect = new window.CyberpunkTheme(); 
                break;
        }
    }
}

// =========================================
// TILES LOGIC (Google Sheets)
// =========================================
const TILES_CSV_URL =
    'https://docs.google.com/spreadsheets/d/1BSvSMhiEpOc-USXOhCSoyaV3NfD3MxX7QPTNUWH2ZCU/export?format=csv';

function parseCsvLine(line) {
    return line
        .split(',')
        .map(v => v.trim().replace(/^\"|\"$/g, ''));
}

function parseTilesCsv(csvText) {
    const lines = csvText.trim().split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length === 0) {
        console.warn('[Tiles] CSV ist leer.');
        return [];
    }

    const headerRaw = parseCsvLine(lines[0]);
    const header = headerRaw.map(h => h.toLowerCase());

    const getIndex = (name) => header.indexOf(name);

    const idxKey        = getIndex('key');
    const idxTitle      = getIndex('title');
    const idxSubtitle   = getIndex('subtitle');
    const idxUrl        = getIndex('url');
    const idxImageUrl   = getIndex('image_url');
    const idxStatus     = getIndex('status');
    const idxShowStatus = getIndex('show status');
    const idxDate       = getIndex('date');

    const tiles = [];

    for (let i = 1; i < lines.length; i++) {
        const row = parseCsvLine(lines[i]);
        if (!row.length) continue;

        const getByIndex = (index) =>
            (index >= 0 && index < row.length) ? row[index].trim() : '';

        const rawShowStatus = getByIndex(idxShowStatus).toLowerCase();

        const tile = {
            key:        (getByIndex(idxKey) || '').toLowerCase(),
            title:      getByIndex(idxTitle)    || '',
            subtitle:   getByIndex(idxSubtitle) || '',
            url:        getByIndex(idxUrl)      || '',
            imageUrl:   getByIndex(idxImageUrl) || '',
            status:     (getByIndex(idxStatus)  || '').toLowerCase(),
            showStatus: rawShowStatus === 'true' || rawShowStatus === '1' || rawShowStatus === 'yes',
            date:       getByIndex(idxDate)     || ''
        };

        if (!tile.title || !tile.url) {
            console.warn('[Tiles] Zeile übersprungen (fehlender Titel oder URL):', row);
            continue;
        }

        tiles.push(tile);
    }

    return tiles;
}

async function fetchTilesData() {
    try {
        const response = await fetch(TILES_CSV_URL, { cache: 'no-store' });
        if (!response.ok) {
            console.error('[Tiles] HTTP-Fehler beim Laden der CSV:', response.status, response.statusText);
            throw new Error('HTTP error');
        }
        return parseTilesCsv(await response.text());
    } catch (err) {
        console.error('[Tiles] Fehler beim Laden der Tiles-CSV:', err);
        throw err;
    }
}

function renderTiles(tiles) {
    const container = document.getElementById('tilesContainer');
    if (!container) return;

    container.innerHTML = '';

    if (!tiles || tiles.length === 0) {
        const msg = document.createElement('p');
        msg.className = 'no-tiles-message';
        msg.textContent = 'Keine Nebenprojekte geladen.';
        container.appendChild(msg);
        return;
    }

    tiles.forEach(tile => {
        const a = document.createElement('a');
        a.className = 'tile';
        a.href = tile.url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';

        if (tile.imageUrl) {
            const img = document.createElement('img');
            img.className = 'tile-image';
            img.src = tile.imageUrl;
            img.alt = tile.title || 'Projekt';
            img.loading = 'lazy';
            a.appendChild(img);
        }

        const content = document.createElement('div');
        content.className = 'tile-content';

        const header = document.createElement('div');
        header.className = 'tile-header';

        const titleEl = document.createElement('div');
        titleEl.className = 'tile-title';
        titleEl.textContent = tile.title;

        // Datum Logik: Nur wenn Online UND Datum vorhanden UND nicht 'none'
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
            const displayStatus = rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1);
            statusEl.textContent = displayStatus;
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

    if (typeof window.initTileImages === 'function') {
        window.initTileImages();
    }
}

async function initTilesFromSheet() {
    try {
        const tiles = await fetchTilesData();
        renderTiles(tiles);
    } catch (err) {
        const container = document.getElementById('tilesContainer');
        if (container) {
            container.innerHTML = '<p class="no-tiles-message">Nebenprojekte werden geladen ...</p>';
        }
    }
}

function updateCurrentYear() {
    const year = new Date().getFullYear();
    document.querySelectorAll('[data-current-year]').forEach(el => {
        el.textContent = year;
    });
}

// =========================================
// INIT & EVENT LISTENERS
// =========================================
document.addEventListener('DOMContentLoaded', function () {
    
    // OFFLINE LINK PREVENTION
    document.addEventListener('click', function(e) {
        const tile = e.target.closest('.tile');
        if (tile) {
            const statusBadge = tile.querySelector('.tile-status[data-status="offline"]');
            if (statusBadge) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
        }
    }, true);

    // 1. Beta Logic
    if (typeof IS_BETA !== 'undefined') {
        if (IS_BETA) {
            document.body.classList.add('beta-mode');
            const banner = document.createElement('div');
            banner.className = 'beta-banner';
            banner.innerHTML = `
                <div class="beta-content">
                    <span class="beta-text">Dies ist eine Beta-Version der Website</span>
                    <div class="beta-actions">
                        <a href="mailto:y@nnik.me?subject=Feedback%20zu%20beta.yannikapps.ch" class="beta-btn">
                            Feedback geben
                        </a>
                        <a href="https://yannikapps.ch" class="beta-btn beta-btn-secondary">
                            Zurück zur Stabilen Version
                        </a>
                    </div>
                </div>
            `;
            document.body.prepend(banner);
        } else {
            const infoBody = document.querySelector('.info-body');
            const legalInfoLabel = Array.from(document.querySelectorAll('.info-label')).find(el => el.textContent.trim() === 'Legalinfo');
            
            if (legalInfoLabel) {
                const legalInfoItem = legalInfoLabel.closest('.info-item');
                const betaItem = document.createElement('div');
                betaItem.className = 'info-item';
                betaItem.innerHTML = `
                    <p class="info-label">Beta</p>
                    <a href="https://beta.yannikapps.ch" class="info-link">
                        Zur Beta wechseln
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18 13V19C18 19.5304 17.7893 20.0391 17.4142 20.4142C17.0391 20.7893 16.5304 21 16 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V8C3 7.46957 3.21071 6.96086 3.58579 6.58579C3.96086 6.21071 4.46957 6 5 6H11" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M15 3H21V9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M10 14L21 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </a>
                `;
                if (infoBody && legalInfoItem) {
                    infoBody.insertBefore(betaItem, legalInfoItem);
                }
            }
        }
    }

    // 2. Load Tiles
    initTilesFromSheet();
    
    // 3. Footer Year
    updateCurrentYear();

    // 4. Initialize Effects Manager
    window.effectsManager = new EffectsManager();

    // 5. Info Overlay Logic
    const infoOverlay = document.getElementById('infoOverlay');
    const infoButton = document.getElementById('infoButton');
    const closeButton = document.getElementById('closeInfoOverlay');
    let isAnimating = false;

    function showOverlay() {
        if (isAnimating) return;
        isAnimating = true;
        document.body.classList.add('overlay-open');
        infoOverlay.style.display = 'flex';
        void infoOverlay.offsetWidth;
        setTimeout(() => {
            infoOverlay.classList.add('show');
            isAnimating = false;
        }, 10);
    }

    function hideOverlay() {
        if (isAnimating) return;
        isAnimating = true;
        infoOverlay.classList.remove('show');
        setTimeout(() => {
            infoOverlay.style.display = 'none';
            document.body.classList.remove('overlay-open');
            isAnimating = false;
        }, 200);
    }

    if (infoButton) infoButton.addEventListener('click', showOverlay);
    if (closeButton) closeButton.addEventListener('click', hideOverlay);
    if (infoOverlay) {
        infoOverlay.addEventListener('click', (e) => {
            if (e.target === infoOverlay) hideOverlay();
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && infoOverlay && infoOverlay.classList.contains('show')) {
            hideOverlay();
        }
    });
});

// Fix for iOS Back-Button Cache
window.addEventListener('pageshow', (e) => {
    if (e.persisted) {
        setTimeout(() => {
            if (window.effectsManager) window.effectsManager.handleResize();
        }, 10);
    }
});

// Image-Loading / Skeleton für .tile-image
(function () {
    function initTileImages() {
        const images = document.querySelectorAll('.tile-image');

        images.forEach(img => {
            if (!img.parentElement.classList.contains('tile-image-container')) {
                const container = document.createElement('div');
                container.className = 'tile-image-container';

                img.parentNode.insertBefore(container, img);
                container.appendChild(img);

                const placeholder = document.createElement('div');
                placeholder.className = 'image-placeholder';
                container.appendChild(placeholder);

                img.onload = function () {
                    img.classList.add('loaded');
                    placeholder.style.display = 'none';
                };

                img.onerror = function () {
                    console.error('Failed to load image:', img.src);
                    placeholder.style.display = 'none';
                };

                if (img.complete) {
                    img.dispatchEvent(new Event('load'));
                }
            }
        });
    }

    window.initTileImages = initTileImages;

    document.addEventListener('DOMContentLoaded', function () {
        initTileImages();
    });
})();