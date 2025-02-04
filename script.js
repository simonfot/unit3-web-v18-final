// First, we establish our core state management system. This handles the active sections
// and their states throughout the application lifecycle.
let activeSections = [];
let draggedSection = null;
let isDragging = false;

// Theme colors are defined for each section, creating a cohesive visual system that
// reflects the nature of each content area
const sectionColors = {
    'Creates': '#ff6b6b',    // Warm, energetic red for creative activities
    'Curates': '#4ecdc4',    // Cool, calming teal for curated content
    'Connects': '#95a5a6',   // Neutral, connecting gray for community features
    'Latest': '#ffd93d',     // Bright, attention-grabbing yellow for new content
    'Calendar': '#a8e6cf',   // Soft, natural green for time-based content
    'Menu': '#ff8b94',       // Soft pink for food and drink
    'By Day': '#6c5ce7',     // Deep purple for daytime activities
    'By Night': '#fdcb6e',   // Warm orange for evening events
    'Events': '#ff7675',     // Vibrant coral for special occasions
    'Exhibitions': '#74b9ff', // Sky blue for art and exhibitions
    'The Fungi Room': '#55efc4', // Organic mint for natural elements
    'Creative Climate Collab': '#81ecec', // Fresh aqua for collaborative projects
    'Directory': '#fab1a0',   // Warm peach for community connections
    'Zine': '#ffeaa7',       // Light yellow for publications
    'Opportunities': '#dfe6e9' // Clean gray for opportunities
};

// When the DOM loads, we initialize all our core functionality
document.addEventListener('DOMContentLoaded', () => {
    // Initialize all major systems in a specific order to ensure proper setup
    setupDropdowns();        // Setup menu system first
    setupCornerResize();     // Initialize content scaling
    setupNavCollisionDetection(); // Setup spatial awareness
    setupScrollListener();   // Handle scroll-based updates
    setupColorPicker();      // Initialize theme system
    setupCalendar();         // Setup calendar functionality
    setupNavBoxDrag();       // Initialize navigation dot system
    setupHeaderIcons();      // Setup header icon interactions
    
    // Restore previous state if it exists
    restorePreviousState();
    
    // Open the Latest section by default to give users immediate content
    setTimeout(() => addSection('Latest'), 100);
});

// State restoration system loads user preferences and section states
function restorePreviousState() {
    // Restore theme color if previously set
    const savedColor = localStorage.getItem('lastThemeColor');
    if (savedColor) {
        document.documentElement.style.setProperty('--theme-color', savedColor);
        updateHeaderIcons(savedColor);
    }
    
    // Restore section states including positions and scales
    const savedSections = localStorage.getItem('sectionState');
    if (savedSections) {
        try {
            const sections = JSON.parse(savedSections);
            sections.forEach(section => {
                if (section.active) {
                    addSection(section.name, section.position);
                }
            });
        } catch (error) {
            console.warn('Error restoring section state:', error);
        }
    }
}

// Header icon system provides visual feedback and interaction
function setupHeaderIcons() {
    const icons = {
        account: document.querySelector('.icon-person'),
        basket: document.querySelector('.icon-basket'),
        menu: document.querySelector('.icon-triad')
    };

    // Add hover effects and click handlers for each icon
    Object.entries(icons).forEach(([name, icon]) => {
        if (icon) {
            icon.parentElement.addEventListener('mouseenter', () => {
                icon.style.transform = 'scale(1.1)';
            });
            
            icon.parentElement.addEventListener('mouseleave', () => {
                icon.style.transform = 'scale(1)';
            });
            
            icon.parentElement.addEventListener('click', () => {
                handleIconClick(name);
            });
        }
    });
}

// Icon click handler manages different icon functionalities
function handleIconClick(iconName) {
    switch(iconName) {
        case 'account':
            // Account management functionality
            console.log('Account clicked');
            break;
        case 'basket':
            // Shopping basket functionality
            console.log('Basket clicked');
            break;
        case 'menu':
            // Menu toggle functionality
            console.log('Menu clicked');
            break;
    }
}

// Theme color management system
function updateThemeColor(sectionName) {
    const mainSection = sectionName.split(' ')[0];
    const color = sectionColors[mainSection] || '#000';
    
    // Update theme color with transition
    document.documentElement.style.setProperty('--theme-color', color);
    localStorage.setItem('lastThemeColor', color);
    
    // Update header icons to maintain visibility
    updateHeaderIcons(color);
}

// Header icon color management ensures visibility against changing backgrounds
function updateHeaderIcons(backgroundColor) {
    const icons = document.querySelectorAll('.icon-button');
    const isDark = isColorDark(backgroundColor);
    
    icons.forEach(icon => {
        icon.style.color = isDark ? '#fff' : '#000';
    });
}

// Utility function to determine if a color is dark
function isColorDark(color) {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return brightness < 128;
}