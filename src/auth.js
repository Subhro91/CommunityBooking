/**
 * Authentication module
 * Handles user login, logout, and session management
 */

// DOM Elements
const authSection = document.getElementById('auth-section');
const authButton = document.getElementById('auth-button');
const loginModal = document.getElementById('login-modal');
const registerModal = document.getElementById('register-modal');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const registerLink = document.getElementById('register-link');
const loginLink = document.getElementById('login-link');
const googleLoginBtn = document.getElementById('google-login');
const logoutLink = document.getElementById('logout-link');
const closeLoginBtn = document.getElementById('close-login-modal');
const closeRegisterBtn = document.getElementById('close-register-modal');
const userProfile = document.getElementById('user-profile');
const userName = document.getElementById('user-name');
const loadingSpinner = document.getElementById('loading-spinner');
const bookingSystem = document.getElementById('calendar-section');
const bookingsSection = document.getElementById('bookings-section');

// Mobile elements
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const mobileMenu = document.getElementById('mobile-menu');
const mobileMenuBackdrop = document.getElementById('mobile-menu-backdrop');
const mobileUserProfile = document.getElementById('mobile-user-profile');
const mobileUserName = document.getElementById('mobile-user-name');
const mobileUserEmail = document.getElementById('mobile-user-email');
const mobileLoginBtn = document.getElementById('mobile-login-btn');
const mobileLogoutBtn = document.getElementById('mobile-logout-btn');

// Check if we're on admin page
const isAdminPage = window.location.pathname.includes('admin.html');

// Current authenticated user
let currentUser = null;

// Get the notification container
const notificationContainer = document.getElementById('notification-container');

/**
 * Show loading spinner
 * @param {string} message - Optional message to display with the spinner
 */
function showLoading(message) {
    const spinner = document.getElementById('loading-spinner');
    if (!spinner) return;
    
    // Add message if provided
    if (message) {
        // Create or update message element
        let messageEl = spinner.querySelector('.loading-message');
        if (!messageEl) {
            messageEl = document.createElement('div');
            messageEl.className = 'loading-message bg-white px-4 py-2 rounded-md mt-4 text-gray-700 font-medium';
            spinner.querySelector('div').insertAdjacentElement('afterend', messageEl);
        }
        messageEl.textContent = message;
    } else {
        // Remove message element if it exists
        const messageEl = spinner.querySelector('.loading-message');
        if (messageEl) messageEl.remove();
    }
    
    // Show spinner
    spinner.classList.remove('hidden');
    spinner.classList.add('flex');
}

/**
 * Hide loading spinner
 */
function hideLoading() {
    const spinner = document.getElementById('loading-spinner');
    if (!spinner) return;
    
    // Remove any message element
    const messageEl = spinner.querySelector('.loading-message');
    if (messageEl) messageEl.remove();
    
    // Hide spinner
    spinner.classList.add('hidden');
    spinner.classList.remove('flex');
}

