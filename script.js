// Navigation Dot System
// Our navigation system reimagines how users interact with web content by creating
// a physical metaphor for content management. Think of it as a control panel that
// can float anywhere in the interface, maintaining a spatial relationship with content.
function setupNavBoxDrag() {
    const slider = document.getElementById('sectionSlider');
    let isDragging = false;
    let currentX, currentY, initialX, initialY;
    let xOffset = 0;
    let yOffset = 0;
    let draggedDot = null;

    // We support both touch and mouse interactions to ensure a consistent
    // experience across all devices
    slider.addEventListener('touchstart', dragStart, { passive: true });
    document.addEventListener('touchmove', drag, { passive: false });
    document.addEventListener('touchend', dragEnd);
    slider.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);

    // Section dots can be reordered through drag and drop, creating an
    // intuitive way to organize content
    function setupDotDragging() {
        document.querySelectorAll('.slider-dot').forEach(dot => {
            dot.draggable = true;
            
            // When starting to drag a dot, we create a ghost image that follows
            // the cursor, providing visual feedback
            dot.addEventListener('dragstart', (e) => {
                draggedDot = dot;
                dot.classList.add('dragging');
                e.stopPropagation();
                
                // Create a ghost image for drag feedback
                const ghost = dot.cloneNode(true);
                ghost.style.position = 'absolute';
                ghost.style.opacity = '0';
                document.body.appendChild(ghost);
                e.dataTransfer.setDragImage(ghost, 0, 0);
                setTimeout(() => ghost.remove(), 0);
            });

            dot.addEventListener('dragend', (e) => {
                dot.classList.remove('dragging');
                draggedDot = null;
                e.stopPropagation();
                saveNavOrder();
            });

            // During drag, we calculate positions and update the visual order
            dot.addEventListener('dragover', (e) => {
                e.preventDefault();
                if (!draggedDot || draggedDot === dot) return;

                const rect = dot.getBoundingClientRect();
                const mouseY = e.clientY;
                const midpoint = rect.top + rect.height / 2;

                // Insert the dragged dot based on mouse position
                if (mouseY < midpoint) {
                    if (draggedDot.nextSibling !== dot) {
                        slider.insertBefore(draggedDot, dot);
                    }
                } else {
                    if (draggedDot.previousSibling !== dot) {
                        slider.insertBefore(draggedDot, dot.nextSibling);
                    }
                }

                // Synchronize the main content order with dot order
                synchronizeSectionOrder();
                updateProximityEffects();
            });
        });
    }

    // When dragging begins, we store initial positions and update visual state
    function dragStart(e) {
        if (e.target.closest('.slider-dot')) return;
        
        const evt = e.type === 'touchstart' ? e.touches[0] : e;
        initialX = evt.clientX - xOffset;
        initialY = evt.clientY - yOffset;

        if (e.target === slider) {
            isDragging = true;
            slider.classList.add('dragging');
        }
    }

    // During drag, we calculate new positions and apply transforms
    function drag(e) {
        if (!isDragging) return;
        e.preventDefault();

        const evt = e.type === 'touchmove' ? e.touches[0] : e;
        currentX = evt.clientX - initialX;
        currentY = evt.clientY - initialY;

        xOffset = currentX;
        yOffset = currentY;

        // Apply the new position with boundary checking
        updateNavBoxPosition(currentX, currentY);
        
        // Update content based on nav box position
        handleProximityEffects();
    }

    function dragEnd() {
        if (!isDragging) return;
        
        isDragging = false;
        slider.classList.remove('dragging');
        
        // Save the final position for persistence
        saveNavPosition();
        
        // Trigger final layout updates
        updateLayout();
    }

    // This function ensures the nav box stays within viewport bounds while
    // maintaining smooth movement
    function updateNavBoxPosition(x, y) {
        const box = slider.getBoundingClientRect();
        const maxX = window.innerWidth - box.width;
        const maxY = window.innerHeight - box.height;
        
        // Allow slight overflow for smoother interaction
        x = Math.min(Math.max(-20, x), maxX + 40);
        y = Math.min(Math.max(-20, y), maxY + 40);
        
        // Use transform for better performance
        slider.style.transform = `translate3d(${x}px, ${y}px, 0)`;

        // Calculate and update proximity effects
        updateProximityEffects();
    }

    // This system creates a spatial relationship between the nav box
    // and content sections
    function updateProximityEffects() {
        const navRect = slider.getBoundingClientRect();
        const sections = document.querySelectorAll('.section:not(.is-fullscreen)');
        
        sections.forEach(section => {
            const sectionRect = section.getBoundingClientRect();
            const distance = calculateDistance(navRect, sectionRect);
            
            if (distance < 300) {
                // Apply proximity-based transformations
                applyProximityEffect(section, distance);
            } else {
                // Reset to default state
                resetSectionState(section);
            }
        });
    }

    // Calculate the spatial relationship between elements
    function calculateDistance(rect1, rect2) {
        const dx = (rect1.left + rect1.right) / 2 - (rect2.left + rect2.right) / 2;
        const dy = (rect1.top + rect1.bottom) / 2 - (rect2.top + rect2.bottom) / 2;
        return Math.sqrt(dx * dx + dy * dy);
    }

    // Apply visual effects based on proximity
    function applyProximityEffect(section, distance) {
        const effect = 1 - Math.max(0, Math.min(1, distance / 300));
        const scale = 1 + (effect * 0.05);
        const blur = effect * 5;
        
        section.style.transform = `scale(${scale})`;
        section.style.filter = `blur(${blur}px)`;
        section.style.zIndex = Math.floor(1000 * effect);
    }

    // Reset section to its default state
    function resetSectionState(section) {
        section.style.transform = '';
        section.style.filter = '';
        section.style.zIndex = '';
    }

    // Maintain state persistence
    function saveNavPosition() {
        localStorage.setItem('navBoxPosition', JSON.stringify({
            x: xOffset,
            y: yOffset,
            timestamp: Date.now()
        }));
    }

    // Initialize drag ordering
    setupDotDragging();

    // Restore previous position if available
    restoreNavPosition();
}