document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const ipAddressEl = document.getElementById('ip-address');
    const locationEl = document.getElementById('location');
    const copyBtn = document.getElementById('copy-btn');
    const copySuccess = document.getElementById('copy-success');

    const ispEl = document.getElementById('isp');
    const timezoneEl = document.getElementById('timezone');
    const asnEl = document.getElementById('asn');
    const userAgentEl = document.getElementById('user-agent');

    const themeToggle = document.getElementById('theme-toggle');

    // Initialize Map
    let map = null;

    // Dark Mode Logic
    const currentTheme = localStorage.getItem('theme');
    if (currentTheme) {
        document.documentElement.setAttribute('data-theme', currentTheme);
        themeToggle.textContent = currentTheme === 'dark' ? '☀️' : '🌙';
    }

    themeToggle.addEventListener('click', () => {
        let theme = document.documentElement.getAttribute('data-theme');
        if (theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
            themeToggle.textContent = '🌙';
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
            themeToggle.textContent = '☀️';
        }
    });

    // Populate User Agent
    userAgentEl.textContent = navigator.userAgent;

    // Fetch IP Data from ipwho.is (CORS friendly)
    fetch('https://ipwho.is/')
        .then(response => {
            console.log('Fetching from https://ipwho.is/');
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Data received:', data);
            // Update UI with data
            if (!data.success) {
                // If API returns success: false
                 throw new Error(data.message || 'API Error');
            }

            ipAddressEl.textContent = data.ip;
            locationEl.textContent = `${data.city}, ${data.region}, ${data.country}`;

            ispEl.textContent = data.connection?.isp || data.connection?.org || '-';
            timezoneEl.textContent = `${data.timezone?.id} (UTC${data.timezone?.utc})`;
            asnEl.textContent = data.connection?.asn || '-';

            // Initialize Map
            if (data.latitude && data.longitude) {
                initMap(data.latitude, data.longitude);
            }
        })
        .catch(error => {
            console.error('Error fetching IP data:', error);
            ipAddressEl.textContent = 'Error fetching IP';
            locationEl.textContent = 'Could not detect location';

            // If ipwho.is fails, we could try ipapi.co as fallback or just show error.
            // For now, logging error.
        });

    // Copy to Clipboard
    copyBtn.addEventListener('click', () => {
        const ipText = ipAddressEl.textContent;
        if (ipText && ipText !== 'Loading...' && ipText !== 'Error fetching IP') {
            navigator.clipboard.writeText(ipText).then(() => {
                copySuccess.classList.remove('hidden');
                setTimeout(() => {
                    copySuccess.classList.add('hidden');
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy: ', err);
            });
        }
    });

    // Function to initialize Leaflet Map
    function initMap(lat, lng) {
        // Create map instance
        if (map) {
             map.remove();
        }
        map = L.map('map').setView([lat, lng], 13);

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        // Add marker
        L.marker([lat, lng]).addTo(map)
            .bindPopup(`<b>${locationEl.textContent}</b>`)
            .openPopup();
    }
});