/**
 * Show notification message
 * @param {string} message - The message to display
 * @param {string} type - The type of message (success, error, info)
 */
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type} p-3 mb-2 rounded-md text-white font-medium transition-opacity duration-300`;
    
    // Set background color based on notification type
    if (type === 'success') notification.style.backgroundColor = '#10B981';
    else if (type === 'error') notification.style.backgroundColor = '#EF4444';
    else if (type === 'warning') notification.style.backgroundColor = '#F59E0B';
    else notification.style.backgroundColor = '#3B82F6'; // info
    
    notification.textContent = message;
    
    notificationContainer.appendChild(notification);
    
    // Fade in
    setTimeout(() => {
        notification.style.opacity = '1';
    }, 10);
    
    // Fade out and remove after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

/**
 * Sign in with email and password
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {Promise} - Authentication result
 */
function signInWithEmail(email, password) {
    console.log("Attempting to sign in with email:", email);
    return auth.signInWithEmailAndPassword(email, password)
        .then(result => {
            console.log("Sign in successful:", result.user.email);
            return result;
        })
        .catch(error => {
            console.error("Sign in error:", error);
            throw error;
        });
}

/**
 * Sign up with email and password
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {Promise} - Authentication result
 */
function signUpWithEmail(email, password) {
    console.log("Attempting to sign up with email:", email);
    return auth.createUserWithEmailAndPassword(email, password)
        .then(result => {
            console.log("Sign up successful:", result.user.email);
            return result;
        })
        .catch(error => {
            console.error("Sign up error:", error);
            throw error;
        });
}

/**
 * Sign in with Google
 * @returns {Promise} - Authentication result
 */
function signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    return auth.signInWithPopup(provider);
}

/**
 * Sign out the current user
 * @returns {Promise} - Sign out result
 */
function signOut() {
    return auth.signOut();
}

/**
 * Check if user has admin privileges
 * @param {Object} user - Firebase user object
 * @returns {Promise<boolean>} - Whether user is admin
 */
async function isUserAdmin(user) {
    if (!user) return false;
    
    // Get user's custom claims
    const idTokenResult = await user.getIdTokenResult();
    return idTokenResult.claims.admin === true;
}

/**
 * Handle authentication state change
 */
auth.onAuthStateChanged(async (user) => {
    hideLoading();
    
    if (user) {
        // User is signed in
        currentUser = user;
        
        if (authSection) {
            // Use template for logged in users
            const template = document.getElementById('auth-logged-in-template');
            if (template) {
                authSection.innerHTML = template.innerHTML;
                // Set user email
                if (authSection.querySelector('.user-email')) {
                    authSection.querySelector('.user-email').textContent = user.email;
                }
                
                // Re-attach logout event listener
                const logoutLinkElement = document.getElementById('logout-link');
                if (logoutLinkElement) {
                    logoutLinkElement.addEventListener('click', (e) => {
                        e.preventDefault();
                        signOut()
                            .then(() => {
                                showNotification('Logged out successfully', 'info');
                            })
                            .catch((error) => {
                                showNotification(error.message, 'error');
                            });
                    });
                }
                
                // Attach profile button event listener
                const profileButtonElement = document.getElementById('profile-button');
                if (profileButtonElement) {
                    profileButtonElement.addEventListener('click', () => {
                        const profileModal = document.getElementById('profile-modal');
                        if (profileModal) {
                            profileModal.classList.remove('hidden');
                            profileModal.classList.add('flex');
                        }
                    });
                }
            } else {
                // Fallback if template doesn't exist
                authSection.innerHTML = `
                <div class="flex items-center space-x-2">
                    <span class="text-sm text-gray-700">${user.email}</span>
                    <a href="#" id="logout-link" class="text-sm text-teal-600 hover:text-teal-800">Logout</a>
                </div>
                `;
                // Re-attach logout event listener
                document.getElementById('logout-link').addEventListener('click', (e) => {
                    e.preventDefault();
                    signOut()
                        .then(() => {
                            showNotification('Logged out successfully', 'info');
                        })
                        .catch((error) => {
                            showNotification(error.message, 'error');
                        });
                });
            }
        }
        
        if (userProfile) userProfile.classList.remove('hidden');
        if (userName) userName.textContent = user.email;
        
        // Update mobile menu
        if (mobileUserProfile) mobileUserProfile.classList.remove('hidden');
        if (mobileUserName) mobileUserName.textContent = user.email;
        if (mobileUserEmail) mobileUserEmail.textContent = user.email;
        if (mobileLoginBtn) mobileLoginBtn.classList.add('hidden');
        if (mobileLogoutBtn) mobileLogoutBtn.classList.remove('hidden');
        
        // Check if user is admin when on admin page
        if (isAdminPage) {
            const admin = await isUserAdmin(user);
            if (!admin) {
                showNotification('You do not have admin privileges. Redirecting...', 'error');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
            }
        }
        
        // Hide modals if visible
        if (loginModal) {
            loginModal.classList.add('hidden');
            loginModal.classList.remove('flex');
        }
        if (registerModal) {
            registerModal.classList.add('hidden');
            registerModal.classList.remove('flex');
        }
        
        // Show booking sections
        if (bookingSystem) bookingSystem.classList.remove('hidden');
        if (bookingsSection) bookingsSection.classList.remove('hidden');
        
        // Load user's bookings if on main page
        if (!isAdminPage && window.loadUserBookings) {
            window.loadUserBookings();
        }
        
        // Update the calendar to show bookings
        if (window.calendarFunctions && window.calendarFunctions.loadMonthBookings) {
            window.calendarFunctions.loadMonthBookings().then(() => {
                if (window.calendarFunctions.renderCalendar) {
                    window.calendarFunctions.renderCalendar();
                }
            });
        }
        
        // Load all bookings if on admin page
        if (isAdminPage && window.loadAllBookings) {
            window.loadAllBookings();
        }
        
        // Check if user is admin
        checkAdminStatus(user);
        
        // Check if we need to redirect to admin page
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('admin') === 'true' && window.location.pathname.includes('index.html')) {
            window.location.href = 'admin.html';
        }
    } else {
        // User is signed out
        
        // Update desktop UI
        if (authSection) {
            authSection.innerHTML = `
            <button id="auth-button" class="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md font-medium transition duration-300">
                Login
            </button>
            `;
            // Re-attach login button event listener
            document.getElementById('auth-button').addEventListener('click', () => {
                loginModal.classList.remove('hidden');
                loginModal.classList.add('flex');
            });
        }
        
        // Update mobile UI
        if (mobileUserProfile) {
            mobileUserProfile.classList.add('hidden');
        }
        
        if (document.getElementById('mobile-auth-buttons')) {
            document.getElementById('mobile-auth-buttons').classList.remove('hidden');
        }
        
        if (userProfile) userProfile.classList.add('hidden');
        
        // Redirect to main page if on admin page
        if (isAdminPage) {
            window.location.href = 'index.html';
        }
        
        // Always show calendar for guests, only hide bookings section
        if (bookingSystem) bookingSystem.classList.remove('hidden'); // Allow calendar viewing for guests
        if (bookingsSection) bookingsSection.classList.add('hidden');
    }
});

// Mobile menu toggle - MOVED TO initAuth FUNCTION
// DO NOT ADD CODE HERE - SEE initAuth FUNCTION

// Attach event listeners
// Only attach if elements exist (prevents errors when switching between pages)
if (authButton) {
    authButton.addEventListener('click', () => {
        loginModal.classList.remove('hidden');
        loginModal.classList.add('flex');
    });
}

if (logoutLink) {
    logoutLink.addEventListener('click', (e) => {
        e.preventDefault();
        showLoading();
        signOut()
            .then(() => {
                hideLoading();
                showNotification('Successfully logged out', 'success');
            })
            .catch(error => {
                hideLoading();
                showNotification(`Error: ${error.message}`, 'error');
            });
    });
}

if (loginLink) {
    loginLink.addEventListener('click', (e) => {
        e.preventDefault();
        registerModal.classList.add('hidden');
        registerModal.classList.remove('flex');
        loginModal.classList.remove('hidden');
        loginModal.classList.add('flex');
    });
}

if (registerLink) {
    registerLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginModal.classList.add('hidden');
        loginModal.classList.remove('flex');
        registerModal.classList.remove('hidden');
        registerModal.classList.add('flex');
    });
}

if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        showLoading();
        signInWithEmail(email, password)
            .then(() => {
                hideLoading();
                showNotification('Logged in successfully!', 'success');
                loginForm.reset();
            })
            .catch(error => {
                hideLoading();
                showNotification(error.message, 'error');
            });
    });
}

if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        
        showLoading();
        signUpWithEmail(email, password)
            .then(() => {
                hideLoading();
                showNotification('Account created successfully!', 'success');
                registerForm.reset();
            })
            .catch(error => {
                hideLoading();
                showNotification(error.message, 'error');
            });
    });
}

if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', () => {
        showLoading();
        signInWithGoogle()
            .then(() => {
                hideLoading();
                showNotification('Logged in with Google successfully!', 'success');
            })
            .catch(error => {
                hideLoading();
                showNotification(error.message, 'error');
            });
    });
}

// Close modals when clicking outside
window.addEventListener('click', (e) => {
    if (loginModal && e.target === loginModal) {
        loginModal.classList.add('hidden');
        loginModal.classList.remove('flex');
    }
    if (registerModal && e.target === registerModal) {
        registerModal.classList.add('hidden');
        registerModal.classList.remove('flex');
    }
});

// Check if user has admin privileges
function checkAdminStatus(user) {
    user.getIdTokenResult()
        .then((idTokenResult) => {
            const isAdmin = idTokenResult.claims.admin === true;
            if (isAdmin) {
                console.log('User is an admin');
                // Add admin UI elements if needed
                const adminBadge = document.createElement('span');
                adminBadge.className = 'bg-teal-100 text-teal-800 text-xs px-2 py-1 rounded-full ml-2';
                adminBadge.textContent = 'Admin';
                if (authSection) {
                    authSection.querySelector('div').appendChild(adminBadge);
                }
            }
        });
}

// Expose functions to window for global access
window.authFunctions = {
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signOut,
    isUserAdmin,
    showLoading,
    hideLoading,
    showNotification,
    getCurrentUser: () => currentUser
};

// Initialize Firebase Authentication
function initAuth() {
    console.log("Initializing authentication module");
    
    // Re-select DOM elements to ensure they exist
    const mobileMenuBtnElement = document.getElementById('mobile-menu-btn');
    const mobileMenuElement = document.getElementById('mobile-menu');
    const mobileMenuBackdropElement = document.getElementById('mobile-menu-backdrop');
    
    console.log("Mobile menu button found:", !!mobileMenuBtnElement);
    console.log("Mobile menu found:", !!mobileMenuElement);
    console.log("Mobile menu backdrop found:", !!mobileMenuBackdropElement);
    
    // Mobile menu toggle - with debug logging
    if (mobileMenuBtnElement && mobileMenuElement) {
        mobileMenuBtnElement.addEventListener('click', (e) => {
            console.log("Mobile menu button clicked");
            e.preventDefault();
            e.stopPropagation();
            
            if (mobileMenuElement.classList.contains('hidden')) {
                console.log("Opening mobile menu");
                mobileMenuElement.classList.remove('hidden');
                if (mobileMenuBackdropElement) {
                    mobileMenuBackdropElement.classList.remove('hidden');
                }
                document.body.classList.add('overflow-hidden', 'md:overflow-auto');
            } else {
                console.log("Closing mobile menu");
                mobileMenuElement.classList.add('hidden');
                if (mobileMenuBackdropElement) {
                    mobileMenuBackdropElement.classList.add('hidden');
                }
                document.body.classList.remove('overflow-hidden', 'md:overflow-auto');
            }
        });
        
        console.log("Mobile menu toggle event listener attached");
    }
    
    // Sync mobile and desktop select dropdowns
    const mobileViewSelect = document.getElementById('mobile-view-select');
    const desktopViewSelect = document.getElementById('view-select');
    if (mobileViewSelect && desktopViewSelect) {
        // Set initial value from desktop
        mobileViewSelect.value = desktopViewSelect.value;
        
        // Sync from mobile to desktop
        mobileViewSelect.addEventListener('change', () => {
            desktopViewSelect.value = mobileViewSelect.value;
            // Trigger change event on desktop select
            const event = new Event('change');
            desktopViewSelect.dispatchEvent(event);
        });
        
        // Sync from desktop to mobile
        desktopViewSelect.addEventListener('change', () => {
            mobileViewSelect.value = desktopViewSelect.value;
        });
    }
    
    // Sync resource filters
    const mobileFiltersSelect = document.getElementById('mobile-filters-select');
    const desktopFiltersSelect = document.getElementById('filters-select');
    if (mobileFiltersSelect && desktopFiltersSelect) {
        // Set initial value from desktop
        mobileFiltersSelect.value = desktopFiltersSelect.value;
        
        // Sync from mobile to desktop
        mobileFiltersSelect.addEventListener('change', () => {
            desktopFiltersSelect.value = mobileFiltersSelect.value;
            // Trigger change event on desktop select
            const event = new Event('change');
            desktopFiltersSelect.dispatchEvent(event);
        });
        
        // Sync from desktop to mobile
        desktopFiltersSelect.addEventListener('change', () => {
            mobileFiltersSelect.value = desktopFiltersSelect.value;
        });
    }
    
    // Mobile profile button
    const mobileProfileBtnElement = document.getElementById('mobile-profile-btn');
    if (mobileProfileBtnElement) {
        mobileProfileBtnElement.addEventListener('click', () => {
            console.log("Mobile profile button clicked");
            // Close mobile menu
            if (mobileMenuElement) {
                mobileMenuElement.classList.add('hidden');
                if (mobileMenuBackdropElement) {
                    mobileMenuBackdropElement.classList.add('hidden');
                }
                document.body.classList.remove('overflow-hidden', 'md:overflow-auto');
            }
            
            // Open profile modal
            const profileModalElement = document.getElementById('profile-modal');
            if (profileModalElement) {
                profileModalElement.classList.remove('hidden');
                profileModalElement.classList.add('flex');
            }
        });
        console.log("Mobile profile button handler attached");
    }
    
    // Mobile login button
    if (mobileLoginBtn) {
        mobileLoginBtn.addEventListener('click', () => {
            console.log("Mobile login button clicked");
            // Close mobile menu
            if (mobileMenuElement) {
                mobileMenuElement.classList.add('hidden');
                if (mobileMenuBackdropElement) {
                    mobileMenuBackdropElement.classList.add('hidden');
                }
            }
            
            // Open login modal
            const loginModalElement = document.getElementById('login-modal');
            if (loginModalElement) {
                loginModalElement.classList.remove('hidden');
                loginModalElement.classList.add('flex');
            }
        });
        console.log("Mobile login button handler attached");
    }
    
    // Mobile logout button
    if (mobileLogoutBtn) {
        mobileLogoutBtn.addEventListener('click', () => {
            console.log("Mobile logout button clicked");
            // Close mobile menu
            if (mobileMenuElement) {
                mobileMenuElement.classList.add('hidden');
                if (mobileMenuBackdropElement) {
                    mobileMenuBackdropElement.classList.add('hidden');
                }
            }
            
            // Sign out
            showLoading();
            signOut()
                .then(() => {
                    hideLoading();
                    showNotification('Successfully logged out', 'success');
                })
                .catch(error => {
                    hideLoading();
                    showNotification(`Error: ${error.message}`, 'error');
                });
        });
        console.log("Mobile logout button handler attached");
    }
    
    // Mobile new booking button
    const mobileNewBookingBtnElement = document.getElementById('mobile-new-booking-btn');
    if (mobileNewBookingBtnElement) {
        mobileNewBookingBtnElement.addEventListener('click', () => {
            console.log("Mobile new booking button clicked");
            // Check if user is logged in
            if (!firebase.auth().currentUser) {
                showNotification('Please log in to make a booking', 'error');
                
                // Close mobile menu
                if (mobileMenuElement) {
                    mobileMenuElement.classList.add('hidden');
                    if (mobileMenuBackdropElement) {
                        mobileMenuBackdropElement.classList.add('hidden');
                    }
                    document.body.classList.remove('overflow-hidden', 'md:overflow-auto');
                }
                
                // Open login modal
                const loginModalElement = document.getElementById('login-modal');
                if (loginModalElement) {
                    loginModalElement.classList.remove('hidden');
                    loginModalElement.classList.add('flex');
                }
                return;
            }
            
            // Close mobile menu
            if (mobileMenuElement) {
                mobileMenuElement.classList.add('hidden');
                if (mobileMenuBackdropElement) {
                    mobileMenuBackdropElement.classList.add('hidden');
                }
                document.body.classList.remove('overflow-hidden', 'md:overflow-auto');
            }
            
            // Trigger calendar date selection if available
            if (window.calendarFunctions && window.calendarFunctions.openBookingModal) {
                window.calendarFunctions.openBookingModal();
            }
        });
        console.log("Mobile new booking button handler attached");
    }

    // Auth state change listener
    firebase.auth().onAuthStateChanged(user => {
        currentUser = user;
        
        if (user) {
            // User is signed in
            
            // Update desktop UI
            if (authSection) {
                // Use template for logged in users
                const template = document.getElementById('auth-logged-in-template');
                if (template) {
                    authSection.innerHTML = template.innerHTML;
                    // Set user email
                    if (authSection.querySelector('.user-email')) {
                        authSection.querySelector('.user-email').textContent = user.email;
                    }
                    
                    // Re-attach logout event listener
                    const logoutLinkElement = document.getElementById('logout-link');
                    if (logoutLinkElement) {
                        logoutLinkElement.addEventListener('click', (e) => {
                            e.preventDefault();
                            signOut()
                                .then(() => {
                                    showNotification('Logged out successfully', 'info');
                                })
                                .catch((error) => {
                                    showNotification(error.message, 'error');
                                });
                        });
                    }
                    
                    // Attach profile button event listener
                    const profileButtonElement = document.getElementById('profile-button');
                    if (profileButtonElement) {
                        profileButtonElement.addEventListener('click', () => {
                            const profileModal = document.getElementById('profile-modal');
                            if (profileModal) {
                                profileModal.classList.remove('hidden');
                                profileModal.classList.add('flex');
                            }
                        });
                    }
                } else {
                    // Fallback if template doesn't exist
                    authSection.innerHTML = `
                    <div class="flex items-center space-x-2">
                        <span class="text-sm text-gray-700">${user.email}</span>
                        <a href="#" id="logout-link" class="text-sm text-teal-600 hover:text-teal-800">Logout</a>
                    </div>
                    `;
                    // Re-attach logout event listener
                    document.getElementById('logout-link').addEventListener('click', (e) => {
                        e.preventDefault();
                        signOut()
                            .then(() => {
                                showNotification('Logged out successfully', 'info');
                            })
                            .catch((error) => {
                                showNotification(error.message, 'error');
                            });
                    });
                }
            }
            
            // Update mobile UI
            if (mobileUserProfile && mobileUserName && mobileUserEmail) {
                mobileUserProfile.classList.remove('hidden');
                mobileUserName.textContent = user.displayName || user.email;
                mobileUserEmail.textContent = user.email;
            }
            
            if (document.getElementById('mobile-auth-buttons')) {
                document.getElementById('mobile-auth-buttons').classList.add('hidden');
            }
            
            if (userProfile) userProfile.classList.remove('hidden');
            if (userName) userName.textContent = user.email;
            
            // Hide modals
            if (loginModal) {
                loginModal.classList.add('hidden');
                loginModal.classList.remove('flex');
            }
            if (registerModal) {
                registerModal.classList.add('hidden');
                registerModal.classList.remove('flex');
            }
            
            // Load user-specific data if on main page
            if (window.loadUserBookings) {
                window.loadUserBookings();
            }
            
            // Load admin data if on admin page
            if (isAdminPage && window.loadAllBookings) {
                window.loadAllBookings();
            }
            
            // Check if user is admin
            checkAdminStatus(user);
            
            // Check if we need to redirect to admin page
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('admin') === 'true' && window.location.pathname.includes('index.html')) {
                window.location.href = 'admin.html';
            }
        } else {
            // User is signed out
            
            // Update desktop UI
            if (authSection) {
                authSection.innerHTML = `
                <button id="auth-button" class="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md font-medium transition duration-300">
                    Login
                </button>
                `;
                // Re-attach login button event listener
                document.getElementById('auth-button').addEventListener('click', () => {
                    loginModal.classList.remove('hidden');
                    loginModal.classList.add('flex');
                });
            }
            
            // Update mobile UI
            if (mobileUserProfile) {
                mobileUserProfile.classList.add('hidden');
            }
            
            if (document.getElementById('mobile-auth-buttons')) {
                document.getElementById('mobile-auth-buttons').classList.remove('hidden');
            }
            
            if (userProfile) userProfile.classList.add('hidden');
            
            // Redirect to main page if on admin page
            if (isAdminPage) {
                window.location.href = 'index.html';
            }
            
            // Always show calendar for guests, only hide bookings section
            if (bookingSystem) bookingSystem.classList.remove('hidden'); // Allow calendar viewing for guests
            if (bookingsSection) bookingsSection.classList.add('hidden');
        }
    });

    // Add close button functionality
    if (closeLoginBtn) {
        closeLoginBtn.addEventListener('click', () => {
            loginModal.classList.add('hidden');
            loginModal.classList.remove('flex');
        });
    }
    
    if (closeRegisterBtn) {
        closeRegisterBtn.addEventListener('click', () => {
            registerModal.classList.add('hidden');
            registerModal.classList.remove('flex');
        });
    }

    // Add click handler for backdrop
    if (mobileMenuBackdropElement) {
        mobileMenuBackdropElement.addEventListener('click', () => {
            console.log("Backdrop clicked");
            mobileMenuElement.classList.add('hidden');
            mobileMenuBackdropElement.classList.add('hidden');
            document.body.classList.remove('overflow-hidden', 'md:overflow-auto');
        });
        console.log("Backdrop click handler attached");
    }
    
    // Close mobile menu when clicking outside on small screens
    document.addEventListener('click', (e) => {
        // Only handle clicks when the menu is open
        if (!mobileMenuElement || mobileMenuElement.classList.contains('hidden')) {
            return;
        }
        
        // Close if clicking outside the menu and not on the menu button
        if (!mobileMenuElement.contains(e.target) && !mobileMenuBtnElement.contains(e.target)) {
            console.log("Clicked outside menu - closing");
            mobileMenuElement.classList.add('hidden');
            if (mobileMenuBackdropElement) {
                mobileMenuBackdropElement.classList.add('hidden');
            }
            document.body.classList.remove('overflow-hidden', 'md:overflow-auto');
        }
    });
    console.log("Document click handler attached");
}

// Initialize auth when DOM is loaded
document.addEventListener('DOMContentLoaded', initAuth); 