// First, we establish our core state management system. Think of this as the 
// brain of our interface, keeping track of what's happening across all interactions.
let activeSections = [];
let draggedSection = null;
let isDragging = false;

// Each section has its own character, expressed through color. These colors create
// a visual language that helps users understand the purpose of each area.
const sectionColors = {
    'Creates': '#ff6b6b',    // Warm, energetic red for creative activities
    'Curates': '#4ecdc4',    // Cool, calming teal for curated content
    'Connects': '#95a5a6',   // Neutral, connecting gray for community features
    'Latest': '#ffd93d',     // Bright, attention-grabbing yellow for new content
    'Menu': '#ff8b94',       // Soft pink for food and drink
    'By Day': '#6c5ce7',     // Deep purple for daytime activities
    'By Night': '#fdcb6e',   // Warm orange for evening events
    'Events': '#ff7675'      // Vibrant coral for special occasions
};

// When the page loads, we initialize all our interactive systems. Each system 
// works together to create a cohesive experience.
document.addEventListener('DOMContentLoaded', () => {
    setupCornerResize();     // Our unique scaling mechanism
    setupNavBox();           // The floating navigation system
    setupHeaderIcons();      // Interactive circular icons
    setupSectionSystem();    // Content management
    
    // Restore any previous state the user might have created
    restoreState();
});

// The corner resize system lets users scale content naturally, as if they were
// pulling on the corner of a sheet of paper.
function setupCornerResize() {
    const corner = document.getElementById('cornerResize');
    const header = document.querySelector('header');
    const sidebar = document.querySelector('.sidebar');
    const main = document.getElementById('mainContent');
    let isResizing = false;
    let startX, startY, startScale;

    // We handle both mouse and touch interactions for broad device support
    corner.addEventListener('mousedown', startResize);
    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', stopResize);
    corner.addEventListener('touchstart', (e) => {
        e.preventDefault();
        startResize(e.touches[0]);
    });

    function startResize(e) {
        isResizing = true;
        corner.classList.add('active');
        document.body.classList.add('resizing');

        // Store initial positions for smooth scaling
        startX = e.clientX;
        startY = e.clientY;
        startScale = getCurrentScale();
    }

    function handleResize(e) {
        if (!isResizing) return;
        
        // Use requestAnimationFrame for smooth performance
        requestAnimationFrame(() => {
            // Calculate new dimensions based on cursor position
            const sidebarWidth = Math.max(200, Math.min(500, e.clientX));
            const headerHeight = Math.max(50, Math.min(200, e.clientY));
            
            // Calculate scale based on cursor position relative to window size
            const scaleX = e.clientX / window.innerWidth;
            const scaleY = e.clientY / window.innerHeight;
            const scale = Math.max(0.8, Math.min(2.0, (scaleX + scaleY) / 1.5));
            
            // Update our CSS variables that control the layout
            document.documentElement.style.setProperty('--content-scale', `${scale}rem`);
            document.documentElement.style.setProperty('--header-height', `${headerHeight}px`);
            document.documentElement.style.setProperty('--sidebar-width', `${sidebarWidth}px`);

            // Apply transforms for better performance
            updateLayout(sidebarWidth, headerHeight, scale);
        });
    }

    function stopResize() {
        if (!isResizing) return;
        isResizing = false;
        corner.classList.remove('active');
        document.body.classList.remove('resizing');
        saveState();
    }
}

// The navigation box is our innovative way to manage sections. It's like a physical
// control panel that can be moved around the interface.
function setupNavBox() {
    const nav = document.getElementById('sectionSlider');
    let isDragging = false;
    let currentX, currentY, initialX, initialY;
    let xOffset = 0, yOffset = 0;

    nav.addEventListener('mousedown', startDrag);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDrag);

    function startDrag(e) {
        initialX = e.clientX - xOffset;
        initialY = e.clientY - yOffset;
        
        if (e.target === nav) {
            isDragging = true;
            nav.classList.add('dragging');
        }
    }

    function drag(e) {
        if (!isDragging) return;
        e.preventDefault();

        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
        xOffset = currentX;
        yOffset = currentY;

        // Keep nav box within viewport bounds
        const maxX = window.innerWidth - nav.offsetWidth;
        const maxY = window.innerHeight - nav.offsetHeight;
        
        xOffset = Math.min(Math.max(0, xOffset), maxX);
        yOffset = Math.min(Math.max(0, yOffset), maxY);

        nav.style.transform = `translate(${xOffset}px, ${yOffset}px)`;
        updateProximityEffects();
    }

    function stopDrag() {
        isDragging = false;
        nav.classList.remove('dragging');
        saveNavPosition();
    }
}

// The proximity system creates a spatial relationship between the nav box and content.
// It's like creating gravity wells that affect nearby content.
function updateProximityEffects() {
    const nav = document.getElementById('sectionSlider');
    const sections = document.querySelectorAll('.section');
    const navRect = nav.getBoundingClientRect();

    sections.forEach(section => {
        const rect = section.getBoundingClientRect();
        const distance = getDistance(navRect, rect);
        
        if (distance < 300) {
            const effect = 1 - (distance / 300);
            section.style.transform = `scale(${1 + effect * 0.05})`;
            section.style.zIndex = Math.floor(1000 * effect);
        } else {
            section.style.transform = '';
            section.style.zIndex = '';
        }
    });
}

// Our header icons system provides quick access to key functions while maintaining
// visual harmony with the rest of the interface.
function setupHeaderIcons() {
    const icons = document.querySelectorAll('.icon-button');
    
    icons.forEach(icon => {
        icon.addEventListener('mouseenter', () => {
            icon.style.transform = 'scale(1.1)';
        });
        
        icon.addEventListener('mouseleave', () => {
            icon.style.transform = 'scale(1)';
        });
        
        icon.addEventListener('click', () => {
            handleIconClick(icon.getAttribute('title'));
        });
    });
}

// State management ensures user preferences and layouts persist between visits
function saveState() {
    const state = {
        scale: getComputedStyle(document.documentElement).getPropertyValue('--content-scale'),
        headerHeight: getComputedStyle(document.documentElement).getPropertyValue('--header-height'),
        sidebarWidth: getComputedStyle(document.documentElement).getPropertyValue('--sidebar-width'),
        sections: activeSections,
        navPosition: {
            x: xOffset,
            y: yOffset
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
        
        // Only restore if saved within last 24 hours
        if (Date.now() - state.timestamp > 24 * 60 * 60 * 1000) {
            localStorage.removeItem('interfaceState');
            return;
        }
        
        // Apply saved state
        document.documentElement.style.setProperty('--content-scale', state.scale);
        document.documentElement.style.setProperty('--header-height', state.headerHeight);
        document.documentElement.style.setProperty('--sidebar-width', state.sidebarWidth);
        
        // Restore sections
        state.sections.forEach(section => addSection(section));
        
        // Restore nav position
        const nav = document.getElementById('sectionSlider');
        nav.style.transform = `translate(${state.navPosition.x}px, ${state.navPosition.y}px)`;
        
    } catch (error) {
        console.warn('Error restoring state:', error);
    }
}