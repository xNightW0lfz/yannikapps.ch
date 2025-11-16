// Cursor implementation with toggle functionality
(() => {
  // Create cursor element
  const cursor = document.createElement('div');
  cursor.className = 'custom-cursor';
  cursor.style.display = 'none'; // Start hidden by default
  document.body.appendChild(cursor);
  
  // Get the cursor toggle element
  const cursorToggle = document.getElementById('cursorToggle');
  
  // Load saved preference or default to false (disabled)
  let isCursorEnabled = localStorage.getItem('customCursor') === 'true';
  cursorToggle.checked = isCursorEnabled;
  
  // Small delay to ensure styles are applied
  setTimeout(() => {
    if (isCursorEnabled) {
      cursor.style.display = 'block';
      document.body.classList.add('custom-cursor-active');
    }
  }, 10);
  
  // Toggle cursor on switch change
  cursorToggle.addEventListener('change', (e) => {
    isCursorEnabled = e.target.checked;
    localStorage.setItem('customCursor', isCursorEnabled);
    updateCursorVisibility(isCursorEnabled);
  });
  
  function updateCursorVisibility(show) {
    isCursorEnabled = show; // Ensure state is in sync
    if (show) {
      cursor.style.display = 'block';
      document.body.classList.add('custom-cursor-active');
      localStorage.setItem('customCursor', 'true');
      // Force reflow to ensure styles are applied
      void cursor.offsetHeight;
    } else {
      cursor.style.display = 'none';
      document.body.classList.remove('custom-cursor-active');
      localStorage.setItem('customCursor', 'false');
    }
  }
  
  // Update cursor position directly on mousemove
  document.addEventListener('mousemove', (e) => {
    if (isCursorEnabled) {
      cursor.style.left = e.clientX + 'px';
      cursor.style.top = e.clientY + 'px';
    }
  }, { passive: true });
  
  // Hover effects
  const handleHover = (isHovering) => {
    if (!isCursorEnabled) return;
    
    // Only apply custom cursor effects if enabled
    cursor.style.width = isHovering ? '24px' : '16px';
    cursor.style.height = isHovering ? '24px' : '16px';
    cursor.style.borderWidth = isHovering ? '1.5px' : '2px';
  };
  
  // Add hover effects to interactive elements
  const elements = document.querySelectorAll('a, button, input, textarea, select, .tile');
  elements.forEach(el => {
    el.addEventListener('mouseenter', () => {
      if (isCursorEnabled) handleHover(true);
    });
    el.addEventListener('mouseleave', () => {
      if (isCursorEnabled) handleHover(false);
    });
  });
  
  // Hide custom cursor by default (it will be shown when enabled)
  cursor.style.display = 'none';
  document.body.style.cursor = 'auto';
})();

// Google Sheets CSV export URL for website statuses
const STATUS_CSV_URL = 'https://docs.google.com/spreadsheets/d/1ipXsnftPUqLmQAIAl1klp5q264aAK2Czs0Y21-U8pok/export?format=csv&gid=0';

// Global store for website data
const websiteData = {
    statusMap: new Map(),
    versionMap: new Map()
};

