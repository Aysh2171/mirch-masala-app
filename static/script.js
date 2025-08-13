// Global variables
const API_URL = '';
let cart = [];
let currentUser = null;
let currentPage = 'home';

// Sanitize localStorage user
const storedUser = localStorage.getItem('currentUser');
try {
    const parsedUser = JSON.parse(storedUser);
    if (parsedUser && parsedUser.user_id) {
        currentUser = parsedUser;
    } else {
        localStorage.removeItem('currentUser');
    }
} catch {
    localStorage.removeItem('currentUser');
}

// DOM Elements
const menuGrid = document.getElementById('menu-grid');
const filterButtons = document.querySelectorAll('.filter-btn');
const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
const navMenu = document.querySelector('.nav-menu');
const notification = document.getElementById('notification');


// DOM elements
const mobileMenuButton = document.getElementById('mobile-menu-button');
const mobileMenu = document.getElementById('mobile-menu');
const cartBadge = document.getElementById('cart-badge');
const mobileCartBadge = document.getElementById('mobile-cart-badge');
const mainContent = document.getElementById('main-content');

// Menu items data
const menuItemsData = [
    {
        id: 1,
        name: 'Fresh Tomato Soup',
        description: 'A delicious and refreshing soup made from fresh tomatoes.',
        category: 'Soups',
        price: 80,
        image: 'https://placeholder.svg?height=180&width=280'
    },
    {
        id: 2,
        name: 'Manchow Soup',
        description: 'A spicy and flavorful Indo-Chinese soup with vegetables and crispy noodles.',
        category: 'Soups',
        price: 90,
        image: 'https://placeholder.svg?height=180&width=280'
    },
    {
        id: 5,
        name: 'Gobi Manchurian',
        description: 'Crispy cauliflower fritters coated in a spicy, tangy sauce.',
        category: 'Starters & Indo-Chinese Specials',
        price: 150,
        image: 'https://placeholder.svg?height=180&width=280'
    },
    {
        id: 9,
        name: 'Paneer 65',
        description: 'Spicy, deep-fried paneer cubes coated in a flavorful batter.',
        category: 'Starters & Indo-Chinese Specials',
        price: 180,
        image: 'https://placeholder.svg?height=180&width=280'
    },
    {
        id: 20,
        name: 'Malai Kofta',
        description: 'Deep-fried dumplings of paneer and vegetables in a rich, creamy gravy.',
        category: 'Main Course - Vegetarian Delights',
        price: 200,
        image: 'https://placeholder.svg?height=180&width=280'
    },
    {
        id: 25,
        name: 'Paneer Butter Masala',
        description: 'Cottage cheese cooked in a rich, buttery tomato gravy.',
        category: 'Main Course - Paneer Specialties',
        price: 220,
        image: 'https://placeholder.svg?height=180&width=280'
    },
    {
        id: 33,
        name: 'Butter Garlic Naan',
        description: 'Naan topped with butter and a fragrant garlic seasoning.',
        category: 'Indian Breads',
        price: 55,
        image: 'https://placeholder.svg?height=180&width=280'
    },
    {
        id: 43,
        name: 'Malai Lassi',
        description: 'A creamy, sweet yogurt drink.',
        category: 'Beverages - Traditional Indian Drinks',
        price: 100,
        image: 'https://placeholder.svg?height=180&width=280'
    },
    {
        id: 47,
        name: 'Green Apple Mojito',
        description: 'A refreshing mojito made with green apple and mint.',
        category: 'Beverages - Refreshing Drinks',
        price: 170,
        image: 'https://placeholder.svg?height=180&width=280'
    },
    {
        id: 54,
        name: 'Sizzling Brownie',
        description: 'A warm brownie served on a sizzling plate with ice cream.',
        category: 'Desserts & Sweets',
        price: 180,
        image: 'https://placeholder.svg?height=180&width=280'
    }
];

// Cart data
//let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Initialize the page
// document.addEventListener('DOMContentLoaded', function() {
//     renderMenuItems('all');
//     setupEventListeners();
//     updateCartCountDisplay();
// });

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    // Set up event listeners
    mobileMenuButton.addEventListener('click', toggleMobileMenu);
    
    // Form submissions
    document.getElementById('login-form')?.addEventListener('submit', handleLogin);
    document.getElementById('signup-form')?.addEventListener('submit', handleSignup);
    document.getElementById('add-item-form')?.addEventListener('submit', handleAddMenuItem);
    
    // Check if user is logged in
    updateAuthUI();
    
    // --- FIX START: DEFAULT TO LOGIN PAGE ---
    // Load login page by default if not logged in, otherwise load home
    if (currentUser) {
        loadPage('home');
    } else {
        loadPage('login');
    }
    // --- FIX END: DEFAULT TO LOGIN PAGE ---
    
    // Update cart badge
    updateCartBadge();
});

// Toggle mobile menu
function toggleMobileMenu() {
    mobileMenu.classList.toggle('hidden');
}

