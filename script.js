// Section Management System
// This system handles the creation, movement, and interactions of content sections.
// Think of sections as living entities that can be manipulated in 3D space.
function addSection(name) {
    // First, check if the section already exists - if so, we'll focus on it instead
    if (activeSections.includes(name)) {
        const section = document.getElementById(`section-${name}`);
        section.scrollIntoView({ behavior: 'smooth' });
        return;
    }

    // Add to our active sections array for state management
    activeSections.push(name);
    
    // Create the section with a unique identifier
    const section = document.createElement('div');
    section.className = 'section hardware-accelerated';
    section.id = `section-${name}`;
    section.draggable = true;
    
    // Generate the appropriate content for this section
    const content = generateSectionContent(name);
    
    // Build the section's HTML structure
    section.innerHTML = `
        <div class="section-header">
            <div class="drag-handle">⋮⋮</div>
            <h2>${name}</h2>
            <div class="section-controls">
                <button onclick="toggleFullscreen('${name}')" title="Fullscreen" class="fullscreen-btn">⛶</button>
                <button onclick="minimizeSection('${name}')" title="Minimize" class="minimize-btn">−</button>
                <button onclick="closeSection('${name}')" title="Close" class="close-btn">×</button>
            </div>
        </div>
        <div class="section-content">
            ${content}
        </div>
    `;

    // Set up all the interactive behaviors
    setupSectionInteractions(section);
    
    // Add the section to our main content area
    document.getElementById('mainContent').appendChild(section);
    
    // Apply any saved scale settings
    const savedScale = localStorage.getItem('contentScale');
    if (savedScale) {
        section.querySelector('.section-content').style.fontSize = `${savedScale}rem`;
    }
    
    // Update our navigation and state
    updateSectionOrder();
    updateSlider();
    
    // Ensure the new section is visible
    section.scrollIntoView({ behavior: 'smooth' });
    
    // Check for any spatial conflicts
    checkCollision();
    
    // Update theme color based on the new section
    updateThemeColor(name);

    // Save our current state
    saveSectionState();
}

// Corner Resize System
// This is our unique scaling mechanism that allows users to dynamically
// adjust content size and layout using the corner dot
function setupCornerResize() {
    const corner = document.getElementById('cornerResize');
    const header = document.querySelector('header');
    const sidebar = document.querySelector('.sidebar');
    const main = document.getElementById('mainContent');
    let isResizing = false;
    let startX, startY, startScale;

    // Set up both mouse and touch interactions
    corner.addEventListener('mousedown', startResize);
    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', stopResize);

    corner.addEventListener('touchstart', (e) => {
        e.preventDefault();
        startResize(e.touches[0]);
    });

    document.addEventListener('touchmove', (e) => {
        if (isResizing) {
            e.preventDefault();
            handleResize(e.touches[0]);
        }
    });

    document.addEventListener('touchend', stopResize);

    function startResize(e) {
        isResizing = true;
        corner.classList.add('active');
        document.body.classList.add('resizing');

        // Store initial positions for smooth transitions
        startX = e.clientX;
        startY = e.clientY;
        startScale = getCurrentScale();

        // Capture current dimensions for reference
        captureInitialDimensions();
    }

    function handleResize(e) {
        if (!isResizing) return;
        
        // Use requestAnimationFrame for smooth performance
        requestAnimationFrame(() => {
            // Calculate new dimensions based on cursor position
            const sidebarWidth = Math.max(200, Math.min(500, e.clientX));
            const headerHeight = Math.max(50, Math.min(200, e.clientY));
            
            // Calculate scale based on movement in both axes
            const scaleX = e.clientX / window.innerWidth;
            const scaleY = e.clientY / window.innerHeight;
            const scale = Math.max(0.8, Math.min(2.0, (scaleX + scaleY) / 1.5));
            
            // Update our CSS variables for responsive scaling
            document.documentElement.style.setProperty('--content-scale', `${scale}rem`);
            document.documentElement.style.setProperty('--content-height', `${headerHeight * 2}px`);
            document.documentElement.style.setProperty('--sidebar-width', `${sidebarWidth}px`);
            document.documentElement.style.setProperty('--header-height', `${headerHeight}px`);

            // Apply transforms for better performance
            applyLayoutTransforms({
                sidebar,
                header,
                main,
                corner,
                sidebarWidth,
                headerHeight,
                scale
            });

            // Update content sizes throughout the interface
            updateContentSizes(scale);

            // Save our layout settings
            saveLayoutState({
                scale,
                headerHeight,
                sidebarWidth
            });

            // Check for any spatial conflicts
            checkCollision();
        });
    }

    function stopResize() {
        if (!isResizing) return;
        
        isResizing = false;
        corner.classList.remove('active');
        document.body.classList.remove('resizing');

        // Apply a smooth transition after resize
        smoothTransition();
    }
}

// Layout Transform System
// This system handles the actual visual updates when resizing content
function applyLayoutTransforms({ sidebar, header, main, corner, sidebarWidth, headerHeight, scale }) {
    // Use hardware-accelerated transforms for smooth performance
    sidebar.style.transform = `translate3d(0, ${headerHeight}px, 0)`;
    sidebar.style.width = `${sidebarWidth}px`;
    
    header.style.height = `${headerHeight}px`;
    
    main.style.transform = `translate3d(${sidebarWidth}px, ${headerHeight}px, 0)`;
    
    corner.style.transform = `translate3d(${sidebarWidth}px, ${headerHeight}px, 0)`;

    // Update font sizes with GPU acceleration
    header.style.fontSize = `${scale}rem`;
    document.querySelector('.logo-container').style.fontSize = `${scale * 1.5}rem`;
    sidebar.style.fontSize = `${scale}rem`;
}

// Content Size Management
// This ensures all content scales proportionally and smoothly
function updateContentSizes(scale) {
    // Update all scalable content elements
    document.querySelectorAll('.section-content, .header-nav, .dropdown-content, .sidebar-section').forEach(el => {
        el.style.fontSize = `${scale}rem`;
        
        // For section content, adjust padding proportionally
        if (el.classList.contains('section-content')) {
            const padding = Math.round(20 * scale);
            el.style.padding = `${padding}px`;
        }
    });

    // Update section dimensions while maintaining proportions
    document.querySelectorAll('.section').forEach(section => {
        if (section.dataset.initialRect) {
            const initialRect = JSON.parse(section.dataset.initialRect);
            section.style.width = `${initialRect.width * scale}px`;
            section.style.minHeight = `${initialRect.height * scale}px`;
        }
    });
}