// Function to parse CSV data
function parseStatusCsv(csvText) {
    console.log('Raw CSV text:', csvText);
    const lines = csvText.trim().split(/\r?\n/).filter(Boolean);
    console.log('Parsed lines:', lines);
    
    if (lines.length <= 1) {
        console.warn('CSV has no data rows');
        return { statusMap: new Map(), versionMap: new Map() };
    }
    
    // Skip header row and process data rows
    const statusMap = new Map();
    const versionMap = new Map();
    
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        try {
            // Handle quoted values and commas within quotes
            const values = line.match(/\s*("[^"]*"|'[^']*'|[^,]+)\s*(?:,|$)/g)
                .map(v => v.trim().replace(/^["']|["']$/g, '').trim());
                
            if (values.length >= 2) {
                const name = values[0].trim().toLowerCase();
                const status = values[1].trim().toLowerCase();
                const version = values[2] ? values[2].trim() : '';
                
                console.log(`Parsed row ${i}:`, { name, status, version });
                
                // Store in maps
                statusMap.set(name, status);
                if (version) {
                    versionMap.set(name, version);
                }
            }
        } catch (e) {
            console.error(`Error parsing line ${i + 1}:`, line, e);
        }
    }
    
    console.log('Parsed data:', { statusMap: Array.from(statusMap), versionMap: Array.from(versionMap) });
    return { statusMap, versionMap };
}

// Function to fetch website data from CSV
async function fetchWebsiteData() {
    try {
        const response = await fetch(STATUS_CSV_URL, { cache: 'no-store' });
        if (!response.ok) {
            throw new Error('Failed to fetch website data');
        }
        const csvText = await response.text();
        return parseStatusCsv(csvText);
    } catch (error) {
        console.error('Error fetching website data:', error);
        return { statusMap: new Map(), versionMap: new Map() };
    }
}

// Function to update website statuses and versions
async function updateWebsiteStatuses() {
    console.log('Fetching website data...');
    const { statusMap, versionMap } = await fetchWebsiteData();
    
    // Store data globally for later use
    websiteData.statusMap = statusMap;
    websiteData.versionMap = versionMap;
    
    console.log('Status map:', Array.from(statusMap));
    console.log('Version map:', Array.from(versionMap));
    
    if (statusMap.size === 0) {
        console.warn('No status data received');
        return;
    }
    
    // Update all tiles
    document.querySelectorAll('.tile').forEach((tile, index) => {
        const titleElement = tile.querySelector('.tile-title');
        if (!titleElement) {
            console.warn(`No title element found for tile ${index}`);
            return;
        }
        
        // Extract the website name (remove hosting info and trim)
        // Clone the title element to work with it
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = titleElement.innerHTML;
        
        // Remove all span elements (like the hosting info)
        const spans = tempDiv.getElementsByTagName('span');
        while (spans[0]) {
            spans[0].parentNode.removeChild(spans[0]);
        }
        
        // Get the remaining text content and clean it up
        let titleText = tempDiv.textContent
            .trim()
            .replace(/\s+/g, ' ')  // Replace multiple spaces with one
            .split(' ')[0]          // Get first word
            .toLowerCase()
            .trim();
            
        
        // Special handling for Drachenplasma - keep hardcoded status
        if (titleText === 'drachenplasma') {
            return;
        }
        // Special handling for Jira - keep hardcoded status
        if (titleText === 'jira') {
            return;
        }
        // Special handling for YXS - keep hardcoded status
        if (titleText === 'yxs') {
            return;
        }
        // Special handling for Changelog - keep hardcoded status
        if (titleText === 'changelog') {
            return;
        }
        
        // Try to find a matching status, first with exact match, then with partial match
        let status = statusMap.get(titleText);
        
        // Special debug for YS-Eva
        if (titleText.includes('ys-eva')) {
            console.log('Debug YS-EVA:', {
                titleText,
                statusMap: Array.from(statusMap.entries()),
                exactMatch: statusMap.get('ys-eva'),
                hasPartial: Array.from(statusMap.keys()).some(k => k.includes('ys-eva') || 'ys-eva'.includes(k))
            });
        }
        
        // If no exact match, try to find a partial match in the status map
        if (!status) {
            for (const [key, value] of statusMap.entries()) {
                const keyLower = key.toLowerCase();
                if (titleText.includes(keyLower) || keyLower.includes(titleText)) {
                    status = value;
                    console.log(`Found partial match: ${key} => ${status} for ${titleText}`);
                    // Store the matched key for version lookup
                    titleText = key;
                    break;
                }
            }
        }
        
        // Find version if available
        const version = versionMap.get(titleText);
        if (version) {
            tile.setAttribute('data-version', version);
        }
        
        console.log(`Processing tile ${index + 1}:`, { 
            elementText: titleElement.textContent,
            extractedName: titleText,
            foundStatus: status 
        });
        
        const statusElement = tile.querySelector('.tile-status');
        if (statusElement) {
            if (status) {
                // Capitalize first letter for display
                const displayStatus = status.charAt(0).toUpperCase() + status.slice(1);
                console.log(`Updating status for ${titleText} to ${displayStatus}`);
                statusElement.textContent = displayStatus;
                statusElement.setAttribute('data-status', status);
            } else {
                // If no status is found, mark as offline
                console.warn(`No status found for: ${titleText}, marking as offline`);
                statusElement.textContent = 'Offline';
                statusElement.setAttribute('data-status', 'offline');
            }
        } else {
            console.warn(`No status element found for ${titleText}`);
        }
    });
    
    console.log('Finished updating statuses');
}

// Datum
document.getElementById('currentYear').textContent = new Date().getFullYear();


// Info Overlay functionality
document.addEventListener('DOMContentLoaded', function() {
    // Initialize website statuses
    updateWebsiteStatuses();

    const infoOverlay = document.getElementById('infoOverlay');
    const infoButton = document.getElementById('infoButton');
    const closeButton = document.getElementById('closeInfoOverlay');
    let isAnimating = false;

    function showOverlay() {
        if (isAnimating) return;
        isAnimating = true;
        
        // Add overlay-open class to body
        document.body.classList.add('overlay-open');
        
        // Show overlay and start animation
        infoOverlay.style.display = 'flex';
        
        // Force reflow to trigger animation
        void infoOverlay.offsetWidth;
        
        // Add show class after a small delay to allow CSS transitions
        setTimeout(() => {
            infoOverlay.classList.add('show');
            isAnimating = false;
        }, 10);
    }

    function hideOverlay() {
        if (isAnimating) return;
        isAnimating = true;
        
        // Remove show class to trigger fade out animation
        infoOverlay.classList.remove('show');
        
        // After animation completes, hide the overlay and clean up
        setTimeout(() => {
            infoOverlay.style.display = 'none';
            document.body.classList.remove('overlay-open');
            isAnimating = false;
        }, 200);
    }
    
    // Event listeners
    infoButton.addEventListener('click', showOverlay);
    closeButton.addEventListener('click', hideOverlay);
    
    // Close overlay when clicking outside the content
    infoOverlay.addEventListener('click', (e) => {
        if (e.target === infoOverlay) {
            hideOverlay();
        }
    });
    
    // Close overlay with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && infoOverlay.classList.contains('show')) {
            hideOverlay();
        }
    });
});