// --- FIX START: ADMIN LINK BUG ---
// This entire function is corrected to properly add/remove the Admin link.
function updateAuthUI() {
    const loginLinks = document.querySelectorAll('a[onclick="loadPage(\'login\')"]');
    
    // Correctly select the desktop and mobile navigation menus
    const navMenu = document.querySelector('.hidden.md\\:flex.space-x-6'); 
    const mobileMenuContainer = document.getElementById('mobile-menu');

    // First, clean up any existing admin links to prevent duplicates on re-render
    const existingAdminLink = navMenu?.querySelector('a[onclick="loadPage(\'admin\')"]');
    if (existingAdminLink) existingAdminLink.remove();
    const existingMobileAdminLink = mobileMenuContainer?.querySelector('a[onclick="loadPage(\'admin\')"]');
    if (existingMobileAdminLink) existingMobileAdminLink.remove();

    if (currentUser) {
        // User is logged in
        loginLinks.forEach(link => {
            link.textContent = 'Logout';
            link.setAttribute('onclick', 'handleLogout()');
        });
        
        // Show admin link if user is admin
        if (currentUser.user_type === 'admin') {
            if (navMenu) {
                const adminLink = document.createElement('a');
                adminLink.href = '#';
                adminLink.setAttribute('onclick', "loadPage('admin')");
                adminLink.className = 'hover:text-red-500';
                adminLink.textContent = 'Admin';
                // Insert after Profile link for consistent order
                const profileLink = navMenu.querySelector('a[onclick="loadPage(\'profile\')"]');
                if (profileLink) {
                    profileLink.insertAdjacentElement('afterend', adminLink);
                }
            }
            if (mobileMenuContainer) {
                const mobileAdminLink = document.createElement('a');
                mobileAdminLink.href = '#';
                mobileAdminLink.setAttribute('onclick', "loadPage('admin')");
                mobileAdminLink.className = 'block py-2 hover:text-red-500';
                mobileAdminLink.textContent = 'Admin';
                const mobileProfileLink = mobileMenuContainer.querySelector('a[onclick="loadPage(\'profile\')"]');
                if (mobileProfileLink) {
                    mobileProfileLink.insertAdjacentElement('afterend', mobileAdminLink);
                }
            }
        }
    } else {
        // User is not logged in
        loginLinks.forEach(link => {
            link.textContent = 'Login';
            link.setAttribute('onclick', "loadPage('login')");
        });
    }
}
// --- FIX END: ADMIN LINK BUG ---


// Load a page
function loadPage(page) {
    // Check if user is logged in for protected pages
    if (['cart', 'checkout', 'profile', 'admin'].includes(page) && !currentUser) {
        alert('Please login to access this page');
        page = 'login';
    }
    
    // Check if user is admin for admin page
    if (page === 'admin' && currentUser?.user_type !== 'admin') {
        alert('You do not have permission to access the admin page');
        page = 'home';
    }
    
    // Hide all pages
    document.querySelectorAll('section').forEach(section => {
        section.classList.add('hidden');
    });
    
    // Show the selected page
    document.getElementById(`${page}-page`).classList.remove('hidden');
    
    // Update current page
    currentPage = page;
    
    // Load specific content for the page
    switch(page) {
        case 'menu':
            fetchMenuItems();
            break;
        case 'cart':
            fetchCartItems();
            break;
        case 'checkout':
            renderCheckout();
            break;
        case 'admin':
            fetchAdminMenuItems();
            break;
        case 'profile':
            fetchUserProfile();
            fetchUserOrders();
            break;
    }
    
    // Close mobile menu if open
    if (!mobileMenu.classList.contains('hidden')) {
        mobileMenu.classList.add('hidden');
    }
    
    // Add page transition effect
    mainContent.classList.add('page-transition');
    setTimeout(() => {
        mainContent.classList.remove('page-transition');
    }, 300);
}

// Handle login
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const userType = document.getElementById('user-type').value;
    
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password, userType })
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            // Save user data to localStorage
            localStorage.setItem('currentUser', JSON.stringify(data.user));
            currentUser = data.user;
            
            // Update UI
            updateAuthUI();
            
            // Redirect to home page
            loadPage('home');
            
            // Show success message
            alert('Login successful!');
        } else {
            alert(data.message || 'Login failed. Please try again.');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('An error occurred during login. Please try again.');
    }
}

