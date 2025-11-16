// Statischer Sonnenhintergrund
class SunBackground {
  constructor() {
    try {
      console.log('Creating SunBackground instance');
      
      // Verwende das vordefinierte Canvas-Element
      this.canvas = document.getElementById('sun-bg');
      if (!this.canvas) {
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'sun-bg';
        document.body.insertBefore(this.canvas, document.body.firstChild);
      }
      
      this.ctx = this.canvas.getContext('2d');
      if (!this.ctx) {
        throw new Error('Could not get 2D context');
      }
      this.sun = {
        x: 0,                    // Am linken Rand beginnen
        y: 0,                    // Am Oberen Rand beginnen
        radius: 200,             // Grösserer Radius für die Sonne
        glow: 250,               // Grösserer Glüheffekt
        visiblePortion: 0.5,      // Nur die Hälfte der Sonne soll sichtbar sein
        pulseSpeed: 0.002,        // Geschwindigkeit der Pulsation
        pulseAmount: 0.1,         // Stärke der Pulsation
        time: 0                   // Zeitvariable für Animationen
      };
      
      // Farbverlauf für den Himmel
      this.skyGradient = null;
      this.lastWindowSize = { width: 0, height: 0 };
      console.log('Canvas created with size:', this.canvas.width, 'x', this.canvas.height);
      
      // Initialize immediately
      this.init();
    } catch (error) {
      console.error('Error in SunBackground constructor:', error);
    }
  }
  
