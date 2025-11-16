document.addEventListener('DOMContentLoaded', function() {
    // Function to handle image loading
    function loadImages() {
        const images = document.querySelectorAll('.tile-image');
        
        images.forEach(img => {
            // Create container if it doesn't exist
            if (!img.parentElement.classList.contains('tile-image-container')) {
                const container = document.createElement('div');
                container.className = 'tile-image-container';
                img.parentNode.insertBefore(container, img);
                container.appendChild(img);
                
                // Create and append placeholder
                const placeholder = document.createElement('div');
                placeholder.className = 'image-placeholder';
                container.appendChild(placeholder);
                
                // When image loads
                img.onload = function() {
                    img.classList.add('loaded');
                    placeholder.style.display = 'none';
                };
                
                // If image fails to load
                img.onerror = function() {
                    console.error('Failed to load image:', img.src);
                    placeholder.style.display = 'none';
                };
                
                // Trigger image loading
                if (img.complete) {
                    img.dispatchEvent(new Event('load'));
                }
            }
        });
    }
    
    // Run on page load
    loadImages();
});