// Handle signup
async function handleSignup(e) {
    e.preventDefault();
    
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const phone = document.getElementById('signup-phone').value;
    const password = document.getElementById('signup-password').value;
    const address = document.getElementById('signup-address').value;
    const userType = document.getElementById('signup-user-type').value;
    
    try {
        const response = await fetch(`${API_URL}/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, phone, password, address, userType })
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            alert('Registration successful! Please login.');
            loadPage('login');
        } else {
            alert(data.message || 'Registration failed. Please try again.');
        }
    } catch (error) {
        console.error('Signup error:', error);
        alert('An error occurred during registration. Please try again.');
    }
}

// Handle logout
function handleLogout() {
    // Clear user data from localStorage
    localStorage.removeItem('currentUser');
    currentUser = null;
    
    // Update UI
    updateAuthUI();
    
    // Redirect to login page
    loadPage('login');
    
    // Show success message
    alert('Logout successful!');
}

// Authentication Functions
// function checkAuthStatus() {
//     // Check if user is logged in
//     if (!currentUser && !['index.html', 'signup.html'].includes(window.location.pathname.split('/').pop())) {
//         // Redirect to login page if not on login or signup page
//         window.location.href = 'index.html';
//     }
    
//     // Update UI based on auth status
//     const logoutLinks = document.querySelectorAll('a[href="index.html"]');
//     logoutLinks.forEach(link => {
//         if (link.textContent.trim() === 'Logout') {
//             link.addEventListener('click', function(e) {
//                 e.preventDefault();
//                 logout();
//             });
//         }
//     });
// }

// function initLoginPage() {
//     const loginForm = document.getElementById('loginForm');
//     if (loginForm) {
//         loginForm.addEventListener('submit', function(e) {
//             e.preventDefault();
            
//             const email = document.getElementById('email').value;
//             const password = document.getElementById('password').value;
//             const userType = document.getElementById('userType').value;
            
//             login(email, password, userType);
//         });
//     }
// }

// function initSignupPage() {
//     const signupForm = document.getElementById('signupForm');
//     if (signupForm) {
//         signupForm.addEventListener('submit', function(e) {
//             e.preventDefault();
            
//             const name = document.getElementById('name').value;
//             const email = document.getElementById('email').value;
//             const phone = document.getElementById('phone').value;
//             const password = document.getElementById('password').value;
//             const address = document.getElementById('address').value;
//             const userType = document.getElementById('userType').value;
            
//             signup(name, email, phone, password, address, userType);
//         });
//     }
// }

// async function login(email, password, userType) {
//     try {
//         const response = await fetch(`${API_URL}/login`, {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json'
//             },
//             body: JSON.stringify({ email, password, userType })
//         });
        
//         const data = await response.json();
        
//         if (data.status === 'success') {
//             // Save user data to localStorage
//             localStorage.setItem('currentUser', JSON.stringify(data.user));
//             currentUser = data.user;
            
//             // Redirect to menu page
//             window.location.href = 'menu.html';
//         } else {
//             // Show error message
//             alert(data.message || 'Login failed. Please try again.');
//         }
//     } catch (error) {
//         console.error('Login error:', error);
//         alert('An error occurred during login. Please try again.');
//     }
// }

// async function signup(name, email, phone, password, address, userType) {
//     try {
//         const response = await fetch(`${API_URL}/signup`, {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json'
//             },
//             body: JSON.stringify({ name, email, phone, password, address, userType })
//         });
        
//         const data = await response.json();
        
//         if (data.status === 'success') {
//             alert('Registration successful! Please login.');
//             window.location.href = 'index.html';
//         } else {
//             // Show error message
//             alert(data.message || 'Registration failed. Please try again.');
//         }
//     } catch (error) {
//         console.error('Signup error:', error);
//         alert('An error occurred during registration. Please try again.');
//     }
// }

// function logout() {
//     // Clear user data from localStorage
//     localStorage.removeItem('currentUser');
//     currentUser = null;
    
//     // Redirect to login page
//     window.location.href = 'index.html';
// }

// Setup event listeners
// function setupEventListeners() {
//     // Filter buttons
//     if (filterButtons) {
//         filterButtons.forEach(button => {
//             button.addEventListener('click', function() {
//                 // Remove active class from all buttons
//                 filterButtons.forEach(btn => btn.classList.remove('active'));
                
//                 // Add active class to clicked button
//                 this.classList.add('active');
                
//                 // Get category and render menu items
//                 const category = this.getAttribute('data-category');
//                 renderMenuItems(category);
//             });
//         });
//     }
    
//     // Mobile menu toggle
//     if (mobileMenuToggle) {
//         mobileMenuToggle.addEventListener('click', function() {
//             navMenu.classList.toggle('active');
//         });
//     }
// }

// Menu Page Functions
// function initMenuPage() {
//     const menuGrid = document.getElementById('menu-grid');
//     const filterButtons = document.querySelectorAll('.filter-btn');
    
//     if (menuGrid) {
//         // Fetch menu items from API
//         fetchMenuItems();
        
//         // Add event listeners to filter buttons
//         if (filterButtons) {
//             filterButtons.forEach(button => {
//                 button.addEventListener('click', function() {
//                     // Remove active class from all buttons
//                     filterButtons.forEach(btn => btn.classList.remove('active'));
                    
//                     // Add active class to clicked button
//                     this.classList.add('active');
                    
//                     // Get category and fetch menu items
//                     const category = this.getAttribute('data-category');
//                     fetchMenuItems(category);
//                 });
//             });
//         }
//     }
// }

// Fetch menu items
async function fetchMenuItems(category = 'all') {
    const menuItemsContainer = document.getElementById('menu-items-container');
    
    if (!menuItemsContainer) return;
    
    try {
        // Show loading state
        menuItemsContainer.innerHTML = '<div class="col-span-full text-center py-8">Loading menu items...</div>';
        
        const response = await fetch(`${API_URL}/menu?category=${category}`);
        const data = await response.json();
        
        if (data.status === 'success') {
            menuItemsContainer.innerHTML = '';
            
            if (data.items.length === 0) {
                menuItemsContainer.innerHTML = '<div class="col-span-full text-center py-8">No menu items found.</div>';
                return;
            }
            
            data.items.forEach(item => {
                const menuItem = document.createElement('div');
                menuItem.className = 'food-card bg-white rounded-lg shadow-md overflow-hidden transition duration-300';
                menuItem.innerHTML = `
                    <img src="/static/images/menu/${item.image}" alt="${item.item_name}" class="w-full menu-item-image">

                    <div class="p-4">
                        <h3 class="font-bold text-lg mb-1">${item.item_name}</h3>
                        <p class="text-gray-600 text-sm mb-2">${item.description || 'Delicious dish from our kitchen'}</p>
                        <div class="flex justify-between items-center">
                            <span class="text-red-600 font-bold">₹${item.price}</span>
                            <button onclick="addToCart(${item.item_id})" class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-sm transition duration-300">
                                Add to Cart
                            </button>
                        </div>
                    </div>
                `;
                menuItemsContainer.appendChild(menuItem);
            });
        } else {
            menuItemsContainer.innerHTML = '<div class="col-span-full text-center py-8">Failed to load menu items. Please try again.</div>';
        }
    } catch (error) {
        console.error('Fetch menu error:', error);
        menuItemsContainer.innerHTML = '<div class="col-span-full text-center py-8">An error occurred while loading menu items. Please try again.</div>';
    }
}

// Filter menu by category
function filterMenu(category) {
    // Update active button
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Fetch filtered menu items
    fetchMenuItems(category);
}

// Render menu items based on category
// function renderMenuItems(category) {
//     // Clear the menu grid
//     if (!menuGrid) return;
    
//     menuGrid.innerHTML = '';
    
//     // Filter items by category
//     const filteredItems = category === 'all' 
//         ? menuItems 
//         : menuItems.filter(item => item.category === category);
    
//     // Create and append menu items
//     filteredItems.forEach(item => {
//         const menuItem = createMenuItemElement(item);
//         menuGrid.appendChild(menuItem);
//     });
    
//     // If no items in category
//     if (filteredItems.length === 0) {
//         menuGrid.innerHTML = '<p class="no-items">No items found in this category.</p>';
//     }
// }

// Create menu item element
function createMenuItemElement(item) {
    const menuItem = document.createElement('div');
    menuItem.className = 'menu-item';
    
    menuItem.innerHTML = `
        <img src="/static/images/menu/${item.image}" alt="${item.name}" class="menu-item-image">
        <div class="menu-item-content">
            <div class="menu-item-header">
                <h3 class="menu-item-title">${item.name}</h3>
                <span class="menu-item-price">₹${item.price}</span>
            </div>
            <span class="menu-item-category">${item.category}</span>
            <p class="menu-item-description">${item.description}</p>
            <button class="add-to-cart-btn" data-id="${item.id}">Add to Cart</button>
        </div>
    `;

    
    // Add event listener to the "Add to Cart" button
    const addToCartBtn = menuItem.querySelector('.add-to-cart-btn');
    addToCartBtn.addEventListener('click', function() {
        addToCart(item);
    });
    
    return menuItem;
}

// Add item to cart
// function addItemToCart(item) {
//     // Check if item already exists in cart
//     const existingItem = cart.find(cartItem => cartItem.id === item.id);
    
//     if (existingItem) {
//         // Increase quantity if item already in cart
//         existingItem.quantity += 1;
//     } else {
//         // Add new item to cart
//         cart.push({
//             ...item,
//             quantity: 1
//         });
//     }
    
//     // Save cart to localStorage
//     localStorage.setItem('cart', JSON.stringify(cart));
    
//     // Update cart count
//     updateCartCountDisplay();
    
//     // Show notification
//     showNotification(`${item.name} added to cart!`);
    
//     // Log cart for demonstration (in a real app, you might save to localStorage)
//     console.log('Cart:', cart);
// }

// Add item to cart
async function addToCart(itemId) {
    if (!currentUser) {
        alert('Please login to add items to cart');
        loadPage('login');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/cart`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: currentUser.user_id,
                item_id: itemId,
                quantity: 1
            })
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            // Update cart badge
            fetchCartItems();
            
            // Show success message
            alert('Item added to cart!');
        } else {
            alert(data.message || 'Failed to add item to cart. Please try again.');
        }
    } catch (error) {
        console.error('Add to cart error:', error);
        alert('An error occurred while adding to cart. Please try again.');
    }
}

