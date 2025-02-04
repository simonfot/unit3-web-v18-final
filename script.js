// UNIT3 Interface - Complete JavaScript Implementation
// This system creates a fluid, spatial interface where content feels physical and 
// responsive. Think of it like arranging papers on a desk - each piece knows where
// it is in space and responds naturally to interaction.

// Core State Management
let activeSections = [];
let draggedSection = null;
let isDragging = false;
let cornerDragging = false;
let navDragging = false;

// Theme colors give each section its own character while maintaining
// visual harmony across the interface
const sectionColors = {
    'Creates': '#ff6b6b',    // Warm, energetic red
    'Curates': '#4ecdc4',    // Cool, calming teal
    'Connects': '#95a5a6',   // Neutral, connecting gray
    'Latest': '#ffd93d',     // Bright, attention-grabbing yellow
    'Menu': '#ff8b94',       // Soft pink for food and drink
    'By Day': '#6c5ce7',     // Deep purple for daytime
    'By Night': '#fdcb6e',   // Warm orange for evening
    'Events': '#ff7675',     // Vibrant coral
    'Directory': '#a8e6cf',  // Fresh mint
    'Zine': '#81ecec',       // Bright aqua
    'Opportunities': '#ffeaa7' // Light yellow
};

// When the page loads, we initialize all our systems in a specific order
document.addEventListener('DOMContentLoaded', () => {
    initializeInterface();
    restoreState();
});

function initializeInterface() {
    setupCornerResize();
    setupNavBox();
    setupSectionSystem();
    setupHeaderIcons();
    setupAnimationSystem();
    
    // Open Latest section by default if no saved state
    if (activeSections.length === 0) {
        setTimeout(() => addSection('Latest'), 100);
    }
}

// Corner Resize System
// This unique interaction lets users scale content intuitively
function setupCornerResize() {
    const corner = document.getElementById('cornerResize');
    const header = document.querySelector('header');
    const sidebar = document.querySelector('.sidebar');
    const main = document.getElementById('mainContent');
    
    function handleResize(e) {
        if (!cornerDragging) return;
        
        requestAnimationFrame(() => {
            const sidebarWidth = Math.max(200, Math.min(500, e.clientX));
            const headerHeight = Math.max(50, Math.min(200, e.clientY));
            const scale = calculateScale(e.clientX, e.clientY);
            
            updateLayout(sidebarWidth, headerHeight, scale);
            updateAllContent(scale);
        });
    }

    function calculateScale(x, y) {
        const scaleX = x / window.innerWidth;
        const scaleY = y / window.innerHeight;
        return Math.max(0.8, Math.min(2.0, (scaleX + scaleY) / 1.5));
    }

    function updateLayout(width, height, scale) {
        document.documentElement.style.setProperty('--content-scale', `${scale}rem`);
        document.documentElement.style.setProperty('--header-height', `${height}px`);
        document.documentElement.style.setProperty('--sidebar-width', `${width}px`);
        
        // Use transforms for better performance
        sidebar.style.transform = `translate3d(0, ${height}px, 0)`;
        main.style.transform = `translate3d(${width}px, ${height}px, 0)`;
        corner.style.transform = `translate3d(${width}px, ${height}px, 0)`;
    }

    // Event listeners with pointer capture for reliable dragging
    corner.addEventListener('mousedown', startResize);
    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', stopResize);

    // Touch support
    corner.addEventListener('touchstart', e => {
        e.preventDefault();
        startResize(e.touches[0]);
    });
}

