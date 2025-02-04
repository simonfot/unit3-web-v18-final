// Continuing our JavaScript implementation with section management
// Think of sections like physical cards that can be moved, scaled, and arranged
// in space. Each section maintains awareness of its surroundings and responds
// to both direct manipulation and proximity effects.

// Section Management System
function addSection(name) {
    // First, check if section already exists - if so, we'll focus on it
    if (activeSections.includes(name)) {
        const section = document.getElementById(`section-${name}`);
        section.scrollIntoView({ behavior: 'smooth' });
        return;
    }

    // Add to our active sections array
    activeSections.push(name);
    
    // Create the section container - like laying down a new card
    const section = document.createElement('div');
    section.className = 'section';
    section.id = `section-${name}`;
    section.draggable = true;
    
    // Add the section's content
    section.innerHTML = `
        <div class="section-header" style="color: ${sectionColors[name] || '#fff'}">
            <div class="drag-handle">⋮⋮</div>
            <h2>${name}</h2>
            <div class="section-controls">
                <button onclick="toggleFullscreen('${name}')" class="fullscreen-btn">⛶</button>
                <button onclick="minimizeSection('${name}')" class="minimize-btn">−</button>
                <button onclick="closeSection('${name}')" class="close-btn">×</button>
            </div>
        </div>
        <div class="section-content">
            ${generateContent(name)}
        </div>
    `;

    // Set up the section's interactive behaviors
    setupSectionInteractions(section);
    
    // Add to main content area with a smooth entrance
    const main = document.getElementById('mainContent');
    main.appendChild(section);
    
    // Create navigation dot for this section
    addNavigationDot(name);
    
    // Ensure the new section is visible
    section.scrollIntoView({ behavior: 'smooth' });
    
    // Update our spatial system
    updateSpatialRelationships();
    saveState();
}

// Navigation Dot System
// This is our innovative way to manage sections - think of it like a physical
// control panel that can be moved around the interface
function addNavigationDot(name) {
    const slider = document.getElementById('sectionSlider');
    const dot = document.createElement('div');
    dot.className = 'slider-dot';
    dot.setAttribute('data-section', name);
    
    // Create the dot's visual structure
    dot.innerHTML = `
        <div class="dot-content">
            <span class="dot-label">${name}</span>
            <span class="dot-circle"></span>
        </div>
    `;

    // Set up dot interactions
    setupDotInteractions(dot, name);
    
    // Add to slider with smooth animation
    dot.style.opacity = '0';
    slider.appendChild(dot);
    requestAnimationFrame(() => {
        dot.style.transition = 'opacity 0.3s ease';
        dot.style.opacity = '1';
    });
}

// Spatial Awareness System
// This creates the feeling that elements are aware of each other in space
function updateSpatialRelationships() {
    const nav = document.getElementById('sectionSlider');
    const navRect = nav.getBoundingClientRect();
    const sections = document.querySelectorAll('.section');

    sections.forEach(section => {
        const rect = section.getBoundingClientRect();
        const distance = calculateDistance(navRect, rect);

        // Apply proximity effects with smooth transitions
        const proximityEffect = Math.max(0, 1 - (distance / 300));
        
        // Use transform for better performance
        section.style.transform = proximityEffect > 0 
            ? `scale(${1 + proximityEffect * 0.05})`
            : '';
            
        // Update visual feedback
        section.style.setProperty('--proximity', proximityEffect);
    });
}

// Drag and Drop System
// This makes sections feel like physical objects that can be picked up and moved
function setupSectionInteractions(section) {
    let initialX, initialY, currentX, currentY;
    let dragStarted = false;

    section.addEventListener('mousedown', startDrag);
    section.addEventListener('mousemove', drag);
    section.addEventListener('mouseup', stopDrag);
    section.addEventListener('mouseleave', stopDrag);

    // Touch support for mobile devices
    section.addEventListener('touchstart', e => {
        const touch = e.touches[0];
        startDrag({ clientX: touch.clientX, clientY: touch.clientY });
    });

    function startDrag(e) {
        if (e.target.closest('.section-controls')) return;
        
        initialX = e.clientX - section.offsetLeft;
        initialY = e.clientY - section.offsetTop;
        dragStarted = true;
        
        section.classList.add('dragging');
        updateZIndex();
    }

    function drag(e) {
        if (!dragStarted) return;

        e.preventDefault();
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;

        // Use transform for smooth movement
        section.style.transform = `translate(${currentX}px, ${currentY}px)`;
        
        // Check for edge snapping
        checkEdgeSnapping(section, currentX, currentY);
        
        // Update spatial relationships
        updateSpatialRelationships();
    }

    function stopDrag() {
        if (!dragStarted) return;
        
        dragStarted = false;
        section.classList.remove('dragging');
        
        // Save the final position
        saveSectionPosition(section);
    }
}

// Edge Snapping System
// This helps sections align with screen edges and each other
function checkEdgeSnapping(section, x, y) {
    const rect = section.getBoundingClientRect();
    const snapDistance = 20;
    
    // Check screen edges
    if (rect.left < snapDistance) {
        section.style.transform = `translate(0px, ${y}px)`;
    }
    if (rect.right > window.innerWidth - snapDistance) {
        section.style.transform = `translate(${window.innerWidth - rect.width}px, ${y}px)`;
    }
    
    // Check other sections for alignment
    document.querySelectorAll('.section').forEach(other => {
        if (other === section) return;
        
        const otherRect = other.getBoundingClientRect();
        
        // Vertical alignment
        if (Math.abs(rect.left - otherRect.left) < snapDistance) {
            section.style.transform = `translate(${otherRect.left}px, ${y}px)`;
        }
    });
}

// Animation Management
// This ensures all movement in the interface feels smooth and natural
function setupAnimationSystem() {
    // Use requestAnimationFrame for smooth performance
    let ticking = false;
    
    document.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                updateSpatialRelationships();
                ticking = false;
            });
            ticking = true;
        }
    });

    // Smooth transitions for section changes
    const transitionSection = (section, entering) => {
        section.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        section.style.opacity = entering ? '1' : '0';
        section.style.transform = entering 
            ? 'scale(1) translate(0, 0)'
            : 'scale(0.95) translate(0, 10px)';
            
        setTimeout(() => {
            section.style.transition = '';
        }, 300);
    };

    return { transitionSection };
}

// State Persistence System
// This remembers how the user has arranged their space
function saveSectionPosition(section) {
    const positions = JSON.parse(localStorage.getItem('sectionPositions') || '{}');
    
    positions[section.id] = {
        transform: section.style.transform,
        timestamp: Date.now()
    };
    
    localStorage.setItem('sectionPositions', JSON.stringify(positions));
}

// Initialize all our systems when the page loads
const { transitionSection } = setupAnimationSystem();

// Export key functions for use in HTML event handlers
window.addSection = addSection;
window.toggleFullscreen = toggleFullscreen;
window.minimizeSection = minimizeSection;
window.closeSection = closeSection;