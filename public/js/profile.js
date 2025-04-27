/**
 * Profile Module
 * Handles user profile, booking history, and account settings
 */

// DOM Elements
const profileButton = document.getElementById('profile-button');
const profileModal = document.getElementById('profile-modal');
const closeProfileBtn = document.getElementById('close-profile-modal');
const profileTabs = document.querySelectorAll('.profile-tab-button');
const tabContents = document.querySelectorAll('.profile-tab-content');
const activeBookingsList = document.getElementById('active-bookings-list');
const pastBookingsList = document.getElementById('past-bookings-list');
const profileForm = document.getElementById('profile-form');
const displayNameInput = document.getElementById('display-name');
const emailNotificationsCheckbox = document.getElementById('email-notifications');

// Variables to track pagination
let activeBookingsPage = 1;
let pastBookingsPage = 1;
const ITEMS_PER_PAGE = 5;

/**
 * Initialize profile functionality
 */
function initProfile() {
    console.log("Initializing profile module");
    
    // Force re-selection of DOM elements to ensure we have the latest
    const profileButtonEl = document.getElementById('profile-button');
    const profileModalEl = document.getElementById('profile-modal');
    const closeProfileBtnEl = document.getElementById('close-profile-modal');
    const profileTabsEl = document.querySelectorAll('.profile-tab-button');
    
    console.log("Profile button:", profileButtonEl);
    console.log("Profile modal:", profileModalEl);
    console.log("Close profile button:", closeProfileBtnEl);
    console.log("Profile tabs found:", profileTabsEl ? profileTabsEl.length : 0);
    
    // Only attach event listeners if elements exist
    if (profileButtonEl) {
        console.log("Attaching click event to profile button");
        profileButtonEl.addEventListener('click', openProfileModal);
    }
    
    if (closeProfileBtnEl) {
        console.log("Attaching click event to close button");
        closeProfileBtnEl.addEventListener('click', (e) => {
            console.log("Close button clicked");
            e.preventDefault();
            e.stopPropagation();
            closeProfileModal();
        });
    }
    
    if (profileTabsEl && profileTabsEl.length > 0) {
        console.log("Attaching events to", profileTabsEl.length, "tabs");
        profileTabsEl.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                const tabName = tab.getAttribute('data-tab');
                console.log("Tab clicked:", tabName);
                switchTab(tabName);
            });
        });
    } else {
        console.error("No profile tabs found during initialization");
    }
    
    if (profileForm) {
        profileForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveProfileChanges();
        });
    }
    
    if (profileModalEl) {
        profileModalEl.addEventListener('click', (e) => {
            if (e.target === profileModalEl) {
                closeProfileModal();
            }
        });
    }
    
    // Check if user is authenticated
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            // Load profile data - no need to pass user ID since profile functions
            // access the current user directly from Firebase Auth
            loadProfile();
        }
    });
}

/**
 * Open profile modal and load data
 */
function openProfileModal() {
    console.log("Opening profile modal");
    
    const profileModal = document.getElementById('profile-modal');
    if (!profileModal) {
        console.error("Profile modal element not found");
        return;
    }
    
    // Reset to active tab
    switchTab('active');
    
    // Show modal
    profileModal.classList.remove('hidden');
    profileModal.classList.add('flex');
    
    // Load bookings
    loadActiveBookings();
}

/**
 * Close profile modal
 */
function closeProfileModal() {
    console.log("Closing profile modal");
    
    const profileModal = document.getElementById('profile-modal');
    if (!profileModal) {
        console.error("Profile modal element not found");
        return;
    }
    
    profileModal.classList.add('hidden');
    profileModal.classList.remove('flex');
}

/**
 * Switch between tabs in the user dashboard
 */
function switchTab(tabName) {
    console.log("Switching to tab:", tabName);
    
    // Hide all tab contents
    const tabContents = document.querySelectorAll('.profile-tab-content');
    tabContents.forEach(tab => {
        tab.classList.add('hidden');
    });
    
    // Remove active state from all tab buttons
    const tabButtons = document.querySelectorAll('.profile-tab-button');
    tabButtons.forEach(button => {
        button.classList.remove('border-teal-500', 'text-teal-600');
        button.classList.add('border-transparent', 'text-gray-500');
    });
    
    // Show selected tab content
    let tabId;
    if (tabName === 'account') {
        tabId = 'account-settings-tab';
    } else {
        tabId = `${tabName}-bookings-tab`;
    }
    
    const selectedTab = document.getElementById(tabId);
    const selectedButton = document.querySelector(`.profile-tab-button[data-tab="${tabName}"]`);
    
    if (selectedTab && selectedButton) {
        selectedTab.classList.remove('hidden');
        selectedButton.classList.remove('border-transparent', 'text-gray-500');
        selectedButton.classList.add('border-teal-500', 'text-teal-600');
        
        // Load content based on the selected tab
        if (tabName === 'active') {
            loadActiveBookings();
        } else if (tabName === 'past') {
            loadPastBookings();
        } else if (tabName === 'account') {
            loadProfile();
        }
    } else {
        console.error("Tab or button not found:", tabName);
    }
}

