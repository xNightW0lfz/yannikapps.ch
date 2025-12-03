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