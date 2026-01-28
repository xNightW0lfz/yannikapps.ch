// =========================================
// KONFIGURATION
// =========================================
// Setze dies auf 'true', um nur Bilder in den Kacheln anzuzeigen (Text ausgeblendet)
const ENABLE_IMAGE_ONLY_MODE = false;

// =========================================
// EFFECTS MANAGER
// =========================================
class EffectsManager {
    constructor() {
        this.currentEffect = null;
        this.selectEl = document.getElementById('bgSelect');
        this.mobileBreakpoint = 769;
        
        // 1. Gespeicherte Auswahl laden oder Default 'cyberpunk'
        const saved = localStorage.getItem('yannikApps_bg') || 'nature';
        
        // 2. Dropdown initialisieren (falls vorhanden)
        if (this.selectEl) {
            this.selectEl.value = saved;
            this.selectEl.addEventListener('change', (e) => this.switchEffect(e.target.value));
        }

        // 3. Starten
        this.switchEffect(saved);

        // 4. Resize Listener (Wechsel Desktop/Mobile)
        window.addEventListener('resize', () => this.handleResize());
    }

    handleResize() {
        if (window.innerWidth >= this.mobileBreakpoint) {
            // Wenn wir wieder Desktop sind und kein Effekt läuft, starten wir ihn neu
            // oder resizen den bestehenden
            if (this.currentEffect) {
                if (typeof this.currentEffect.resize === 'function') {
                    this.currentEffect.resize();
                }
            } else {
                // Neustart des gespeicherten Effekts wenn wir von Mobile kommen
                const saved = localStorage.getItem('yannikApps_bg') || 'cyberpunk';
                this.switchEffect(saved);
            }
        } else {
            // Auf Mobile Effekte ausschalten (Performance)
            if (this.currentEffect) {
                this.currentEffect.destroy();
                this.currentEffect = null;
            }
        }
    }

    switchEffect(name) {
        // Mobile Check: Nichts tun, wenn Bildschirm zu klein
        if(window.innerWidth < this.mobileBreakpoint) return;

        // Alten Effekt aufräumen
        if (this.currentEffect) {
            this.currentEffect.destroy();
            this.currentEffect = null;
        }

        // Speichern
        localStorage.setItem('yannikApps_bg', name);

        // Neuen Effekt starten
        // Wir greifen auf die globalen Klassen zu, die in den anderen Dateien definiert sind
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
// Custom Cursor Implementation
// =========================================
(() => {
    // Create and style the custom cursor element
    const cursor = document.createElement('div');
    cursor.className = 'custom-cursor';
    cursor.style.display = 'none';
    document.body.appendChild(cursor);

    const cursorToggle = document.getElementById('cursorToggle');

    // Wenn kein Toggle da ist, Cursor normal lassen und abbrechen
    if (!cursorToggle) {
        document.body.style.cursor = 'auto';
        return;
    }

    let isCursorEnabled = localStorage.getItem('customCursor') === 'true';

    function updateCursorVisibility(show) {
        isCursorEnabled = show;
        if (show) {
            cursor.style.display = 'block';
            document.body.classList.add('custom-cursor-active');
            localStorage.setItem('customCursor', 'true');
            void cursor.offsetHeight;
        } else {
            cursor.style.display = 'none';
            document.body.classList.remove('custom-cursor-active');
            localStorage.setItem('customCursor', 'false');
        }
    }

    cursorToggle.checked = isCursorEnabled;
    setTimeout(() => {
        updateCursorVisibility(isCursorEnabled);
    }, 10);

    cursorToggle.addEventListener('change', (e) => {
        updateCursorVisibility(e.target.checked);
    });

    document.addEventListener('mousemove', (e) => {
        if (!isCursorEnabled) return;
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
    }, { passive: true });

    const handleHover = (hover) => {
        if (!isCursorEnabled) return;
        cursor.style.width = hover ? '24px' : '16px';
        cursor.style.height = hover ? '24px' : '16px';
        cursor.style.borderWidth = hover ? '1.5px' : '2px';
    };

    const interactiveSelector = 'a, button, input, textarea, select, .tile';
    const elements = document.querySelectorAll(interactiveSelector);
    elements.forEach(el => {
        el.addEventListener('mouseenter', () => handleHover(true));
        el.addEventListener('mouseleave', () => handleHover(false));
    });

    if (!isCursorEnabled) {
        cursor.style.display = 'none';
        document.body.style.cursor = 'auto';
    }
})();

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
            showStatus: rawShowStatus === 'true' || rawShowStatus === '1' || rawShowStatus === 'yes'
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
    // 1. Image Only Mode Check
    if (typeof ENABLE_IMAGE_ONLY_MODE !== 'undefined' && ENABLE_IMAGE_ONLY_MODE) {
        document.body.classList.add('image-only-mode');
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
            // Nur verarbeiten, wenn noch kein Container drum herum ist
            if (!img.parentElement.classList.contains('tile-image-container')) {
                const container = document.createElement('div');
                container.className = 'tile-image-container';

                // Bild in neuen Container verschieben
                img.parentNode.insertBefore(container, img);
                container.appendChild(img);

                // Placeholder einfügen
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

                // Falls das Bild bereits gecached ist
                if (img.complete) {
                    img.dispatchEvent(new Event('load'));
                }
            }
        });
    }

    // global verfügbar machen, damit script.js es nach dem Rendern aufrufen kann
    window.initTileImages = initTileImages;

    // Beim ersten Laden einmal ausführen (für statische Bilder)
    document.addEventListener('DOMContentLoaded', function () {
        initTileImages();
    });
})();