/**
 * Format time slot for display
 * @param {string} timeSlot - Time slot in format "HH:MM"
 * @returns {string} Formatted time slot
 */
function formatTimeSlot(timeSlot) {
    const timeSlotMap = {
        "09:00": "9:00 AM - 10:00 AM",
        "10:00": "10:00 AM - 11:00 AM",
        "11:00": "11:00 AM - 12:00 PM",
        "12:00": "12:00 PM - 1:00 PM",
        "13:00": "1:00 PM - 2:00 PM",
        "14:00": "2:00 PM - 3:00 PM",
        "15:00": "3:00 PM - 4:00 PM",
        "16:00": "4:00 PM - 5:00 PM"
    };
    
    return timeSlotMap[timeSlot] || timeSlot;
}

/**
 * Load active bookings for the current user
 */
function loadActiveBookings() {
    const activeBookingsList = document.getElementById('active-bookings-list');
    
    // Check if element exists
    if (!activeBookingsList) {
        console.error("Active bookings list element not found");
        return;
    }
    
    // Show loading message
    activeBookingsList.innerHTML = '<div class="text-center py-8 text-gray-500">Loading your bookings...</div>';
    
    // Check if user is logged in
    const currentUser = auth.currentUser;
    if (!currentUser) {
        activeBookingsList.innerHTML = '<div class="text-center py-8 text-yellow-500">Please log in to view your bookings</div>';
        return;
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get current and future bookings, excluding cancelled ones
    db.collection('bookings')
        .where('userId', '==', currentUser.uid)
        .where('date', '>=', today.toISOString().split('T')[0])
        .orderBy('date', 'asc')
        .get()
        .then(snapshot => {
            if (snapshot.empty) {
                activeBookingsList.innerHTML = '<div class="text-center py-8 text-gray-500">No upcoming bookings found</div>';
                return;
            }
            
            let bookingsHTML = '';
            let activeBookingsCount = 0;
            
            snapshot.forEach(doc => {
                const booking = doc.data();
                const bookingId = doc.id;
                
                // Skip cancelled bookings
                if (booking.status === 'cancelled') {
                    return;
                }
                
                activeBookingsCount++;
                const bookingDate = new Date(booking.date);
                const formattedDate = bookingDate.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'long', 
                    day: 'numeric', 
                    year: 'numeric' 
                });
                
                // Format resource name
                let resourceName = booking.resource;
                if (resourceName === 'conference-room-a') {
                    resourceName = 'Conference Room A';
                } else if (resourceName === 'conference-room-b') {
                    resourceName = 'Conference Room B';
                } else if (resourceName === 'meeting-pod-1') {
                    resourceName = 'Meeting Pod 1';
                } else if (resourceName === 'meeting-pod-2') {
                    resourceName = 'Meeting Pod 2';
                }
                
                // Format the time slot
                const formattedTimeSlot = formatTimeSlot(booking.timeSlot);
                
                const statusClass = booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                                   booking.status === 'confirmed' ? 'bg-green-100 text-green-800' : 
                                   'bg-gray-100 text-gray-800';
                
                bookingsHTML += `
                    <div class="bg-white rounded-lg shadow-md p-4 mb-4">
                        <div class="flex justify-between items-start">
                            <div>
                                <h3 class="font-medium text-gray-900">${resourceName}</h3>
                                <p class="text-gray-600">${formattedDate}</p>
                                <p class="text-gray-600">${formattedTimeSlot}</p>
                                <div class="mt-2">
                                    <span class="px-2 py-1 text-xs rounded-full ${statusClass}">
                                        ${booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                    </span>
                                </div>
                            </div>
                            <div>
                                ${booking.status !== 'cancelled' ? 
                                `<button class="cancel-booking-btn text-sm px-3 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded" 
                                         data-booking-id="${bookingId}">
                                    Cancel
                                </button>` : ''}
                            </div>
                        </div>
                    </div>
                `;
            });
            
            if (activeBookingsCount === 0) {
                activeBookingsList.innerHTML = '<div class="text-center py-8 text-gray-500">No upcoming bookings found</div>';
                return;
            }
            
            activeBookingsList.innerHTML = bookingsHTML;
            
            // Add event listeners to cancel buttons
            const cancelButtons = activeBookingsList.querySelectorAll('.cancel-booking-btn');
            cancelButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const bookingId = button.getAttribute('data-booking-id');
                    cancelBooking(bookingId);
                });
            });
        })
        .catch(error => {
            console.error("Error loading active bookings:", error);
            activeBookingsList.innerHTML = `<div class="text-center py-8 text-red-500">Error loading bookings: ${error.message}</div>`;
        });
}