// Cart Page Functions
// function initCartPage() {
//     // Fetch cart items
//     fetchCartItems();
    
//     // Add event listener to place order button
//     const placeOrderBtn = document.getElementById('placeOrderBtn');
//     if (placeOrderBtn) {
//         placeOrderBtn.addEventListener('click', function() {
//             // Redirect to checkout page
//             window.location.href = 'checkout.html';
//         });
//     }
// }

// Fetch cart items
async function fetchCartItems() {
    if (!currentUser) return;
    
    const cartItemsContainer = document.getElementById('cart-items-container');
    const emptyCartMessage = document.getElementById('empty-cart-message');
    const cartSummary = document.getElementById('cart-summary');
    
    if (!cartItemsContainer) return;
    
    try {
        const response = await fetch(`${API_URL}/cart/${currentUser.user_id}`);
        const data = await response.json();
        
        if (data.status === 'success') {
            // Save cart items
            cart = data.items;
            
            // Update cart badge
            updateCartBadge();
            
            // If not on cart page, return
            if (currentPage !== 'cart') return;
            
            if (cart.length === 0) {
                if (emptyCartMessage) emptyCartMessage.classList.remove('hidden');
                if (cartSummary) cartSummary.classList.add('hidden');
                return;
            }
            
            if (emptyCartMessage) emptyCartMessage.classList.add('hidden');
            if (cartSummary) cartSummary.classList.remove('hidden');
            
            // Clear cart items container
            cartItemsContainer.innerHTML = '';
            
            // Render cart items
            cart.forEach(item => {
                const cartItem = document.createElement('div');
                cartItem.className = 'flex items-center py-4 border-b';
            
                // Generate image path based on item name
                const imageName = item.name.toLowerCase().replaceAll(' ', '_') + '.jpg';
                const imgPath = `/static/images/menu/${imageName}`;
            
                cartItem.innerHTML = `
                    <img src="${imgPath}" onerror="this.src='/static/images/placeholder.jpg'" alt="${item.name}" class="w-16 h-16 object-cover rounded-lg bg-gray-100">
                    <div class="ml-4 flex-1">
                        <h3 class="font-semibold">${item.name}</h3>
                        <p class="text-red-600 font-bold">₹${item.price}</p>
                    </div>
                    <div class="flex items-center">
                        <button onclick="updateCartItem(${item.item_id}, ${item.quantity - 1})" class="bg-gray-200 hover:bg-gray-300 w-8 h-8 rounded-full flex items-center justify-center">
                            <i class="fas fa-minus text-xs"></i>
                        </button>
                        <span class="mx-3">${item.quantity}</span>
                        <button onclick="updateCartItem(${item.item_id}, ${item.quantity + 1})" class="bg-gray-200 hover:bg-gray-300 w-8 h-8 rounded-full flex items-center justify-center">
                            <i class="fas fa-plus text-xs"></i>
                        </button>
                    </div>
                `;
            
                cartItemsContainer.appendChild(cartItem);
            });
            
            
            // Update cart summary
            updateCartSummary(data.total);
        } else {
            console.error('Fetch cart error:', data.message);
        }
    } catch (error) {
        console.error('Fetch cart error:', error);
    }
}

// Update cart item quantity
async function updateCartItem(itemId, quantity) {
    if (!currentUser) return;
    
    try {
        const response = await fetch(`${API_URL}/cart/${currentUser.user_id}/update`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                item_id: itemId,
                quantity: quantity
            })
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            // Refresh cart items
            fetchCartItems();
        } else {
            alert(data.message || 'Failed to update cart. Please try again.');
        }
    } catch (error) {
        console.error('Update cart error:', error);
        alert('An error occurred while updating cart. Please try again.');
    }
}

// async function fetchCartItems() {
//     try {
//         if (!currentUser) {
//             alert('Please login to view your cart.');
//             window.location.href = 'index.html';
//             return;
//         }
        
