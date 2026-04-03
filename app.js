// In production, we'll want to use the deployed backend URL or domain
// Since Vercel will host this frontend but the backend is local,
// We should allow the user to input their backend URL or just default to localhost for localhost running.
// Since the user is deploying frontend to Vercel and running backend locally:
// Let's default to localhost:3000 but add a very small setting to update it if needed.

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').then(reg => {
            console.log('Bypass Service Worker registered:', reg.scope);
        }).catch(err => console.error('SW registration failed:', err));
    });
}

let API_BASE = localStorage.getItem('moviestream_api_url') || 'https://missions-forbes-oven-subsection.trycloudflare.com';

document.addEventListener('DOMContentLoaded', () => {
    const listUl = document.getElementById('movie-list-ul');
    const videoPlayer = document.getElementById('video-player');
    const noVideoContainer = document.getElementById('no-video-selected');
    const titleElement = document.getElementById('current-movie-title');

    const settingsBtn = document.getElementById('settings-btn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            const newUrl = prompt('Enter Backend URL (e.g. http://localhost:3000 or your Ngrok URL):', API_BASE);
            if (newUrl !== null) {
                let cleanUrl = newUrl.trim();
                if (cleanUrl.endsWith('/')) cleanUrl = cleanUrl.slice(0, -1);
                
                if (cleanUrl && cleanUrl !== API_BASE) {
                    API_BASE = cleanUrl;
                    localStorage.setItem('moviestream_api_url', API_BASE);
                    listUl.innerHTML = '<li class="loading">Loading movies...</li>';
                    fetchMovies();
                }
            }
        });
        
        // Add a subtle hover effect via JS since it's inline styled
        settingsBtn.addEventListener('mouseenter', () => settingsBtn.style.color = 'var(--text-primary)');
        settingsBtn.addEventListener('mouseleave', () => settingsBtn.style.color = 'var(--text-secondary)');
    }

    // Function to fetch movies
    function fetchMovies() {
        // Bypass Ngrok free tier warning
        fetch(`${API_BASE}/movies`, {
            headers: {
                'ngrok-skip-browser-warning': 'true'
            }
        })
            .then(res => {
                if (!res.ok) throw new Error('Network response was not ok');
                return res.json();
            })
            .then(data => {
                listUl.innerHTML = '';
                
                if (data.movies.length === 0) {
                    listUl.innerHTML = '<li class="error">No movies found in folder</li>';
                    return;
                }

                data.movies.forEach(movie => {
                    const li = document.createElement('li');
                    
                    // Clean up title for display
                    const displayTitle = movie.replace(/\.[^/.]+$/, "").replace(/[._]/g, " ");
                    
                    li.innerHTML = `
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="min-width: 20px;">
                            <polygon points="5 3 19 12 5 21 5 3"></polygon>
                        </svg>
                        <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${movie}">${displayTitle}</span>
                    `;
                    
                    li.addEventListener('click', () => {
                        // Update active state
                        document.querySelectorAll('#movie-list-ul li').forEach(el => el.classList.remove('active'));
                        li.classList.add('active');

                        // Play video
                        playMovie(movie, displayTitle);
                    });
                    
                    listUl.appendChild(li);
                });
            })
            .catch(err => {
                console.error('Error fetching movies:', err);
                listUl.innerHTML = '<li class="error" style="flex-direction: column; align-items: flex-start; gap: 8px;">' +
                    '<span>Failed to load movies. Backend offline?</span>' +
                    '<button id="retry-btn" style="background: var(--accent); color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 13px;">Retry</button>' +
                    '</li>';
                
                document.getElementById('retry-btn')?.addEventListener('click', (e) => {
                    e.stopPropagation();
                    listUl.innerHTML = '<li class="loading">Loading movies...</li>';
                    fetchMovies();
                });
            });
    }

    function playMovie(filename, displayTitle) {
        noVideoContainer.style.display = 'none';
        videoPlayer.style.display = 'block';
        
        videoPlayer.src = `${API_BASE}/stream/${encodeURIComponent(filename)}`;
        videoPlayer.play().catch(e => console.error("Playback failed", e));
        
        titleElement.textContent = displayTitle;
    }

    // Initial fetch
    fetchMovies();
});
