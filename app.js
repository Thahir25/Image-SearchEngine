document.addEventListener('DOMContentLoaded', () => {
    const searchForm = document.getElementById('searchForm');
    const searchBox = document.getElementById('search-box');
    const searchResult = document.getElementById('search-result');
    const accessKey = "wIKmPmkZLelmtYk5gNIY6Caa_tk6d9EG3vsvf0fkTrY";
    const loadingSpinner = document.getElementById('loading-spinner');

    let keyword = '';
    let page = 1;
    let isLoading = false;

    // Single favorites initialization
    let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');

    async function searchImages() {
        if (isLoading) return;
        isLoading = true;
        loadingSpinner.style.opacity = '1';
        loadingSpinner.style.visibility = 'visible';

        keyword = searchBox.value;
        const url = `https://api.unsplash.com/search/photos?page=${page}&query=${keyword}&client_id=${accessKey}&per_page=9`;

        try {
            const response = await fetch(url);
            const data = await response.json();
            
            // Only clear results on new search
            if (page === 1) {
                searchResult.innerHTML = '';
            }

            if (data.results.length === 0) {
                searchResult.innerHTML = `<h2>No results found for "${keyword}"</h2>`;
                return;
            }

            const results = data.results;
            console.log(results);
            
            results.forEach((result, index) => {
                const imgContainer = document.createElement('div');
                imgContainer.className = 'image-container';
                imgContainer.style.position = 'relative';
                
                const img = document.createElement('img');  
                img.src = result.urls.small;
                
                const description = document.createElement('div');
                description.className = 'image-description';
                description.textContent = result.alt_description || 'No description available';
                
                // Add favorite button with separate click handling
                const favButton = document.createElement('button');
                favButton.className = 'favorite-btn';
                favButton.innerHTML = `<i class="fa${isFavorite(result.id) ? 's' : 'r'} fa-heart"></i>`;
                
                favButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleFavorite(result);
                    favButton.innerHTML = `<i class="fa${isFavorite(result.id) ? 's' : 'r'} fa-heart"></i>`;
                });

                // Create separate click handler for image
                imgContainer.addEventListener('click', (e) => {
                    if (!e.target.closest('.favorite-btn')) {
                        window.open(result.links.html, '_blank');
                    }
                });
                
                imgContainer.addEventListener('mouseover', () => {
                    document.querySelectorAll('.image-container').forEach(container => {
                        if (container !== imgContainer) {
                            container.classList.add('blur');
                        }
                    });
                    imgContainer.classList.remove('blur');
                    description.style.opacity = '1';
                });

                imgContainer.addEventListener('mouseout', () => {
                    document.querySelectorAll('.image-container').forEach(container => {
                        container.classList.remove('blur');
                    });
                    description.style.opacity = '0';
                });
                
                imgContainer.appendChild(favButton);
                imgContainer.appendChild(img);
                imgContainer.appendChild(description);
                imgContainer.classList.add('show');  // Add show class directly to container
                
                searchResult.appendChild(imgContainer);
            });
        } catch (error) {
            console.error('Error fetching images:', error);
            showToast('Error loading images. Please try again.');
        } finally {
            setTimeout(() => {
                isLoading = false;
                loadingSpinner.style.opacity = '0';
                loadingSpinner.style.visibility = 'hidden';
            }, 500);
        }

    }

    searchForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        page = 1;
        await searchImages();
        
        // Add smooth scroll to results
        const searchResultTop = searchResult.offsetTop;
        window.scrollTo({
            top: searchResultTop - 100, // Offset by 100px to show the search bar
            behavior: 'smooth'
        });
    })

    // Debounce scroll event
    let scrollTimeout;
    window.addEventListener('scroll', () => {
        if (scrollTimeout) {
            clearTimeout(scrollTimeout);
        }
        
        scrollTimeout = setTimeout(() => {
            if (!isLoading && (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 500)) {
                page++;
                searchImages();
            }
        }, 300);
    }, { passive: true });


    // Background Particle Effect
    const canvas = document.createElement('canvas');
    document.body.appendChild(canvas);
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.zIndex = '-1';
    
    const resizeCanvas = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    };
    resizeCanvas();

    let ctx = canvas.getContext('2d');
    let dots = [];
    let arraycolors = ['#FF0000', '#FFFFFF', '#8B4513', '#808080', '#FFD700'];
    
    function initDots() {
        dots = [];
        for (let i = 0; i < 200; i++) {
            dots.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                radius: Math.random() * 1.5 + 1,
                color: arraycolors[Math.floor(Math.random() * arraycolors.length)],
                speedX: Math.random() * 0.5 - 0.25,
                speedY: Math.random() * 0.5 - 0.25
            });
        }
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        dots.forEach(dot => {
            // Update position
            dot.x += dot.speedX;
            dot.y += dot.speedY;

            // Bounce off edges
            if (dot.x < 0 || dot.x > canvas.width) dot.speedX *= -1;
            if (dot.y < 0 || dot.y > canvas.height) dot.speedY *= -1;

            // Draw dot
            ctx.beginPath();
            ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
            ctx.fillStyle = dot.color;
            ctx.fill();
        });
        

        requestAnimationFrame(animate);
    }

    // Initialize and start animation
    initDots();
    animate();

    // Handle window resize
    window.addEventListener('resize', () => {
        resizeCanvas();
        initDots();
    });

    // Combined mouse interaction handlers
    let mouse = { x: null, y: null };
    let mouseTimeout;
    canvas.addEventListener('mousemove', (e) => {
        if(mouseTimeout) return;
        mouseTimeout = setTimeout(() => {
            const rect = canvas.getBoundingClientRect();
            mouse.x = e.clientX - rect.left;
            mouse.y = e.clientY - rect.top;

            dots.forEach(dot => {
                const dx = mouse.x - dot.x;
                const dy = mouse.y - dot.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 50) {
                    const angle = Math.atan2(dy, dx);
                    const force = (100 - distance) / 100;
                    dot.x -= Math.cos(angle) * force;
                    dot.y -= Math.sin(angle) * force;
                }
            });
            mouseTimeout = null;
        }, 16);
    });

    // Modal Functionality
    const signInBtn = document.querySelector('.signin');
    const favoritesBtn = document.querySelector('.favorites');
    const modals = document.querySelectorAll('.modal');
    const closeBtns = document.querySelectorAll('.close-btn');

    function toggleModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.toggle('active');
        if(modalId === 'favoritesModal') {
            displayFavorites();
        }
    }

    signInBtn.addEventListener('click', () => toggleModal('signInModal'));
    favoritesBtn.addEventListener('click', () => toggleModal('favoritesModal'));

    closeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            modals.forEach(modal => modal.classList.remove('active'));
        });
    });

    // Consolidated favorite handling functions
    function toggleFavorite(image) {
        try {
            const index = favorites.findIndex(fav => fav.id === image.id);
            if (index === -1) {
                favorites.push(image);
                showToast('Added to favorites!');
            } else {
                favorites.splice(index, 1);
                showToast('Removed from favorites!');
            }
            localStorage.setItem('favorites', JSON.stringify(favorites));
            updateFavoritesCount();
            displayFavorites();
        } catch (error) {
            console.error('Error in toggleFavorite:', error);
            showToast('Error updating favorites');
        }
    }

    function displayFavorites() {
        const grid = document.getElementById('favorites-grid');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        if (favorites.length === 0) {
            grid.innerHTML = '<p class="no-favorites">No favorite images yet!</p>';
            return;
        }

        favorites.forEach(fav => {
            const favItem = document.createElement('div');
            favItem.className = 'favorite-item';
            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-favorite';
            removeBtn.innerHTML = '<i class="fas fa-times"></i>';
            removeBtn.addEventListener('click', () => toggleFavorite(fav));
            
            favItem.innerHTML = `<img src="${fav.urls.small}" alt="${fav.alt_description || 'image'}">`;
            favItem.appendChild(removeBtn);
            grid.appendChild(favItem);
        });
    }

    function updateFavoritesCount() {
        const favCount = favorites.length;
        const favBtn = document.querySelector('.favorites');
        favBtn.innerHTML = `
            <i class="far fa-heart"></i>
            Favorites (${favCount})
        `;
    }

    // Favorites handling
    function isFavorite(id) {
        return favorites.some(fav => fav.id === id);
    }

    // Remove updateFavoritesGrid since it's merged with displayFavorites

    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
    }

    // Initialize favorites count
    updateFavoritesCount();
    
    // Cleanup event listeners on page unload
    window.addEventListener('unload', () => {
        localStorage.setItem('favorites', JSON.stringify(favorites));
    });
})// Close DOMContentLoaded event listener