//         const cartItemsContainer = document.getElementById('cartItems');
//         const emptyCartMessage = document.getElementById('emptyCartMessage');
//         const cartSummary = document.querySelector('.cart-summary');
//         const cartTotal = document.getElementById('cartTotal');
        
//         if (!cartItemsContainer) return;
        
//         // Show loading message
//         cartItemsContainer.innerHTML = '<p>Loading cart items...</p>';
        
//         // Fetch cart items from API
//         const response = await fetch(`${API_URL}/cart/${currentUser.id}`);
//         const data = await response.json();
        
//         if (data.status === 'success') {
//             // Save cart items
//             cart = data.items;
            
//             // Check if cart is empty
//             if (cart.length === 0) {
//                 cartItemsContainer.style.display = 'none';
//                 if (cartSummary) cartSummary.style.display = 'none';
//                 if (emptyCartMessage) emptyCartMessage.style.display = 'block';
//                 return;
//             }
            
//             // Show cart items
//             cartItemsContainer.style.display = 'block';
//             if (cartSummary) cartSummary.style.display = 'flex';
//             if (emptyCartMessage) emptyCartMessage.style.display = 'none';
            
//             // Clear cart items container
//             cartItemsContainer.innerHTML = '';
            
//             // Render cart items
//             cart.forEach(item => {
//                 const cartItem = document.createElement('div');
//                 cartItem.className = 'cart-item';
//                 cartItem.innerHTML = `
//                     <img src="${item.image || 'https://placeholder.svg?height=180&width=280'}" alt="${item.name}" class="cart-item-image">
//                     <div class="cart-item-details">
//                         <h3 class="cart-item-title">${item.name}</h3>
//                         <p class="cart-item-price">₹${item.price} each</p>
//                     </div>
//                     <div class="cart-item-quantity">
//                         <button class="quantity-btn decrease-btn" data-id="${item.item_id}">-</button>
//                         <input type="number" class="quantity-input" value="${item.quantity}" min="1" data-id="${item.item_id}">
//                         <button class="quantity-btn increase-btn" data-id="${item.item_id}">+</button>
//                     </div>
//                     <div class="cart-item-subtotal">₹${item.subtotal}</div>
//                     <button class="cart-item-remove" data-id="${item.item_id}">&times;</button>
//                 `;
//                 cartItemsContainer.appendChild(cartItem);
//             });
            
//             // Update cart total
//             if (cartTotal) {
//                 cartTotal.textContent = `₹${data.total}`;
//             }
            
//             // Add event listeners to cart item buttons
//             addCartItemEventListeners();
//         } else {
//             cartItemsContainer.innerHTML = '<p class="error">Failed to load cart items. Please try again.</p>';
//         }
//     } catch (error) {
//         console.error('Fetch cart error:', error);
//         const cartItemsContainer = document.getElementById('cartItems');
//         if (cartItemsContainer) {
//             cartItemsContainer.innerHTML = '<p class="error">An error occurred while loading cart items. Please try again.</p>';
//         }
//     }
// }

// function addCartItemEventListeners() {
//     // Decrease quantity buttons
//     document.querySelectorAll('.decrease-btn').forEach(button => {
//         button.addEventListener('click', function() {
//             const itemId = parseInt(this.getAttribute('data-id'));
//             const quantityInput = this.parentElement.querySelector('.quantity-input');
//             const currentQuantity = parseInt(quantityInput.value);
            
//             if (currentQuantity > 1) {
//                 updateCartItemQuantity(itemId, currentQuantity - 1);
//             }
//         });
//     });
    
//     // Increase quantity buttons
//     document.querySelectorAll('.increase-btn').forEach(button => {
//         button.addEventListener('click', function() {
//             const itemId = parseInt(this.getAttribute('data-id'));
//             const quantityInput = this.parentElement.querySelector('.quantity-input');
//             const currentQuantity = parseInt(quantityInput.value);
            
//             updateCartItemQuantity(itemId, currentQuantity + 1);
//         });
//     });
    
//     // Quantity input fields
//     document.querySelectorAll('.quantity-input').forEach(input => {
//         input.addEventListener('change', function() {
//             const itemId = parseInt(this.getAttribute('data-id'));
//             const newQuantity = parseInt(this.value);
            
//             if (newQuantity >= 1) {
//                 updateCartItemQuantity(itemId, newQuantity);
//             } else {
//                 this.value = 1;
//                 updateCartItemQuantity(itemId, 1);
//             }
//         });
//     });
    
//     // Remove buttons
//     document.querySelectorAll('.cart-item-remove').forEach(button => {
//         button.addEventListener('click', function() {
//             const itemId = parseInt(this.getAttribute('data-id'));
//             updateCartItemQuantity(itemId, 0); // 0 quantity will remove the item
//         });
//     });
// }

// async function updateCartItemQuantity(itemId, quantity) {
//     try {
//         if (!currentUser) {
//             alert('Please login to update your cart.');
//             window.location.href = 'index.html';
//             return;
//         }
        
//         // Update cart item in database
//         const response = await fetch(`${API_URL}/cart/${currentUser.id}/update`, {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json'
//             },
//             body: JSON.stringify({
//                 item_id: itemId,
//                 quantity: quantity
//             })
//         });
        
//         const data = await response.json();
        
//         if (data.status === 'success') {
//             // Refresh cart items
//             fetchCartItems();
            
//             // Update cart count
//             updateCartCount();
//         } else {
//             alert(data.message || 'Failed to update cart. Please try again.');
//         }
//     } catch (error) {
//         console.error('Update cart error:', error);
//         alert('An error occurred while updating cart. Please try again.');
//     }
// }

// Update cart badge
function updateCartBadge() {
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    
    if (totalItems > 0) {
        if (cartBadge) {
            cartBadge.textContent = totalItems;
            cartBadge.classList.remove('hidden');
        }
        if (mobileCartBadge) {
            mobileCartBadge.textContent = totalItems;
            mobileCartBadge.classList.remove('hidden');
        }
    } else {
        if (cartBadge) cartBadge.classList.add('hidden');
        if (mobileCartBadge) mobileCartBadge.classList.add('hidden');
    }
}

