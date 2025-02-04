// Fullscreen Mode and Content Management System
// This system allows sections to expand into a fullscreen state while maintaining
// their context within the overall interface. Think of it like zooming into a 
// detail while keeping awareness of the larger space.

function toggleFullscreen(name) {
    const section = document.getElementById(`section-${name}`);
    const wasFullscreen = section.classList.contains('is-fullscreen');
    
    // Before making any changes, we store the current state of all sections
    // to ensure smooth transitions
    storeAllSectionStates();
    
    // Reset any existing fullscreen sections first
    document.querySelectorAll('.section.is-fullscreen').forEach(s => {
        if (s !== section) {
            s.classList.remove('is-fullscreen');
            restoreSectionState(s);
        }
    });
    
    // Toggle the fullscreen state
    section.classList.toggle('is-fullscreen');
    document.body.classList.toggle('has-fullscreen-section');
    
    if (!wasFullscreen) {
        // We're entering fullscreen mode
        enterFullscreenMode(section);
    } else {
        // We're exiting fullscreen mode
        exitFullscreenMode(section);
    }
    
    // Update our navigation system to reflect the change
    updateNavigationState(name, !wasFullscreen);
}

function enterFullscreenMode(section) {
    // Store the section's original position for later restoration
    section.dataset.prevState = JSON.stringify({
        rect: section.getBoundingClientRect(),
        transform: section.style.transform,
        scale: getCurrentScale()
    });
    
    // Apply the fullscreen animation
    requestAnimationFrame(() => {
        section.style.animation = 'fadeToFullscreen 0.3s forwards';
        
        // The animation timing matches our CSS transition
        setTimeout(() => {
            section.scrollIntoView({ behavior: 'smooth' });
            
            // Hide other sections with a smooth fade
            document.querySelectorAll('.section').forEach(s => {
                if (s !== section) {
                    s.style.transition = 'opacity 0.3s ease';
                    s.style.opacity = '0';
                    setTimeout(() => {
                        s.style.display = 'none';
                        s.style.opacity = '';
                        s.style.transition = '';
                    }, 300);
                }
            });
        }, 50);
    });
}

function exitFullscreenMode(section) {
    // Retrieve the section's original state
    const prevState = JSON.parse(section.dataset.prevState || '{}');
    
    // Apply the exit animation
    section.style.animation = 'fadeFromFullscreen 0.3s forwards';
    
    // Restore other sections with a smooth fade
    document.querySelectorAll('.section').forEach(s => {
        if (s !== section) {
            s.style.display = 'block';
            s.style.opacity = '0';
            
            requestAnimationFrame(() => {
                s.style.transition = 'opacity 0.3s ease';
                s.style.opacity = '1';
                setTimeout(() => {
                    s.style.transition = '';
                }, 300);
            });
        }
    });
    
    // Restore the previous scale and position
    if (prevState.transform) {
        setTimeout(() => {
            section.style.transform = prevState.transform;
            updateContentScale(prevState.scale);
        }, 300);
    }
}

// Content Generation System
// This system creates rich, context-aware content for each section type,
// ensuring a consistent experience while allowing for section-specific features.

function generateSectionContent(name) {
    // Our content templates reflect the character of each section
    const templates = {
        'Menu': generateMenuContent(),
        'By Day': generateDayContent(),
        'By Night': generateNightContent(),
        'The Fungi Room': generateFungiContent(),
        'Latest': generateLatestContent()
    };

    // If we have a specific template for this section, use it
    if (templates[name]) {
        return templates[name];
    }

    // Otherwise, return a development placeholder that maintains visual consistency
    return `
        <div class="placeholder-content">
            <h3>${name}</h3>
            <p>Content for ${name} is being developed. This section will contain:</p>
            <div class="placeholder-details">
                <div class="placeholder-item">Interactive elements</div>
                <div class="placeholder-item">Rich media content</div>
                <div class="placeholder-item">Community features</div>
            </div>
        </div>
    `;
}

// Each content generator creates a unique experience appropriate to its section
function generateMenuContent() {
    return `
        <div class="menu-container">
            <h3>Daily Menu</h3>
            <div class="menu-sections">
                <div class="menu-section">
                    <h4>Coffee Bar</h4>
                    <div class="menu-items">
                        <div class="menu-item">
                            <span class="item-name">Espresso</span>
                            <span class="item-details">Single origin, rotating selection</span>
                            <span class="item-price">£2.50</span>
                        </div>
                        <div class="menu-item">
                            <span class="item-name">Filter Coffee</span>
                            <span class="item-details">V60 / Batch Brew / Aeropress</span>
                            <span class="item-price">£2.80</span>
                        </div>
                    </div>
                </div>
                <div class="menu-section">
                    <h4>Food</h4>
                    <div class="menu-items">
                        <div class="menu-item">
                            <span class="item-name">Daily Sandwich</span>
                            <span class="item-details">Local ingredients, seasonal fillings</span>
                            <span class="item-price">£6.50</span>
                        </div>
                        <div class="menu-item">
                            <span class="item-name">House Salad</span>
                            <span class="item-details">Fresh herbs, toasted seeds</span>
                            <span class="item-price">£5.50</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// More specific content generators would follow here...

// State Management for Content
// This system ensures content and interface state persists appropriately

function saveSectionState() {
    const state = {
        sections: activeSections.map(name => ({
            id: name,
            isMinimized: getMinimizedState(name),
            isFullscreen: getFullscreenState(name),
            position: getSectionPosition(name)
        })),
        timestamp: Date.now()
    };
    
    localStorage.setItem('sectionState', JSON.stringify(state));
}

function restoreSectionState() {
    try {
        const saved = localStorage.getItem('sectionState');
        if (!saved) return;
        
        const state = JSON.parse(saved);
        
        // Only restore state if it's from the last 24 hours
        if (Date.now() - state.timestamp > 24 * 60 * 60 * 1000) {
            localStorage.removeItem('sectionState');
            return;
        }
        
        state.sections.forEach(section => {
            restoreSectionFromState(section);
        });
    } catch (error) {
        console.warn('Error restoring section state:', error);
    }
}