/**
 * Load past bookings for the current user
 */
function loadPastBookings() {
    const pastBookingsList = document.getElementById('past-bookings-list');
    
    // Check if element exists
    if (!pastBookingsList) {
        console.error("Past bookings list element not found");
        return;
    }
    
    // Show loading message
    pastBookingsList.innerHTML = '<div class="text-center py-8 text-gray-500">Loading your past bookings...</div>';
    
    // Check if user is logged in
    const currentUser = auth.currentUser;
    if (!currentUser) {
        pastBookingsList.innerHTML = '<div class="text-center py-8 text-yellow-500">Please log in to view your bookings</div>';
        return;
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get past bookings
    db.collection('bookings')
        .where('userId', '==', currentUser.uid)
        .where('date', '<', today.toISOString().split('T')[0])
        .orderBy('date', 'desc')
        .get()
        .then(snapshot => {
            if (snapshot.empty) {
                pastBookingsList.innerHTML = '<div class="text-center py-8 text-gray-500">No past bookings found</div>';
                return;
            }
            
            let bookingsHTML = '';
            let bookingsCount = 0;
            
            snapshot.forEach(doc => {
                bookingsCount++;
                const booking = doc.data();
                const bookingDate = new Date(booking.date);
                const formattedDate = bookingDate.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'long', 
                    day: 'numeric', 
                    year: 'numeric' 
                });
                
                // Format resource name
                let resourceName = booking.resource;
                if (resourceName === 'conference-room-a') {
                    resourceName = 'Conference Room A';
                } else if (resourceName === 'conference-room-b') {
                    resourceName = 'Conference Room B';
                } else if (resourceName === 'meeting-pod-1') {
                    resourceName = 'Meeting Pod 1';
                } else if (resourceName === 'meeting-pod-2') {
                    resourceName = 'Meeting Pod 2';
                }
                
                // Format the time slot
                const formattedTimeSlot = formatTimeSlot(booking.timeSlot);
                
                const statusClass = booking.status === 'cancelled' ? 'bg-red-100 text-red-800' : 
                                   booking.status === 'completed' ? 'bg-blue-100 text-blue-800' : 
                                   'bg-gray-100 text-gray-800';
                
                bookingsHTML += `
                    <div class="bg-white rounded-lg shadow-md p-4 mb-4">
                        <div class="flex justify-between items-start">
                            <div>
                                <h3 class="font-medium text-gray-900">${resourceName}</h3>
                                <p class="text-gray-600">${formattedDate}</p>
                                <p class="text-gray-600">${formattedTimeSlot}</p>
                                <div class="mt-2">
                                    <span class="px-2 py-1 text-xs rounded-full ${statusClass}">
                                        ${booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            });
            
            if (bookingsCount === 0) {
                pastBookingsList.innerHTML = '<div class="text-center py-8 text-gray-500">No past bookings found</div>';
                return;
            }
            
            pastBookingsList.innerHTML = bookingsHTML;
        })
        .catch(error => {
            console.error("Error loading past bookings:", error);
            pastBookingsList.innerHTML = `<div class="text-center py-8 text-red-500">Error loading bookings: ${error.message}</div>`;
        });
}

/**
 * Cancel a booking
 * @param {string} bookingId - ID of the booking to cancel
 */
function cancelBooking(bookingId) {
    if (!confirm('Are you sure you want to cancel this booking?')) {
        return;
    }
    
    window.authFunctions.showLoading();
    
    // Get the booking first to verify ownership
    db.collection('bookings').doc(bookingId).get()
        .then(doc => {
            if (!doc.exists) {
                throw new Error('Booking not found');
            }
            
            const bookingData = doc.data();
            
            // Verify the current user owns this booking
            if (bookingData.userId !== auth.currentUser.uid) {
                throw new Error('You do not have permission to cancel this booking');
            }
            
            // Update booking status instead of deleting
            return db.collection('bookings').doc(bookingId).update({
                status: 'cancelled',
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        })
        .then(() => {
            window.authFunctions.hideLoading();
            window.authFunctions.showNotification('Booking cancelled successfully', 'success');
            
            // Reload bookings list
            loadActiveBookings();
            
            // Refresh calendar
            if (window.calendarFunctions && window.calendarFunctions.loadMonthBookings) {
                window.calendarFunctions.loadMonthBookings().then(() => {
                    if (window.calendarFunctions.renderCalendar) {
                        window.calendarFunctions.renderCalendar();
                    }
                });
            }
            
            // Refresh main bookings list if available
            if (window.loadUserBookings) {
                window.loadUserBookings();
            }
        })
        .catch(error => {
            window.authFunctions.hideLoading();
            window.authFunctions.showNotification(`Error cancelling booking: ${error.message}`, 'error');
        });
}

/**
 * Load user account settings
 */
function loadAccountSettings() {
    console.log("Loading account settings");
    const displayNameInput = document.getElementById('display-name');
    const emailNotificationsCheckbox = document.getElementById('email-notifications');
    
    if (!displayNameInput || !emailNotificationsCheckbox) {
        console.error("Account settings form elements not found", {
            displayNameInput: !!displayNameInput,
            emailNotificationsCheckbox: !!emailNotificationsCheckbox
        });
        window.authFunctions.showNotification("Error loading profile settings", 'error');
        return;
    }
    
    if (!firebase.auth().currentUser) {
        window.authFunctions.showNotification("Please log in to view your account settings", 'error');
        return;
    }
    
    const userId = firebase.auth().currentUser.uid;
    
    try {
        // Get user profile from Firestore
        db.collection('users').doc(userId).get()
            .then(doc => {
                if (doc.exists) {
                    const userData = doc.data();
                    
                    // Fill form with user data
                    if (displayNameInput) {
                        displayNameInput.value = userData.displayName || '';
                    }
                    
                    if (emailNotificationsCheckbox) {
                        emailNotificationsCheckbox.checked = userData.emailNotifications || false;
                    }
                } else {
                    // Create default profile if it doesn't exist
                    const defaultProfile = {
                        displayName: firebase.auth().currentUser.displayName || '',
                        emailNotifications: true,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    };
                    
                    return db.collection('users').doc(userId).set(defaultProfile)
                        .then(() => {
                            if (displayNameInput) {
                                displayNameInput.value = defaultProfile.displayName;
                            }
                            
                            if (emailNotificationsCheckbox) {
                                emailNotificationsCheckbox.checked = defaultProfile.emailNotifications;
                            }
                        });
                }
            })
            .catch(error => {
                console.error("Error loading profile:", error);
                window.authFunctions.showNotification(`Error loading profile: ${error.message}`, 'error');
            });
    } catch (error) {
        console.error("Exception in loadAccountSettings:", error);
        window.authFunctions.showNotification(`Error: ${error.message}`, 'error');
    }
}

/**
 * Save profile changes
 */
function saveProfileChanges() {
    console.log("Saving profile changes");
    
    const displayNameInput = document.getElementById('display-name');
    const emailNotificationsCheckbox = document.getElementById('email-notifications');
    
    if (!displayNameInput || !emailNotificationsCheckbox) {
        console.error("Profile form elements not found", {
            displayNameInput: !!displayNameInput,
            emailNotificationsCheckbox: !!emailNotificationsCheckbox
        });
        window.authFunctions.showNotification("Error saving profile: Form elements not found", 'error');
        return;
    }
    
    if (!firebase.auth().currentUser) {
        window.authFunctions.showNotification("You must be logged in to save profile changes", 'error');
        return;
    }
    
    const userId = firebase.auth().currentUser.uid;
    const displayName = displayNameInput.value.trim();
    const emailNotifications = emailNotificationsCheckbox.checked;
    
    try {
        window.authFunctions.showLoading();
        
        // Update Firestore profile
        db.collection('users').doc(userId).set({
            displayName,
            emailNotifications,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true })
            .then(() => {
                window.authFunctions.hideLoading();
                window.authFunctions.showNotification('Profile updated successfully', 'success');
                
                // Update display name in Firebase Auth if changed
                if (displayName && displayName !== firebase.auth().currentUser.displayName) {
                    return firebase.auth().currentUser.updateProfile({
                        displayName
                    });
                }
            })
            .then(() => {
                // Reload profile data to show updated values
                loadProfile();
            })
            .catch(error => {
                console.error("Error updating profile:", error);
                window.authFunctions.hideLoading();
                window.authFunctions.showNotification(`Error updating profile: ${error.message}`, 'error');
            });
    } catch (error) {
        console.error("Exception in saveProfileChanges:", error);
        window.authFunctions.hideLoading();
        window.authFunctions.showNotification(`Error: ${error.message}`, 'error');
    }
}

/**
 * Load user profile data from Firestore
 */
function loadUserProfile() {
    const displayNameInput = document.getElementById('displayName');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    const profileStatusMsg = document.getElementById('profile-status-message');
    
    // Check if elements exist
    if (!displayNameInput || !emailInput || !phoneInput || !profileStatusMsg) {
        console.error("One or more profile form elements not found");
        return;
    }
    
    // Clear previous status
    profileStatusMsg.textContent = '';
    profileStatusMsg.className = 'text-gray-500 mt-2';
    profileStatusMsg.textContent = 'Loading profile data...';
    
    // Check if user is logged in
    const currentUser = auth.currentUser;
    if (!currentUser) {
        profileStatusMsg.className = 'text-yellow-500 mt-2';
        profileStatusMsg.textContent = 'Please log in to view your profile';
        return;
    }
    
    // Set default values from Firebase Auth
    displayNameInput.value = currentUser.displayName || '';
    emailInput.value = currentUser.email || '';
    
    // Get additional user data from Firestore
    db.collection('users').doc(currentUser.uid).get()
        .then(doc => {
            if (doc.exists) {
                const userData = doc.data();
                // Set phone number if it exists
                if (userData.phone) {
                    phoneInput.value = userData.phone;
                }
            }
            profileStatusMsg.textContent = '';
        })
        .catch(error => {
            console.error("Error loading user profile:", error);
            profileStatusMsg.className = 'text-red-500 mt-2';
            profileStatusMsg.textContent = `Error loading profile: ${error.message}`;
        });
}

/**
 * Load user profile data into the profile form
 */
function loadProfile() {
    console.log("Loading profile data");
    
    const displayNameInput = document.getElementById('display-name');
    const emailDisplay = document.getElementById('email-display');
    const emailNotificationsCheckbox = document.getElementById('email-notifications');
    
    if (!displayNameInput || !emailDisplay) {
        console.error("Profile form elements not found");
        window.authFunctions.showNotification("Error: Profile form elements not found", 'error');
        return;
    }
    
    // Reset form
    displayNameInput.value = '';
    emailDisplay.textContent = '';
    
    if (emailNotificationsCheckbox) {
        emailNotificationsCheckbox.checked = false;
    }
    
    const currentUser = firebase.auth().currentUser;
    if (!currentUser) {
        window.authFunctions.showNotification("Please log in to view your profile", 'error');
        return;
    }
    
    // Set display name and email from Firebase Auth
    displayNameInput.value = currentUser.displayName || '';
    emailDisplay.textContent = currentUser.email || 'No email available';
    
    // Get additional profile data from Firestore
    db.collection('users').doc(currentUser.uid).get()
        .then(doc => {
            if (doc.exists && doc.data()) {
                const userData = doc.data();
                
                // Set email notification preference
                if (emailNotificationsCheckbox && userData.emailNotifications !== undefined) {
                    emailNotificationsCheckbox.checked = userData.emailNotifications;
                }
            } else {
                console.log("No user data found in Firestore, using defaults");
            }
        })
        .catch(error => {
            console.error("Error loading user data:", error);
            window.authFunctions.showNotification(`Error loading profile: ${error.message}`, 'error');
        });
}

// Replace the DOM ready handler with a more robust approach
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM loaded - initializing profile");
    
    // This ensures we wait for everything to be fully rendered
    setTimeout(() => {
        initProfile();
        
        // Add a global click handler for profile button as a fallback
        document.addEventListener('click', (e) => {
            const profileButton = e.target.closest('#profile-button');
            if (profileButton) {
                console.log("Profile button clicked via global handler");
                openProfileModal();
            }
            
            // Check for close button clicks
            const closeButton = e.target.closest('#close-profile-modal');
            if (closeButton) {
                console.log("Close button clicked via global handler");
                e.preventDefault();
                e.stopPropagation();
                closeProfileModal();
            }
            
            // Check for tab clicks
            const tabButton = e.target.closest('.profile-tab-button');
            if (tabButton) {
                console.log("Tab button clicked via global handler");
                e.preventDefault();
                const tabName = tabButton.getAttribute('data-tab');
                if (tabName) {
                    console.log("Switching to tab:", tabName);
                    switchTab(tabName);
                }
            }
        });
    }, 1000);
});

// Make booking functions available globally
window.loadActiveBookings = loadActiveBookings;
window.loadPastBookings = loadPastBookings; 