// Update cart summary
function updateCartSummary(total) {
    const cartSubtotal = document.getElementById('cart-subtotal');
    const cartTotal = document.getElementById('cart-total');
    
    if (cartSubtotal) cartSubtotal.textContent = `₹${parseFloat(total).toFixed(2)}`;
if (cartTotal) cartTotal.textContent = `₹${(parseFloat(total) + 30).toFixed(2)}`;
 // Adding delivery fee
}

// Checkout Page Functions
// function initCheckoutPage() {
//     // Fetch cart items for order summary
//     fetchOrderSummary();
    
//     // Add event listener to checkout form
//     const checkoutForm = document.getElementById('checkoutForm');
//     if (checkoutForm) {
//         checkoutForm.addEventListener('submit', function(e) {
//             e.preventDefault();
            
//             const deliveryAddress = document.getElementById('deliveryAddress').value;
//             const paymentMethod = document.getElementById('paymentMethod').value;
            
//             if (!deliveryAddress || !paymentMethod) {
//                 alert('Please fill in all fields.');
//                 return;
//             }
            
//             placeOrder(deliveryAddress, paymentMethod);
//         });
//     }
// }

// Render checkout page
function renderCheckout() {
    if (!currentUser) return;
    
    // Set delivery address
    const savedAddressText = document.getElementById('saved-address-text');
    if (savedAddressText && currentUser.address) {
        savedAddressText.textContent = currentUser.address;
    }
    
    // Calculate totals
    const subtotal = cart.reduce((total, item) => total + parseFloat(item.subtotal), 0);
    const total = subtotal + 30; // Adding delivery fee
    
    // Update checkout summary
    const checkoutSubtotal = document.getElementById('checkout-subtotal');
    const checkoutTotal = document.getElementById('checkout-total');
    
    if (checkoutSubtotal) checkoutSubtotal.textContent = `₹${subtotal}`;
    if (checkoutTotal) checkoutTotal.textContent = `₹${(subtotal + 30).toFixed(2)}`;

}

// Place order
async function placeOrder() {
    if (!currentUser || !currentUser.user_id) {
        alert('Please login to place an order');
        loadPage('login');
        return;
    }
    
    if (cart.length === 0) {
        alert('Your cart is empty. Please add items before placing an order.');
        loadPage('menu');
        return;
    }
    
    
    // Get payment method
    let paymentMethod = 'cod'; // Default to cash on delivery
    if (document.getElementById('online').checked) {
        paymentMethod = 'online';
    } else if (document.getElementById('upi').checked) {
        paymentMethod = 'upi';
    }
    
    // Get delivery address
    const deliveryAddress = currentUser.address;
    
    try {
        console.log("Placing order... 🚀");
        console.log("Request payload:", JSON.stringify({
        user_id: currentUser.user_id,
        deliveryAddress,
        paymentMethod
        }));

        
        const response = await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: currentUser.user_id,
                deliveryAddress,
                paymentMethod
            })
        });
        
        const data = await response.json();
        console.log("Server responded with:", data);

        
        if (data.status === 'success') {
            // Generate order ID for display
            const orderId = `#MS${data.order_id}`;
            
            // Set order details
            document.getElementById('order-id').textContent = orderId;
            document.getElementById('payment-method').textContent = 
                paymentMethod === 'cod' ? 'Cash on Delivery' : 
                paymentMethod === 'online' ? 'Online Payment' : 'UPI Payment';
            
            // Render order items
            const orderSummary = document.getElementById('order-summary-items');
            orderSummary.innerHTML = '';
            
            cart.forEach(item => {
                const orderItem = document.createElement('div');
                orderItem.className = 'flex justify-between mb-2';
                orderItem.innerHTML = `
                    <span>${item.name} x ${item.quantity}</span>
                    <span>₹${item.subtotal}</span>
                `;
                orderSummary.appendChild(orderItem);
            });
            
            // Set order total
            const subtotal = cart.reduce((total, item) => total + parseFloat(item.subtotal), 0);
            const total = subtotal + 30; // Adding delivery fee
            document.getElementById('order-total').textContent = `₹${total.toFixed(2)}`;

            
            // Clear cart
            cart = [];
            
            // Update cart badge
            updateCartBadge();
            
            // Show confirmation page
            loadPage('order-confirmation');
        } else {
            alert(data.message || 'Failed to place order. Please try again.');
        }
    } catch (error) {
        console.error('Place order error:', error);
        alert('An error occurred while placing order. Please try again.');
    }
}

// async function fetchOrderSummary() {
//     try {
//         if (!currentUser) {
//             alert('Please login to checkout.');
//             window.location.href = 'index.html';
//             return;
//         }
        
//         const orderItemsContainer = document.getElementById('orderItems');
//         const orderTotal = document.getElementById('orderTotal');
        
//         if (!orderItemsContainer || !orderTotal) return;
        
//         // Show loading message
//         orderItemsContainer.innerHTML = '<p>Loading order summary...</p>';
        
//         // Fetch cart items from API
//         const response = await fetch(`${API_URL}/cart/${currentUser.id}`);
//         const data = await response.json();
        
//         if (data.status === 'success') {
//             // Check if cart is empty
//             if (data.items.length === 0) {
//                 alert('Your cart is empty. Please add items to your cart before checkout.');
//                 window.location.href = 'menu.html';
//                 return;
//             }
            
//             // Clear order items container
//             orderItemsContainer.innerHTML = '';
            
//             // Render order items
//             data.items.forEach(item => {
//                 const orderItem = document.createElement('div');
//                 orderItem.className = 'order-item';
//                 orderItem.innerHTML = `
//                     <div class="order-item-details">
//                         <span class="order-item-title">${item.name}</span>
//                         <span class="order-item-quantity">Qty: ${item.quantity}</span>
//                     </div>
//                     <span class="order-item-price">₹${item.subtotal}</span>
//                 `;
//                 orderItemsContainer.appendChild(orderItem);
//             });
            
