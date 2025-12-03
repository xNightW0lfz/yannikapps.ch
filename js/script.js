// Custom Cursor Implementation
(() => {
    // Create and style the custom cursor element
    const cursor = document.createElement('div');
    cursor.className = 'custom-cursor';
    cursor.style.display = 'none';
    document.body.appendChild(cursor);

    const cursorToggle = document.getElementById('cursorToggle');

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

// URL to the Google Sheets data (CSV format)
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

        const csvText = await response.text();

        if (/^\s*</.test(csvText)) {
            console.error('[Tiles] Sieht nach HTML aus, nicht nach CSV. ' +
                'Ist das Sheet öffentlich / für das Web veröffentlicht?');
        }

        return parseTilesCsv(csvText);
    } catch (err) {
        console.error('[Tiles] Fehler beim Laden der Tiles-CSV:', err);
        throw err;
    }
}

function renderTiles(tiles) {
    const container = document.getElementById('tilesContainer');
    if (!container) {
        console.error('[Tiles] tilesContainer (Nebenprojekte) nicht gefunden.');
        return;
    }

    container.innerHTML = '';

    if (!tiles || tiles.length === 0) {
        const msg = document.createElement('p');
        msg.className = 'no-tiles-message';
        msg.textContent = 'Keine Nebenprojekte geladen. Prüfe Google-Sheet-Link/Berechtigungen.';
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
            container.innerHTML =
                '<p class="no-tiles-message">Nebenprojekte werden geladen ...</p>';
        }
    }
}

/**
 * Updates all elements with data-current-year attribute
 * to show the current year
 */
function updateCurrentYear() {
    const year = new Date().getFullYear();
    document.querySelectorAll('[data-current-year]').forEach(el => {
        el.textContent = year;
    });
}

// Initialize everything when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function () {
    // Load and display project tiles from Google Sheets
    initTilesFromSheet();
    // Update the current year in the footer
    updateCurrentYear();

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

    if (infoButton) {
        infoButton.addEventListener('click', showOverlay);
    }
    if (closeButton) {
        closeButton.addEventListener('click', hideOverlay);
    }

    if (infoOverlay) {
        infoOverlay.addEventListener('click', (e) => {
            if (e.target === infoOverlay) {
                hideOverlay();
            }
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && infoOverlay && infoOverlay.classList.contains('show')) {
            hideOverlay();
        }
    });
});