// Section Management System
// Handles the creation, movement, and lifecycle of content sections
function setupSectionSystem() {
    const mainContent = document.getElementById('mainContent');
    
    function createSection(name) {
        const section = document.createElement('div');
        section.className = 'section';
        section.id = `section-${name}`;
        
        section.innerHTML = `
            <div class="section-header">
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

        setupSectionInteractions(section);
        return section;
    }

    // Rich content generation for each section type
    function generateContent(name) {
        const templates = {
            'Latest': `
                <div class="latest-content">
                    <h3>Latest Updates</h3>
                    <div class="updates-grid">
                        <div class="update-card">
                            <h4>Recent News</h4>
                            <p>Stay updated with our latest events and community news</p>
                        </div>
                        <div class="update-card">
                            <h4>Coming Up</h4>
                            <p>Preview upcoming exhibitions and special events</p>
                        </div>
                    </div>
                </div>
            `,
            'Menu': `
                <div class="menu-content">
                    <h3>Daily Menu</h3>
                    <div class="menu-grid">
                        <div class="menu-category">
                            <h4>Coffee</h4>
                            <div class="menu-item">
                                <span>Espresso</span>
                                <span>£2.50</span>
                            </div>
                            <div class="menu-item">
                                <span>Filter Coffee</span>
                                <span>£2.80</span>
                            </div>
                        </div>
                        <div class="menu-category">
                            <h4>Food</h4>
                            <div class="menu-item">
                                <span>Daily Sandwich</span>
                                <span>£6.50</span>
                            </div>
                            <div class="menu-item">
                                <span>House Salad</span>
                                <span>£5.50</span>
                            </div>
                        </div>
                    </div>
                </div>
            `
            // Add more section templates as needed
        };

        return templates[name] || `
            <div class="placeholder-content">
                <h3>${name}</h3>
                <p>Content for ${name} is being developed...</p>
            </div>
        `;
    }
}

// Navigation System
// Our innovative floating nav box that maintains spatial awareness
function setupNavBox() {
    const slider = document.getElementById('sectionSlider');
    let navX = 0, navY = 0;

    function updateNavPosition(x, y) {
        // Keep nav box within viewport
        const maxX = window.innerWidth - slider.offsetWidth;
        const maxY = window.innerHeight - slider.offsetHeight;
        
        navX = Math.max(0, Math.min(x, maxX));
        navY = Math.max(0, Math.min(y, maxY));
        
        slider.style.transform = `translate3d(${navX}px, ${navY}px, 0)`;
        updateProximityEffects();
    }

    function updateProximityEffects() {
        const sections = document.querySelectorAll('.section:not(.is-fullscreen)');
        const navRect = slider.getBoundingClientRect();

        sections.forEach(section => {
            const rect = section.getBoundingClientRect();
            const distance = calculateDistance(navRect, rect);
            applyProximityEffect(section, distance);
        });
    }

    // Event handlers with smooth animation
    slider.addEventListener('mousedown', e => {
        if (e.target.closest('.slider-dot')) return;
        navDragging = true;
        slider.classList.add('dragging');
    });

    document.addEventListener('mousemove', e => {
        if (!navDragging) return;
        updateNavPosition(e.clientX - slider.offsetWidth / 2, e.clientY - slider.offsetHeight / 2);
    });

    document.addEventListener('mouseup', () => {
        if (!navDragging) return;
        navDragging = false;
        slider.classList.remove('dragging');
        saveState();
    });
}

// Animation System
// Ensures smooth, performant transitions throughout the interface
function setupAnimationSystem() {
    // Use requestAnimationFrame for smooth animations
    let frameId;

    function animate(timestamp) {
        updatePositions();
        frameId = requestAnimationFrame(animate);
    }

    function updatePositions() {
        if (cornerDragging || navDragging) {
            updateProximityEffects();
        }
    }

    // Start animation loop
    frameId = requestAnimationFrame(animate);

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        cancelAnimationFrame(frameId);
    });
}

// State Management
// Remembers user preferences and layout between visits
function saveState() {
    const state = {
        sections: activeSections,
        navPosition: { x: navX, y: navY },
        scale: getCurrentScale(),
        layout: {
            headerHeight: getComputedStyle(document.documentElement).getPropertyValue('--header-height'),
            sidebarWidth: getComputedStyle(document.documentElement).getPropertyValue('--sidebar-width')
        },
        timestamp: Date.now()
    };
    
    localStorage.setItem('interfaceState', JSON.stringify(state));
}

function restoreState() {
    try {
        const saved = localStorage.getItem('interfaceState');
        if (!saved) return;
        
        const state = JSON.parse(saved);
        if (Date.now() - state.timestamp > 24 * 60 * 60 * 1000) {
            localStorage.removeItem('interfaceState');
            return;
        }
        
        restoreLayout(state);
        restoreSections(state);
        updateNavPosition(state.navPosition.x, state.navPosition.y);
    } catch (error) {
        console.warn('Error restoring state:', error);
    }
}

// Initialize the interface
initializeInterface();

// Export functions needed for HTML event handlers
window.addSection = addSection;
window.toggleFullscreen = toggleFullscreen;
window.minimizeSection = minimizeSection;
window.closeSection = closeSection;