//             // Update order total
//             orderTotal.textContent = `₹${data.total}`;
//         } else {
//             orderItemsContainer.innerHTML = '<p class="error">Failed to load order summary. Please try again.</p>';
//         }
//     } catch (error) {
//         console.error('Fetch order summary error:', error);
//         const orderItemsContainer = document.getElementById('orderItems');
//         if (orderItemsContainer) {
//             orderItemsContainer.innerHTML = '<p class="error">An error occurred while loading order summary. Please try again.</p>';
//         }
//     }
// }

// async function placeOrder(deliveryAddress, paymentMethod) {
//     try {
//         if (!currentUser) {
//             alert('Please login to place an order.');
//             window.location.href = 'index.html';
//             return;
//         }
        
//         // Place order in database
//         const response = await fetch(`${API_URL}/orders`, {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json'
//             },
//             body: JSON.stringify({
//                 user_id: currentUser.id,
//                 deliveryAddress,
//                 paymentMethod
//             })
//         });
        
//         const data = await response.json();
        
//         if (data.status === 'success') {
//             // Save order ID for confirmation page
//             localStorage.setItem('lastOrderId', data.order_id);
            
//             // Redirect to confirmation page
//             window.location.href = 'confirmation.html';
//         } else {
//             alert(data.message || 'Failed to place order. Please try again.');
//         }
//     } catch (error) {
//         console.error('Place order error:', error);
//         alert('An error occurred while placing order. Please try again.');
//     }
// }

// Confirmation Page Functions
// function initConfirmationPage() {
//     const orderId = document.getElementById('orderId');
//     const deliveryStatus = document.getElementById('deliveryStatus');
//     const paymentStatus = document.getElementById('paymentStatus');
    
//     if (orderId) {
//         // Get order ID from localStorage
//         const lastOrderId = localStorage.getItem('lastOrderId') || 'ORD-12345';
//         orderId.textContent = lastOrderId;
//     }
    
//     if (deliveryStatus) {
//         deliveryStatus.textContent = 'Processing';
//     }
    
//     if (paymentStatus) {
//         paymentStatus.textContent = 'Completed';
//     }
    
//     // Clear cart count
//     updateCartCount();
// }

// Fetch user profile
async function fetchUserProfile() {
    if (!currentUser) return;
    
    try {
        const response = await fetch(`${API_URL}/user/${currentUser.user_id}`);
        const data = await response.json();
        
        if (data.status === 'success') {
            // Update profile display
            document.getElementById('profile-name').textContent = data.user.name;
            document.getElementById('profile-email').textContent = data.user.email;
            document.getElementById('profile-phone').textContent = data.user.phone_number;
            document.getElementById('profile-address').textContent = data.user.address;
            document.getElementById('profile-type').textContent = data.user.user_type.charAt(0).toUpperCase() + data.user.user_type.slice(1);
        } else {
            console.error('Fetch profile error:', data.message);
        }
    } catch (error) {
        console.error('Fetch profile error:', error);
    }
}

// Fetch user orders
async function fetchUserOrders() {
    if (!currentUser) return;
    
    const orderHistoryContainer = document.getElementById('order-history-container');
    
    if (!orderHistoryContainer) return;
    
    try {
        // Show loading state
        orderHistoryContainer.innerHTML = '<div class="text-center py-8">Loading order history...</div>';
        
        const response = await fetch(`${API_URL}/orders/${currentUser.user_id}`);
        const data = await response.json();
        
        if (data.status === 'success') {
            orderHistoryContainer.innerHTML = '';
            
            if (data.orders.length === 0) {
                orderHistoryContainer.innerHTML = '<div class="text-center py-8">No orders found.</div>';
                return;
            }
            
            data.orders.forEach(order => {
                const orderDate = new Date(order.order_date).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                });
                
                const orderElement = document.createElement('div');
                orderElement.className = 'bg-gray-50 rounded-lg p-4 mb-4';
                
                let itemsHtml = '';
                if (order.items && order.items.length > 0) {
                    itemsHtml = `
                        <div class="mb-2">
                            <span class="text-gray-600">Items:</span>
                            <ul class="list-disc list-inside mt-1">
                                ${order.items.map(item => `<li>${item.item_name} x ${item.quantity}</li>`).join('')}
                            </ul>
                        </div>
                    `;
                }
                
                const paymentMethod = order.payment ? order.payment.payment_method : order.payment_mode;
                const statusClass = 
                    order.status === 'delivered' ? 'status-delivered' : 
                    order.status === 'cancelled' ? 'status-cancelled' : 'status-pending';
                
                orderElement.innerHTML = `
                    <div class="flex justify-between items-center mb-3">
                        <span class="font-semibold">Order #MS${order.order_id}</span>
                        <span class="text-sm text-gray-500">${orderDate}</span>
                    </div>
                    ${itemsHtml}
                    <div class="flex justify-between mb-3">
                        <span class="text-gray-600">Payment:</span>
                        <span>${paymentMethod}</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="order-status ${statusClass}">${order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
                        <span class="font-bold">₹${order.total_price}</span>
                    </div>
                `;
                
                orderHistoryContainer.appendChild(orderElement);
            });
        } else {
            orderHistoryContainer.innerHTML = '<div class="text-center py-8">Failed to load order history. Please try again.</div>';
        }
    } catch (error) {
        console.error('Fetch orders error:', error);
        orderHistoryContainer.innerHTML = '<div class="text-center py-8">An error occurred while loading order history. Please try again.</div>';
    }
}