  init() {
    try {
      console.log('Initializing SunBackground');
      
      // Make sure canvas is in the DOM
      if (!document.body.contains(this.canvas)) {
        document.body.insertBefore(this.canvas, document.body.firstChild);
      }
      
      // Apply styles
      Object.assign(this.canvas.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        zIndex: '-1',
        pointerEvents: 'none',
        display: 'block'
      });
      
      // Vordergrund-Canvas für die Landschaft
      this.foregroundCanvas = document.createElement('canvas');
      this.foregroundCanvas.style.position = 'fixed';
      this.foregroundCanvas.style.bottom = '0';
      this.foregroundCanvas.style.left = '0';
      this.foregroundCanvas.style.width = '100%';
      this.foregroundCanvas.style.height = '40%';
      this.foregroundCanvas.style.zIndex = '0';
      this.foregroundCanvas.style.pointerEvents = 'none';
      document.body.appendChild(this.foregroundCanvas);
      this.fgCtx = this.foregroundCanvas.getContext('2d');
      
      // Set canvas size
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
      this.foregroundCanvas.width = window.innerWidth;
      this.foregroundCanvas.height = window.innerHeight * 0.4;
      
      // Event-Handler für Größenänderungen
      this.handleResize = this.handleResize.bind(this);
      window.addEventListener('resize', this.handleResize);
      
      // Landschaft zeichnen
      this.drawLandscape();
      
      // Animation starten
      this.animate();
    } catch (error) {
      console.error('Error in init:', error);
    }
  }
  
  
  // Aktualisiere die Zeit für Animationen
  updateTime() {
    this.sun.time = (this.sun.time || 0) + this.sun.pulseSpeed;
  }
  
  // Zeichne den Himmelshintergrund
  drawSky() {
    // Erstelle einen neuen Farbverlauf nur bei Größenänderung
    if (!this.skyGradient || 
        this.lastWindowSize.width !== this.canvas.width || 
        this.lastWindowSize.height !== this.canvas.height) {
      
      // Verlauf um 180 Grad drehen, indem wir die Y-Koordinaten vertauschen
      this.skyGradient = this.ctx.createLinearGradient(0, this.canvas.height, 0, 0);
      this.skyGradient.addColorStop(0, '#4682B4');  // Dunkleres Türkisblau
      this.skyGradient.addColorStop(1, '#1a1a4a');    // Sehr dunkles Blau
      
      this.lastWindowSize = {
        width: this.canvas.width,
        height: this.canvas.height
      };
    }
    
    this.ctx.fillStyle = this.skyGradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
  
  // Hauptanimationsschleife
  animate() {
    this.updateTime();
    
    // Lösche Canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Nur zeichnen, wenn die Bildschirmbreite mindestens 769px beträgt
    if (window.innerWidth >= 769) {
      // Zeichne den Himmel
      this.drawSky();
      
      // Zeichne die Sonne
      this.drawSun();
    }
    
    // Nächsten Frame anfordern
    this.animationFrame = requestAnimationFrame(() => this.animate());
  }
  
  handleResize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.foregroundCanvas.width = window.innerWidth;
    this.foregroundCanvas.height = window.innerHeight * 0.4;
    this.drawLandscape();
  }
  
  drawLandscape() {
    // Auf mobilen Geräten nichts zeichnen
    if (window.innerWidth < 769) {
      this.fgCtx.clearRect(0, 0, this.foregroundCanvas.width, this.foregroundCanvas.height);
      return;
    }
    
    const ctx = this.fgCtx;
    const width = this.foregroundCanvas.width;
    const height = this.foregroundCanvas.height;
    
    // Clear the canvas
    ctx.clearRect(0, 0, width, height);
    
    // Background mountains (farthest)
    ctx.save();
    const farMountainGradient = ctx.createLinearGradient(0, 0, 0, height * 0.7);
    farMountainGradient.addColorStop(0, '#4a7c4a');
    farMountainGradient.addColorStop(1, '#2d4a2d');
    this.drawMountains(ctx, 0, 0, width, height * 0.7, 6, farMountainGradient, 0.7);
    
    // Middle ground mountains
    const midMountainGradient = ctx.createLinearGradient(0, height * 0.4, 0, height * 0.8);
    midMountainGradient.addColorStop(0, '#5a8f5a');
    midMountainGradient.addColorStop(1, '#3a6b3a');
    this.drawMountains(ctx, 0, height * 0.3, width, height * 0.8, 8, midMountainGradient, 0.8);
    
    // Foreground grass area
    const grassStart = height * 0.6;
    const grassGradient = ctx.createLinearGradient(0, grassStart, 0, height);
    grassGradient.addColorStop(0, '#6bbd6b');
    grassGradient.addColorStop(1, '#3d8b3d');
    
    ctx.fillStyle = grassGradient;
    ctx.fillRect(0, grassStart, width, height - grassStart);
    
    // Draw grass blades
    this.drawGrass(ctx, 0, grassStart, width, height, 200);
    
    // Add some flowers
    this.drawFlowers(ctx, 0, grassStart, width, height - grassStart, 15);
    
    // Generate random positions for houses and trees with minimum spacing
    const minSpacing = 150; // Minimum space between objects
    const housePositions = [];
    const treePositions = [];
    const bushPositions = [];
    
    // Function to check if a new position is valid (not too close to existing positions)
    const isValidPosition = (newX, positions, spacing) => {
      return !positions.some(pos => Math.abs(pos - newX) < spacing);
    };
    
    // Generate random positions for houses (2-4 houses)
    const houseCount = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < houseCount; i++) {
      let x, attempts = 0, valid = false;
      
      // Try to find a valid position (max 50 attempts to prevent infinite loops)
      while (!valid && attempts < 50) {
        x = 50 + Math.random() * (width - 100); // Keep some margin from screen edges
        
        // Check if this position is valid (not too close to other houses)
        if (isValidPosition(x, housePositions, minSpacing * 1.5)) {
          housePositions.push(x);
          valid = true;
          
          // Random house size and style
          const houseWidth = 40 + Math.random() * 40;
          const houseHeight = 40 + Math.random() * 40;
          const colors = [
            ['#8b4513', '#a0522d'], // Brown house with brown roof
            ['#5f9ea0', '#4682b4'], // Teal house with blue roof
            ['#cd853f', '#d2691e'], // Tan house with orange roof
            ['#8b7355', '#6b4e3a'], // Wooden house with dark brown roof
            ['#708090', '#2f4f4f']  // Slate gray house with dark slate roof
          ];
          const [wallColor, roofColor] = colors[Math.floor(Math.random() * colors.length)];
          
          this.drawHouse(ctx, x - houseWidth/2, grassStart - houseHeight, houseWidth, houseHeight, wallColor, roofColor);
        }
        attempts++;
      }
    }
    
    // Generate random positions for trees (3-6 trees)
    const treeCount = 3 + Math.floor(Math.random() * 4);
    for (let i = 0; i < treeCount; i++) {
      let x, attempts = 0, valid = false;
      
      while (!valid && attempts < 50) {
        x = 30 + Math.random() * (width - 60);
        
        // Check distance from houses and other trees
        if (isValidPosition(x, [...housePositions, ...treePositions], minSpacing)) {
          treePositions.push(x);
          valid = true;
          
          // Random tree size and type
          const treeWidth = 20 + Math.random() * 30;
          const treeHeight = 50 + Math.random() * 60;
          const colors = ['#2e8b57', '#228b22', '#3cb371', '#2d6a4f', '#006400', '#2e8b57'];
          const color = colors[Math.floor(Math.random() * colors.length)];
          const yOffset = Math.random() * 20 - 10; // Slight vertical variation
          
          this.drawTree(ctx, x, grassStart + yOffset, treeWidth, treeHeight, color);
        }
        attempts++;
      }
    }
    
    // Generate random positions for bushes (4-8 bushes)
    const bushCount = 4 + Math.floor(Math.random() * 5);
    for (let i = 0; i < bushCount; i++) {
      let x, attempts = 0, valid = false;
      
      while (!valid && attempts < 50) {
        x = 20 + Math.random() * (width - 40);
        
        // Check distance from houses, trees, and other bushes
        if (isValidPosition(x, [...housePositions, ...treePositions, ...bushPositions], minSpacing * 0.7)) {
          bushPositions.push(x);
          valid = true;
          
          // Random bush size and style
          const bushWidth = 30 + Math.random() * 40;
          const bushHeight = 15 + Math.random() * 25;
          const colors = ['#3a8a3a', '#4c9e4c', '#2e8b57', '#3cb371', '#2d6a4f'];
          const color = colors[Math.floor(Math.random() * colors.length)];
          const yOffset = Math.random() * 15; // Slight vertical variation
          
          this.drawBush(ctx, x, grassStart + yOffset, bushWidth, bushHeight, color);
        }
        attempts++;
      }
    }
    
    ctx.restore();
  }
  
  drawMountains(ctx, x, y, width, height, count, gradient, detailLevel = 1.0) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x - 50, y + height);
    
    // Add more points for smoother curves
    const segments = Math.max(3, Math.floor(count * 1.5));
    
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const peakX = x + (t * width);
      
      // Base height with some randomness
      let peakY = y + (Math.random() * height * 0.2 * detailLevel);
      
      // Add some larger peaks
      if (i % 3 === 0) {
        peakY = y - (Math.random() * height * 0.4 * detailLevel);
      }
      
      // Add some smaller details
      const detailNoise = Math.sin(t * Math.PI * 2) * (height * 0.1 * detailLevel);
      
      if (i === 0) {
        ctx.moveTo(peakX, peakY + detailNoise);
      } else {
        const ctrlX = x + ((t - 0.5/segments) * width);
        const ctrlY = y + (Math.random() * height * 0.3 * detailLevel) + detailNoise;
        ctx.quadraticCurveTo(ctrlX, ctrlY, peakX, peakY + detailNoise);
      }
    }
    
    // Complete the mountain shape
    ctx.lineTo(x + width + 50, y + height);
    ctx.lineTo(x - 50, y + height);
    ctx.closePath();
    
    // Add shadow for depth
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 15 * detailLevel;
    ctx.shadowOffsetX = 5 * detailLevel;
    ctx.shadowOffsetY = 5 * detailLevel;
    
    // Fill with gradient
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // Add some highlights
    if (detailLevel > 0.5) {
      const highlightGradient = ctx.createLinearGradient(0, y, 0, y + height);
      highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
      highlightGradient.addColorStop(1, 'transparent');
      
      ctx.fillStyle = highlightGradient;
      ctx.fill();
    }
    
    ctx.restore();
  }
  
  drawHouse(ctx, x, y, width, height, wallColor, roofColor) {
    // Save context for clipping
    ctx.save();
    
    // Draw shadow first
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(x + width/2, y + height, width * 0.8, height * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw walls with a subtle gradient
    const wallGradient = ctx.createLinearGradient(x, y, x + width, y);
    wallGradient.addColorStop(0, this.adjustColor(wallColor, 15));
    wallGradient.addColorStop(1, this.adjustColor(wallColor, -15));
    
    ctx.fillStyle = wallGradient;
    ctx.fillRect(x, y, width, height);
    
    // Add texture to walls
    ctx.strokeStyle = this.adjustColor(wallColor, -10);
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(x, y + (height * i/4));
      ctx.lineTo(x + width, y + (height * i/4));
      ctx.stroke();
    }
    
    // Draw roof with gradient
    const roofGradient = ctx.createLinearGradient(x, y, x, y - width/3);
    roofGradient.addColorStop(0, this.adjustColor(roofColor, -20));
    roofGradient.addColorStop(1, this.adjustColor(roofColor, 20));
    
    ctx.fillStyle = roofGradient;
    ctx.beginPath();
    ctx.moveTo(x - 5, y);
    ctx.lineTo(x + width/2, y - width/3);
    ctx.lineTo(x + width + 5, y);
    ctx.closePath();
    ctx.fill();
    
    // Add roof details
    ctx.strokeStyle = this.adjustColor(roofColor, -30);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + width/2, y - width/3);
    ctx.lineTo(x + width/2, y);
    ctx.stroke();
    
    // Draw windows with frames
    this.drawWindow(ctx, x + width * 0.15, y + height * 0.2, width * 0.3, height * 0.25);
    this.drawWindow(ctx, x + width * 0.55, y + height * 0.2, width * 0.3, height * 0.25);
    
    // Draw door with details
    this.drawDoor(ctx, x + width * 0.35, y + height * 0.5, width * 0.3, height * 0.5);
    
    ctx.restore();
  }
  
  drawTree(ctx, x, y, width, height, color) {
    // Save context for clipping
    ctx.save();
    
    // Draw shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(x, y, width * 0.6, width * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw trunk with gradient
    const trunkGradient = ctx.createLinearGradient(x - width/8, y - height/2, x + width/8, y);
    trunkGradient.addColorStop(0, '#5d2906');
    trunkGradient.addColorStop(1, '#8b4513');
    
    ctx.fillStyle = trunkGradient;
    ctx.fillRect(x - width/8, y - height/2, width/4, height/2);
    
    // Add some texture to the trunk
    ctx.strokeStyle = this.adjustColor('#5d2906', -10);
    ctx.lineWidth = 1;
    for (let i = 1; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(x - width/8, y - height/2 + (i * height/4));
      ctx.lineTo(x + width/8, y - height/2 + (i * height/4));
      ctx.stroke();
    }
    
    // Draw foliage with gradient and multiple layers
    const foliageBase = this.hexToRgb(color);
    
    // First, largest layer (back)
    const foliageGradient1 = ctx.createRadialGradient(
      x, y - height * 0.7, 0,
      x, y - height * 0.7, width/2 * 1.2
    );
    foliageGradient1.addColorStop(0, this.adjustColor(color, 30));
    foliageGradient1.addColorStop(1, this.adjustColor(color, -20));
    
    ctx.fillStyle = foliageGradient1;
    ctx.beginPath();
    ctx.ellipse(x, y - height * 0.7, width/2 * 1.2, height/3, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Second layer (middle)
    const foliageGradient2 = ctx.createRadialGradient(
      x, y - height * 0.7, 0,
      x, y - height * 0.7, width/2 * 0.8
    );
    foliageGradient2.addColorStop(0, this.adjustColor(color, 20));
    foliageGradient2.addColorStop(1, this.adjustColor(color, -10));
    
    ctx.fillStyle = foliageGradient2;
    ctx.beginPath();
    ctx.ellipse(x, y - height * 0.7, width/2 * 0.8, height/3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Third layer (top)
    const foliageGradient3 = ctx.createRadialGradient(
      x, y - height * 0.7, 0,
      x, y - height * 0.7, width/2 * 0.5
    );
    foliageGradient3.addColorStop(0, this.adjustColor(color, 40));
    foliageGradient3.addColorStop(1, this.adjustColor(color, 10));
    
    ctx.fillStyle = foliageGradient3;
    ctx.beginPath();
    ctx.ellipse(x, y - height * 0.7, width/2 * 0.5, height/4, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Add some highlights
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.ellipse(x + width/6, y - height * 0.75, width/4, height/8, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }
  
  // Helper method to adjust color brightness
  adjustColor(color, amount) {
    const clamp = (num) => Math.min(255, Math.max(0, num));
    
    // Convert hex to RGB
    let r, g, b;
    if (color.startsWith('#')) {
      const hex = color.substring(1);
      r = parseInt(hex.substring(0, 2), 16);
      g = parseInt(hex.substring(2, 4), 16);
      b = parseInt(hex.substring(4, 6), 16);
    } else if (color.startsWith('rgb')) {
      const rgb = color.match(/\d+/g);
      r = parseInt(rgb[0]);
      g = parseInt(rgb[1]);
      b = parseInt(rgb[2]);
    } else {
      return color; // Return as is if not hex or rgb
    }
    
    // Adjust brightness
    r = clamp(r + amount);
    g = clamp(g + amount);
    b = clamp(b + amount);
    
    return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
  }
  
  // Convert hex color to RGB object
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : {r: 0, g: 0, b: 0};
  }
  
  // Draw grass blades
  drawGrass(ctx, x, y, width, height, count) {
    ctx.save();
    ctx.strokeStyle = '#4cae4c';
    ctx.lineWidth = 1.5;
    
    for (let i = 0; i < count; i++) {
      const bladeX = x + (Math.random() * width);
      const bladeHeight = 5 + Math.random() * 15;
      const bladeY = y + (Math.random() * height * 0.2);
      const curve = 2 + Math.random() * 6;
      
      ctx.beginPath();
      ctx.moveTo(bladeX, bladeY);
      ctx.quadraticCurveTo(
        bladeX + (Math.random() - 0.5) * 10, 
        bladeY - bladeHeight * 0.5,
        bladeX + (Math.random() - 0.5) * curve, 
        bladeY - bladeHeight
      );
      ctx.stroke();
    }
    ctx.restore();
  }
  
  // Draw flowers
  drawFlowers(ctx, x, y, width, height, count) {
    ctx.save();
    
    for (let i = 0; i < count; i++) {
      const flowerX = x + (Math.random() * width);
      const flowerY = y + (Math.random() * height);
      const size = 2 + Math.random() * 3;
      const petalCount = 5 + Math.floor(Math.random() * 3) * 2; // 5, 7, or 9 petals
      
      // Draw stem
      ctx.strokeStyle = '#3a8a3a';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(flowerX, flowerY);
      ctx.quadraticCurveTo(
        flowerX + (Math.random() - 0.5) * 5,
        flowerY + 15,
        flowerX + (Math.random() - 0.5) * 3,
        flowerY + 30
      );
      ctx.stroke();
      
      // Draw petals
      const petalColor = `hsl(${Math.random() * 60 + 300}, 70%, 70%)`; // Pink/purple colors
      ctx.fillStyle = petalColor;
      
      for (let p = 0; p < petalCount; p++) {
        const angle = (p / petalCount) * Math.PI * 2;
        const petalSize = size * (0.8 + Math.random() * 0.4);
        const petalX = flowerX + Math.cos(angle) * (size * 1.5);
        const petalY = flowerY + Math.sin(angle) * (size * 1.5);
        
        ctx.beginPath();
        ctx.ellipse(petalX, petalY, petalSize, petalSize * 0.5, angle, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Draw center
      ctx.fillStyle = '#ffd700'; // Yellow center
      ctx.beginPath();
      ctx.arc(flowerX, flowerY, size * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore();
  }
  
  // Draw window with frame
  drawWindow(ctx, x, y, width, height) {
    // Window frame
    ctx.fillStyle = '#654321';
    ctx.fillRect(x, y, width, height);
    
    // Window glass with gradient
    const glassGradient = ctx.createLinearGradient(x, y, x + width, y + height);
    glassGradient.addColorStop(0, '#87ceeb');
    glassGradient.addColorStop(0.5, '#b0e0e6');
    glassGradient.addColorStop(1, '#87ceeb');
    
    ctx.fillStyle = glassGradient;
    ctx.fillRect(x + 2, y + 2, width - 4, height - 4);
    
    // Window cross
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 1;
    
    // Vertical line
    ctx.beginPath();
    ctx.moveTo(x + width/2, y + 2);
    ctx.lineTo(x + width/2, y + height - 2);
    ctx.stroke();
    
    // Horizontal line
    ctx.beginPath();
    ctx.moveTo(x + 2, y + height/2);
    ctx.lineTo(x + width - 2, y + height/2);
    ctx.stroke();
    
    // Highlight
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    
    // Top and left highlight
    ctx.beginPath();
    ctx.moveTo(x + 1, y + height - 2);
    ctx.lineTo(x + 1, y + 1);
    ctx.lineTo(x + width - 1, y + 1);
    ctx.stroke();
  }
  
  // Draw door with details
  drawDoor(ctx, x, y, width, height) {
    // Door frame
    ctx.fillStyle = '#5d2906';
    ctx.fillRect(x, y, width, height);
    
    // Door with gradient
    const doorGradient = ctx.createLinearGradient(x, y, x + width, y);
    doorGradient.addColorStop(0, '#5d2906');
    doorGradient.addColorStop(1, '#8b4513');
    
    ctx.fillStyle = doorGradient;
    ctx.fillRect(x + 2, y + 2, width - 4, height - 2);
    
    // Door knob
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(x + width - 10, y + height/2, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Door panel details
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 5, y + 5, width - 10, height - 10);
    
    // Highlight
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 1, y + height - 2);
    ctx.lineTo(x + 1, y + 1);
    ctx.lineTo(x + width - 1, y + 1);
    ctx.stroke();
  }
  
  drawBush(ctx, x, y, width, height, color) {
    // Save context for clipping
    ctx.save();
    
    // Draw shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.beginPath();
    ctx.ellipse(x, y + height * 0.8, width * 0.6, height * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw main bush shape with gradient
    const gradient = ctx.createRadialGradient(
      x, y, 0,
      x, y, Math.max(width, height)
    );
    gradient.addColorStop(0, this.adjustColor(color, 20));
    gradient.addColorStop(1, this.adjustColor(color, -20));
    
    ctx.fillStyle = gradient;
    
    // Draw multiple overlapping ellipses for a more natural look
    for (let i = 0; i < 3; i++) {
      const offsetX = (Math.random() - 0.5) * (width * 0.2);
      const offsetY = (Math.random() - 0.5) * (height * 0.2);
      const w = width * (0.8 + Math.random() * 0.4);
      const h = height * (0.8 + Math.random() * 0.4);
      
      ctx.beginPath();
      ctx.ellipse(x + offsetX, y + offsetY, w/2, h, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Add some highlights
    const highlightGradient = ctx.createRadialGradient(
      x - width/4, y - height/4, 0,
      x - width/4, y - height/4, width/2
    );
    highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
    highlightGradient.addColorStop(1, 'transparent');
    
    ctx.fillStyle = highlightGradient;
    ctx.beginPath();
    ctx.ellipse(x, y, width/2, height, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }
  
  drawSun() {
    // Pulsierender Effekt für die Sonne
    const pulse = 1 + Math.sin(this.sun.time) * this.sun.pulseAmount;
    
    // Speichere den aktuellen Canvas-Zustand
    this.ctx.save();
    
    // Passe die Position der Sonne an
    this.sun.x = this.sun.glow * 0.8; // Etwas mehr Platz auf der linken Seite
    this.sun.y = -this.sun.glow * 0.4; // Noch weiter oben positionieren
    
    // Erstelle einen Ausschnitt, der die Sonne und den Glow vollständig zeigt
    const clipX = 0; // Beginne am linken Rand
    const clipY = 0; // Beginne am oberen Rand
    const clipWidth = this.sun.x + this.sun.glow * 1.2; // Mehr Platz für den Glow
    const clipHeight = this.sun.glow * 2 * pulse;
    
    // Zeichne die Sonnenstrahlen (vor dem Clipping)
    const time = Date.now() * 0.001; // Langsamere Animation
    // Strahlen gehen jetzt 360 Grad um die Sonne herum
    const rayCount = 40; // Mehr Strahlen für den vollen Kreis
    const rayLength = this.sun.radius * 2.5 * pulse; // Etwas kürzere Strahlen für bessere Darstellung
    const startAngle = 0; // Startwinkel
    const endAngle = Math.PI * 2; // 360 Grad

    this.ctx.save();
    this.ctx.translate(this.sun.x, this.sun.y);
    const prevComp = this.ctx.globalCompositeOperation;
    this.ctx.globalCompositeOperation = 'lighter'; // additive für weiche Überlagerung

    for (let i = 0; i < rayCount; i++) {
      const t = i / (rayCount - 1);
      const angle = startAngle + t * (endAngle - startAngle) + Math.sin(time * 0.25 + i * 0.2) * 0.03;
      const rayPulse = 0.95 + Math.sin(time * 0.8 + i * 0.5) * 0.1;
      const width = 2.6 + Math.sin(time * 0.8 + i) * 1.2; // sichtbar breiter

      const gradient = this.ctx.createLinearGradient(0, 0, rayLength, 0);
      gradient.addColorStop(0, `rgba(255, 250, 210, ${0.22 * rayPulse})`);
      gradient.addColorStop(0.2, `rgba(255, 220, 150, ${0.16 * rayPulse})`);
      gradient.addColorStop(1, 'rgba(255, 170, 60, 0)');

      this.ctx.save();
      this.ctx.rotate(angle);
      this.ctx.beginPath();
      const innerR = this.sun.radius * 0.72;
      const outerR = innerR + rayLength * rayPulse;
      this.ctx.moveTo(innerR, 0);
      this.ctx.lineTo(outerR, -width);
      this.ctx.lineTo(outerR, width);
      this.ctx.closePath();
      this.ctx.fillStyle = gradient;
      this.ctx.fill();
      this.ctx.restore();
    }

    this.ctx.globalCompositeOperation = prevComp;
    this.ctx.restore();
    
    // Setze den Ausschnitt für den Rest der Sonne
    this.ctx.beginPath();
    this.ctx.rect(clipX, clipY, clipWidth, clipHeight);
    this.ctx.clip();
    
    // Äußere Glut der Sonne
    const outerGradient = this.ctx.createRadialGradient(
      this.sun.x, this.sun.y, 0,
      this.sun.x, this.sun.y, this.sun.glow
    );
    
    outerGradient.addColorStop(0, 'rgba(255, 230, 100, 0.9)');
    outerGradient.addColorStop(0.5, 'rgba(255, 180, 50, 0.6)');
    outerGradient.addColorStop(0.9, 'rgba(255, 120, 0, 0.2)');
    outerGradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
    
    this.ctx.beginPath();
    this.ctx.arc(
      this.sun.x, 
      this.sun.y, 
      this.sun.glow, 
      0, 
      Math.PI * 2
    );
    this.ctx.fillStyle = outerGradient;
    this.ctx.fill();
    
    // Mittlere Schicht der Sonne
    const middleGradient = this.ctx.createRadialGradient(
      this.sun.x, this.sun.y, 0,
      this.sun.x, this.sun.y, this.sun.glow * 0.7
    );
    
    middleGradient.addColorStop(0, 'rgba(255, 240, 180, 0.95)');
    middleGradient.addColorStop(0.7, 'rgba(255, 200, 80, 0.8)');
    middleGradient.addColorStop(1, 'rgba(255, 150, 0, 0)');
    
    this.ctx.beginPath();
    this.ctx.arc(
      this.sun.x, 
      this.sun.y, 
      this.sun.glow * 0.7, 
      0, 
      Math.PI * 2
    );
    this.ctx.fillStyle = middleGradient;
    this.ctx.fill();
    
    // Innerer Kern der Sonne
    const coreGradient = this.ctx.createRadialGradient(
      this.sun.x, this.sun.y, 0,
      this.sun.x, this.sun.y, this.sun.radius
    );
    
    coreGradient.addColorStop(0, '#FFF5D1');
    coreGradient.addColorStop(0.7, '#FFE066');
    coreGradient.addColorStop(1, '#FFA500');
    
    this.ctx.beginPath();
    this.ctx.arc(
      this.sun.x, 
      this.sun.y, 
      this.sun.radius, 
      0, 
      Math.PI * 2
    );
    
    // Füge einen inneren Glüheffekt hinzu
    this.ctx.shadowColor = 'rgba(255, 200, 100, 0.8)';
    this.ctx.shadowBlur = 40;
    this.ctx.fillStyle = coreGradient;
    this.ctx.fill();
    
    // Setze den Schatten zurück
    this.ctx.shadowBlur = 0;

    // Deutliche Corona-Bänder rund um den Kern
    const bands = 4;
    for (let i = 1; i <= bands; i++) {
      const r = this.sun.radius * (1.05 + i * 0.18);
      const alpha = 0.12 - i * 0.02;
      const stroke = this.ctx.createRadialGradient(this.sun.x, this.sun.y, r * 0.6, this.sun.x, this.sun.y, r);
      stroke.addColorStop(0, `rgba(255, 210, 120, ${alpha})`);
      stroke.addColorStop(1, 'rgba(255, 140, 40, 0)');
      this.ctx.beginPath();
      this.ctx.arc(this.sun.x, this.sun.y, r, 0, Math.PI * 2);
      this.ctx.strokeStyle = stroke;
      this.ctx.lineWidth = 6 - i; // nach außen dünner
      this.ctx.stroke();
    }
    
    // Stelle den ursprünglichen Canvas-Zustand wieder her
    this.ctx.restore();
  }
  
  destroy() {
    window.removeEventListener('resize', this.handleResize);
    if (this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
    if (this.foregroundCanvas && this.foregroundCanvas.parentNode) {
      this.foregroundCanvas.parentNode.removeChild(this.foregroundCanvas);
    }
    // Stoppe die Animation
    cancelAnimationFrame(this.animationFrame);
  }
}

// Funktion zur Initialisierung des Hintergrunds (nur >= 769px)
function initializeBackgroundGuarded() {
  // Instanz bereinigen, um sauberen Zustand sicherzustellen
  if (window.sunBackground) {
    window.sunBackground.destroy();
    window.sunBackground = null;
  }
  if (window.innerWidth >= 769) {
    window.sunBackground = new SunBackground();
  }
}

// Globale Initialisierungsfunktion
window.initializeBackground = function() {
  initializeBackgroundGuarded();
};

// Resize-Handling wie bei anderen Effekten: unter 769px zerstören, darüber (re)initialisieren
function handleBackgroundResize() {
  if (window.innerWidth >= 769) {
    if (!window.sunBackground) {
      initializeBackgroundGuarded();
    } else if (typeof window.sunBackground.handleResize === 'function') {
      window.sunBackground.handleResize();
    }
  } else if (window.sunBackground) {
    window.sunBackground.destroy();
    window.sunBackground = null;
  }
}

// Initialisierung beim Laden der Seite
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.initializeBackground();
    window.addEventListener('resize', handleBackgroundResize);
  });
} else {
  window.initializeBackground();
  window.addEventListener('resize', handleBackgroundResize);
}

// Initialisierung beim Zurücknavigieren
window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    // Kleine Verzögerung, um sicherzustellen, dass das DOM bereit ist
    setTimeout(window.initializeBackground, 10);
  }
});

// Aufräumen beim Verlassen der Seite
window.addEventListener('beforeunload', () => {
  if (window.sunBackground) {
    window.sunBackground.destroy();
  }
});
