// Theme Toggle Functionality
let currentTheme = 0; // 0=dark, 1=snow
const themes = ['Dark Mode', 'Snow Mode'];

document.addEventListener('DOMContentLoaded', function() {
    const themeBtn = document.getElementById('theme-toggle');
    const notification = document.getElementById('theme-notification');
    
    function showNotification(text) {
        notification.textContent = text;
        notification.classList.add('show');
        setTimeout(() => notification.classList.remove('show'), 2000);
    }
    
    function createSnowfall() {
        const snowflakes = document.querySelectorAll('.snowflake');
        snowflakes.forEach(s => s.remove());
        
        const snowTypes = ['❅', '❆', '❄', '✦', '✧', '❈', '❉', '❊'];
        
        for(let i = 0; i < 80; i++) {
            const snowflake = document.createElement('div');
            snowflake.className = 'snowflake';
            snowflake.innerHTML = snowTypes[Math.floor(Math.random() * snowTypes.length)];
            snowflake.style.left = Math.random() * 100 + '%';
            snowflake.style.fontSize = (Math.random() * 8 + 8) + 'px';
            snowflake.style.animationDuration = (Math.random() * 4 + 3) + 's';
            snowflake.style.animationDelay = Math.random() * 3 + 's';
            snowflake.style.opacity = Math.random() * 0.8 + 0.2;
            document.body.appendChild(snowflake);
        }
    }
    
    themeBtn.onclick = function() {
        currentTheme = (currentTheme + 1) % 2;
        document.body.className = 'template-color-1 spybody';
        
        if(currentTheme === 0) {
            document.body.classList.add('dark-mode');
            themeBtn.innerHTML = '🌙 Theme';
            document.querySelectorAll('.snowflake').forEach(s => s.remove());
        } else {
            document.body.classList.add('snow-mode');
            themeBtn.innerHTML = '❄️ Theme';
            createSnowfall();
        }
        
        showNotification(themes[currentTheme] + ' activated');
    };
    
    // Set default to dark mode
    document.body.classList.add('dark-mode');
});

// Preloader function
function enterSite() {
    document.getElementById('preloader').classList.add('hidden');
}