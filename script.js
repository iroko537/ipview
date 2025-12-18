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

    // Check local storage or system preference
    if (currentTheme === 'dark' || (!currentTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
        // Icon visibility is handled by CSS classes (hidden/block) based on parent 'dark' class
    } else {
        document.documentElement.classList.remove('dark');
    }

    themeToggle.addEventListener('click', () => {
        if (document.documentElement.classList.contains('dark')) {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        } else {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        }
    });

    // Populate User Agent
    // Shorten it for display but keep full title
    const ua = navigator.userAgent;
    userAgentEl.textContent = ua;
    userAgentEl.title = ua;

    // Fetch IP Data from ipwho.is (CORS friendly)
    fetch('https://ipwho.is/')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Update UI with data
            if (!data.success) {
                 throw new Error(data.message || 'API Error');
            }

            ipAddressEl.textContent = data.ip;
            locationEl.textContent = `${data.city}, ${data.region}, ${data.country}`;

            ispEl.textContent = data.connection?.isp || data.connection?.org || '-';
            ispEl.title = ispEl.textContent;

            timezoneEl.textContent = `${data.timezone?.id} (UTC${data.timezone?.utc})`;
            timezoneEl.title = timezoneEl.textContent;

            asnEl.textContent = data.connection?.asn || '-';
            asnEl.title = asnEl.textContent;

            // Initialize Map
            if (data.latitude && data.longitude) {
                initMap(data.latitude, data.longitude);
            }
        })
        .catch(error => {
            console.error('Error fetching IP data:', error);
            ipAddressEl.textContent = 'Error';
            locationEl.textContent = 'Check console';
        });

    // Copy to Clipboard
    copyBtn.addEventListener('click', () => {
        const ipText = ipAddressEl.textContent;
        if (ipText && ipText !== 'Loading...' && ipText !== 'Error') {
            navigator.clipboard.writeText(ipText).then(() => {
                // Show success message
                copySuccess.classList.remove('opacity-0');
                setTimeout(() => {
                    copySuccess.classList.add('opacity-0');
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

        // Disable some controls for a cleaner "background" feel?
        // Or keep them minimal.
        map = L.map('map', {
            zoomControl: false,
            scrollWheelZoom: false,
            attributionControl: false // We will add attribution manually or keep it small
        }).setView([lat, lng], 13);

        // Re-enable zoom control in bottom right maybe?
        L.control.zoom({
            position: 'bottomright'
        }).addTo(map);

        // Attribution (standard required by OSM)
        L.control.attribution({
            position: 'bottomright'
        }).addTo(map);

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