// Switch profile tab
function switchProfileTab(tab) {
    const ordersTab = document.getElementById('orders-tab');
    const favoritesTab = document.getElementById('favorites-tab');
    const ordersContent = document.getElementById('orders-content');
    const favoritesContent = document.getElementById('favorites-content');
    
    if (tab === 'orders') {
        ordersTab.classList.add('active');
        favoritesTab.classList.remove('active');
        ordersContent.classList.remove('hidden');
        favoritesContent.classList.add('hidden');
    } else {
        ordersTab.classList.remove('active');
        favoritesTab.classList.add('active');
        ordersContent.classList.add('hidden');
        favoritesContent.classList.remove('hidden');
    }
}

// Fetch admin menu items
async function fetchAdminMenuItems() {
    if (!currentUser || currentUser.user_type !== 'admin') return;
    
    const adminMenuItems = document.getElementById('admin-menu-items');
    
    if (!adminMenuItems) return;
    
    try {
        // Show loading state
        adminMenuItems.innerHTML = '<tr><td colspan="4" class="text-center py-4">Loading menu items...</td></tr>';
        
        const response = await fetch(`${API_URL}/menu`);
        const data = await response.json();
        
        if (data.status === 'success') {
            adminMenuItems.innerHTML = '';
            
            if (data.items.length === 0) {
                adminMenuItems.innerHTML = '<tr><td colspan="4" class="text-center py-4">No menu items found.</td></tr>';
                return;
            }
            
            data.items.forEach(item => {
                const row = document.createElement('tr');
                row.className = 'border-b hover:bg-gray-50';
                row.innerHTML = `
                    <td class="py-3 px-4">
                        <div class="flex items-center">
                            <img src="${item.image || `https://source.unsplash.com/random/300x200/?${item.item_name.replace(' ', '-')}`}" alt="${item.item_name}" class="w-10 h-10 object-cover rounded-lg mr-3">
                            <div>
                                <div class="font-semibold">${item.item_name}</div>
                                <div class="text-xs text-gray-500">${item.category}</div>
                            </div>
                        </div>
                    </td>
                    <td class="py-3 px-4">${item.category}</td>
                    <td class="py-3 px-4">₹${item.price}</td>
                    <td class="py-3 px-4">
                        <button onclick="deleteMenuItem(${item.item_id})" class="text-red-600 hover:text-red-800">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                adminMenuItems.appendChild(row);
            });
        } else {
            adminMenuItems.innerHTML = '<tr><td colspan="4" class="text-center py-4">Failed to load menu items. Please try again.</td></tr>';
        }
    } catch (error) {
        console.error('Fetch admin menu error:', error);
        adminMenuItems.innerHTML = '<tr><td colspan="4" class="text-center py-4">An error occurred while loading menu items. Please try again.</td></tr>';
    }
}

// Handle add menu item
async function handleAddMenuItem(e) {
    e.preventDefault();
    
    if (!currentUser || currentUser.user_type !== 'admin') {
        alert('You do not have permission to add menu items');
        return;
    }
    
    const name = document.getElementById('item-name').value;
    const category = document.getElementById('item-category').value;
    const price = document.getElementById('item-price').value;
    const image = document.getElementById('item-image').value;
    const description = document.getElementById('item-description').value;
    
    if (!name || !category || !price || !description) {
        alert('Please fill in all required fields');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/admin/menu`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name,
                category,
                price,
                image,
                description
            })
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            alert('Menu item added successfully!');
            
            // Clear form
            document.getElementById('item-name').value = '';
            document.getElementById('item-category').value = '';
            document.getElementById('item-price').value = '';
            document.getElementById('item-image').value = '';
            document.getElementById('item-description').value = '';
            
            // Refresh menu items
            fetchAdminMenuItems();
        } else {
            alert(data.message || 'Failed to add menu item. Please try again.');
        }
    } catch (error) {
        console.error('Add menu item error:', error);
        alert('An error occurred while adding menu item. Please try again.');
    }
}

// Delete menu item
async function deleteMenuItem(itemId) {
    if (!currentUser || currentUser.user_type !== 'admin') {
        alert('You do not have permission to delete menu items');
        return;
    }
    
    if (!confirm('Are you sure you want to delete this menu item?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/admin/menu/${itemId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            alert('Menu item deleted successfully!');
            
            // Refresh menu items
            fetchAdminMenuItems();
        } else {
            alert(data.message || 'Failed to delete menu item. Please try again.');
        }
    } catch (error) {
        console.error('Delete menu item error:', error);
        alert('An error occurred while deleting menu item. Please try again.');
    }
}

// Update cart count
// function updateCartCountDisplay() {
//     const cartCount = document.querySelector('.cart-count');
//     if (!cartCount) return;
    
//     const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
//     cartCount.textContent = totalItems;
// }

// Utility Functions
// function updateCartCount() {
//     if (!currentUser) return;
    
//     // Fetch cart count from API
//     fetch(`${API_URL}/cart/${currentUser.id}`)
//         .then(response => response.json())
//         .then(data => {
//             if (data.status === 'success') {
//                 // Update cart count in UI
//                 const cartCountElements = document.querySelectorAll('.cart-count');
//                 const totalItems = data.items.reduce((total, item) => total + item.quantity, 0);
                
//                 cartCountElements.forEach(element => {
//                     element.textContent = totalItems;
//                 });
//             }
//         })
//         .catch(error => {
//             console.error('Update cart count error:', error);
//         });
// }

// Show notification
function showNotification(message) {
    if (!notification) return;
    
    // Set notification message
    const notificationText = notification.querySelector('p');
    if (notificationText) {
        notificationText.textContent = message;
    }
    
    // Show notification
    notification.classList.add('show');
    
    // Hide notification after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Calculate cart total
function calculateTotal() {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
}

// Generate random order ID
function generateOrderId() {
    return 'ORD-' + Math.floor(10000 + Math.random() * 90000);
}

// Replace placeholder images with actual food images (if available)
function loadImages() {
    // In a real application, you would replace placeholder URLs with actual image URLs
    // This is just a placeholder function
}

// If we're using hardcoded menu items for testing (fallback)
const menuItems = menuItemsData;

