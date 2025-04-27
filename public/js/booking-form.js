/**
 * Booking Form Module
 * Handles booking creation and management
 */

// DOM Elements
const bookingForm = document.getElementById('booking-form');
// bookingDateInput already declared in calendar.js
const bookingTimeSelect = document.getElementById('booking-time');
const bookingResourceSelect = document.getElementById('booking-resource');
const bookingPurposeTextarea = document.getElementById('booking-purpose');
// bookingModal already declared in calendar.js
const confirmationModal = document.getElementById('confirmation-modal');
const confBookingId = document.getElementById('conf-booking-id');
const confDate = document.getElementById('conf-date');
const confTime = document.getElementById('conf-time');
const confResource = document.getElementById('conf-resource');
const confPurpose = document.getElementById('conf-purpose');
const closeConfirmationBtn = document.getElementById('close-confirmation');
const bookingsList = document.getElementById('bookings-list');

/**
 * Generate a booking ID
 * @returns {string} - Generated booking ID
 */
function generateBookingId() {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `BK-${timestamp.toString().slice(-8)}${randomStr}`;
}

/**
 * Check if a time slot is available
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {string} timeSlot - Time slot in format "HH:MM-HH:MM"
 * @param {string} resource - Resource ID
 * @returns {Promise<boolean>} - Promise that resolves with availability
 */
function checkSlotAvailability(date, timeSlot, resource) {
    console.log("Checking availability for:", { date, timeSlot, resource });
    
    return db.collection('bookings')
        .where('date', '==', date)
        .where('timeSlot', '==', timeSlot)
        .where('resource', '==', resource)
        .get()
        .then(snapshot => {
            if (snapshot.empty) {
                return true; // No bookings, slot is available
            }
            
            // Check if all matching bookings are cancelled
            let allCancelled = true;
            snapshot.forEach(doc => {
                const booking = doc.data();
                if (booking.status !== 'cancelled') {
                    allCancelled = false;
                }
            });
            
            return allCancelled;
        })
        .catch(error => {
            console.error("Error checking availability:", error);
            window.authFunctions.showNotification(`Error checking availability: ${error.message}`, 'error');
            return false;
        });
}

/**
 * Create a new booking
 * @param {Object} bookingData - Booking data
 * @returns {Promise} - Promise that resolves with the booking reference
 */
function createBooking(bookingData) {
    console.log("Creating booking with data:", bookingData);
    
    try {
        if (!auth.currentUser) {
            return Promise.reject(new Error('You must be logged in to create a booking'));
        }
        
        // Add user ID and timestamp
        const enhancedData = {
            ...bookingData,
            userId: auth.currentUser.uid,
            userEmail: auth.currentUser.email,
            userName: auth.currentUser.displayName || auth.currentUser.email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'pending' // Initial status
        };
        
        console.log("Enhanced booking data:", enhancedData);
        
        // First check if the slot is available
        return checkSlotAvailability(bookingData.date, bookingData.timeSlot, bookingData.resource)
            .then(isAvailable => {
                if (!isAvailable) {
                    throw new Error('This slot has already been booked. Please select another time or resource.');
                }
                
                // Create the booking document
                return db.collection('bookings')
                    .add(enhancedData)
                    .then(docRef => {
                        // Update the document with its ID
                        const bookingId = generateBookingId();
                        console.log("Booking created with ID:", docRef.id, "and bookingId:", bookingId);
                        return docRef.update({
                            bookingId: bookingId
                        }).then(() => {
                            return {
                                ...enhancedData,
                                id: docRef.id,
                                bookingId: bookingId
                            };
                        });
                    });
            })
            .catch(error => {
                console.error("Error creating booking:", error);
                throw error;
            });
    } catch (error) {
        console.error("Exception in createBooking:", error);
        return Promise.reject(error);
    }
}

/**
 * Format resource display name
 * @param {string} resourceId - Resource ID
 * @returns {string} - Formatted resource name
 */
function formatResourceName(resourceId) {
    const resourceMap = {
        'community-hall': 'Community Hall',
        'sports-ground': 'Sports Ground',
        'meeting-room': 'Meeting Room'
    };
    
    return resourceMap[resourceId] || resourceId;
}

/**
 * Format time slot for display
 * @param {string} timeSlot - Time slot in format "HH:MM-HH:MM"
 * @returns {string} - Formatted time slot
 */
function formatTimeSlot(timeSlot) {
    if (!timeSlot) return '';
    
    const [start, end] = timeSlot.split('-');
    
    // Convert 24h format to 12h format
    function formatTime(time) {
        const [hours, minutes] = time.split(':');
        const hoursNum = parseInt(hours, 10);
        const period = hoursNum >= 12 ? 'PM' : 'AM';
        const hours12 = hoursNum % 12 || 12;
        return `${hours12}:${minutes} ${period}`;
    }
    
    return `${formatTime(start)} - ${formatTime(end)}`;
}

/**
 * Show booking confirmation
 * @param {Object} booking - Booking data
 */
function showBookingConfirmation(booking) {
    confBookingId.textContent = booking.bookingId;
    confDate.textContent = booking.date;
    confTime.textContent = formatTimeSlot(booking.timeSlot);
    confResource.textContent = formatResourceName(booking.resource);
    confPurpose.textContent = booking.purpose;
    
    // Hide booking modal
    bookingModal.classList.add('hidden');
    bookingModal.classList.remove('flex');
    
    // Show confirmation modal
    confirmationModal.classList.remove('hidden');
    confirmationModal.classList.add('flex');
}

/**
 * Load user's bookings
 */
function loadUserBookings() {
    if (!auth.currentUser) return;
    
    window.authFunctions.showLoading();
    
    db.collection('bookings')
        .where('userId', '==', auth.currentUser.uid)
        .orderBy('date', 'desc')
        .get()
        .then(snapshot => {
            if (bookingsList) {
                bookingsList.innerHTML = '';
                
                if (snapshot.empty) {
                    bookingsList.innerHTML = '<tr><td colspan="6" class="text-center py-4">No bookings found</td></tr>';
                    // Update pagination info to show no results
                    updatePagination(0, 0, 0);
                } else {
                    // Filter out cancelled bookings
                    const activeBookings = snapshot.docs.filter(doc => {
                        const data = doc.data();
                        return data.status !== 'cancelled';
                    });
                    
                    // For simplicity, we'll show all active bookings without pagination for now
                    const totalBookings = activeBookings.length;
                    
                    if (totalBookings === 0) {
                        bookingsList.innerHTML = '<tr><td colspan="6" class="text-center py-4">No active bookings found</td></tr>';
                        updatePagination(0, 0, 0);
                    } else {
                        updatePagination(1, totalBookings, totalBookings);
                        
                        activeBookings.forEach(doc => {
                            const bookingData = doc.data();
                            const booking = {
                                id: doc.id,
                                ...bookingData,
                                // Ensure all bookings have a status
                                status: bookingData.status || 'pending'
                            };
                            
                            renderBookingRow(booking);
                        });
                    }
                }
            }
            
            window.authFunctions.hideLoading();
        })
        .catch(error => {
            window.authFunctions.hideLoading();
            window.authFunctions.showNotification(`Error loading bookings: ${error.message}`, 'error');
        });
}

/**
 * Update pagination information
 * @param {number} start - Start index
 * @param {number} end - End index
 * @param {number} total - Total number of results
 */
function updatePagination(start, end, total) {
    const paginationInfo = document.getElementById('pagination-info');
    const paginationNumbers = document.getElementById('pagination-numbers');
    
    if (paginationInfo) {
        if (total === 0) {
            paginationInfo.textContent = 'No bookings found';
        } else {
            paginationInfo.textContent = `Showing ${start} to ${end} of ${total} booking${total !== 1 ? 's' : ''}`;
        }
    }
    
    if (paginationNumbers) {
        paginationNumbers.innerHTML = '';
        // For now, just show page 1 as active
        const pageBtn = document.createElement('button');
        pageBtn.className = 'border-t border-b border-r px-3 py-1 bg-teal-600 text-white';
        pageBtn.textContent = '1';
        paginationNumbers.appendChild(pageBtn);
    }
}

/**
 * Render a row in the bookings table
 * @param {Object} booking - Booking data
 */
function renderBookingRow(booking) {
    const row = document.createElement('tr');
    row.className = 'border-b hover:bg-gray-50';
    
    // Add a class for cancelled bookings
    if (booking.status === 'cancelled') {
        row.classList.add('opacity-60');
    }
    
    // Format the status for display
    const statusClass = booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                        booking.status === 'confirmed' ? 'bg-green-100 text-green-800' : 
                        booking.status === 'cancelled' ? 'bg-red-100 text-red-800' : 
                        'bg-gray-100 text-gray-800';
    
    const statusText = booking.status ? (booking.status.charAt(0).toUpperCase() + booking.status.slice(1)) : 'Pending';
    
    row.innerHTML = `
        <td class="py-3 px-4">${booking.bookingId || 'N/A'}</td>
        <td class="py-3 px-4">${formatResourceName(booking.resource)}</td>
        <td class="py-3 px-4">${booking.date}</td>
        <td class="py-3 px-4">${formatTimeSlot(booking.timeSlot)}</td>
        <td class="py-3 px-4">${booking.purpose}</td>
        <td class="py-3 px-4">
            <span class="px-2 py-1 text-xs rounded-full ${statusClass} mr-2">
                ${statusText}
            </span>
            <button class="action-btn action-btn-view" title="View Details">
                <i class="fas fa-eye"></i>
            </button>
            ${booking.status !== 'cancelled' ? `
            <button class="action-btn action-btn-delete" title="Cancel Booking">
                <i class="fas fa-trash"></i>
            </button>
            ` : ''}
        </td>
    `;
    
    // Add event listener for view button
    const viewBtn = row.querySelector('.action-btn-view');
    viewBtn.addEventListener('click', () => {
        // View booking details (can be implemented later)
        window.authFunctions.showNotification('Viewing details coming soon!', 'info');
    });
    
    // Add event listener for delete button if it exists
    const deleteBtn = row.querySelector('.action-btn-delete');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
            cancelBooking(booking.id);
        });
    }
    
    bookingsList.appendChild(row);
}

/**
 * Cancel a booking
 */
function cancelBooking(bookingId) {
    if (!auth.currentUser) return;
    
    // Ask for confirmation
    if (!confirm('Are you sure you want to cancel this booking?')) {
        return;
    }
    
    window.authFunctions.showLoading();
    
    db.collection('bookings').doc(bookingId).update({
        status: 'cancelled',
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        window.authFunctions.hideLoading();
        window.authFunctions.showNotification('Booking cancelled successfully', 'success');
        
        // Remove the booking row from the UI by reloading user bookings
        // This will filter out cancelled bookings as updated in loadUserBookings
        loadUserBookings();
    })
    .catch(error => {
        window.authFunctions.hideLoading();
        window.authFunctions.showNotification(`Error cancelling booking: ${error.message}`, 'error');
    });
}

// Event listeners
if (bookingForm) {
    bookingForm.addEventListener('submit', (e) => {
        e.preventDefault();
        console.log("Booking form submitted");
        
        // Get form values
        const dateInput = bookingDateInput.value;
        const timeSlot = bookingTimeSelect.value;
        const resource = bookingResourceSelect.value;
        const purpose = bookingPurposeTextarea.value;
        
        console.log("Form values:", { dateInput, timeSlot, resource, purpose });
        
        // Validate form
        if (!dateInput || !timeSlot || !resource || !purpose) {
            window.authFunctions.showNotification('Please fill in all fields', 'error');
            return;
        }
        
        // Check if user is authenticated
        if (!auth.currentUser) {
            console.log("User not authenticated, showing login prompt");
            window.authFunctions.showNotification('Please log in to make a booking', 'error');
            // Show login modal (don't redeclare loginModal)
            const loginModal = document.getElementById('login-modal');
            if (loginModal) {
                loginModal.classList.remove('hidden');
                loginModal.classList.add('flex');
            }
            return;
        }
        
        // Convert display date to YYYY-MM-DD format
        const dateParts = dateInput.split(' ');
        const monthName = dateParts[0];
        const day = parseInt(dateParts[1].replace(',', ''), 10);
        const year = parseInt(dateParts[2], 10);
        
        const monthIndex = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ].indexOf(monthName);
        
        const date = new Date(year, monthIndex, day);
        const formattedDate = window.calendarFunctions.formatDate(date);
        
        console.log("Formatted date:", formattedDate);
        
        window.authFunctions.showLoading();
        
        // Check availability
        checkSlotAvailability(formattedDate, timeSlot, resource)
            .then(isAvailable => {
                if (!isAvailable) {
                    window.authFunctions.hideLoading();
                    window.authFunctions.showNotification('This slot is already booked. Please select another time or resource.', 'error');
                    return;
                }
                
                // Create booking
                const bookingData = {
                    date: formattedDate,
                    timeSlot,
                    resource,
                    purpose
                };
                
                console.log("Creating booking with data:", bookingData);
                
                createBooking(bookingData)
                    .then(booking => {
                        window.authFunctions.hideLoading();
                        showBookingConfirmation(booking);
                        bookingForm.reset();
                        
                        // Reload calendar and bookings
                        window.calendarFunctions.loadMonthBookings().then(() => {
                            window.calendarFunctions.renderCalendar();
                        });
                        loadUserBookings();
                    })
                    .catch(error => {
                        console.error("Error creating booking:", error);
                        window.authFunctions.hideLoading();
                        window.authFunctions.showNotification(`Error creating booking: ${error.message || 'Unknown error'}. Please try again or check the console for details.`, 'error');
                    });
            })
            .catch(error => {
                console.error("Error checking availability:", error);
                window.authFunctions.hideLoading();
                window.authFunctions.showNotification(`Error checking availability: ${error.message || 'Unknown error'}`, 'error');
            });
    });
}

if (closeConfirmationBtn) {
    closeConfirmationBtn.addEventListener('click', () => {
        confirmationModal.classList.add('hidden');
        confirmationModal.classList.remove('flex');
    });
}

// Close confirmation modal when clicking outside
if (confirmationModal) {
    confirmationModal.addEventListener('click', (e) => {
        if (e.target === confirmationModal) {
            confirmationModal.classList.add('hidden');
            confirmationModal.classList.remove('flex');
        }
    });
}

// Make user bookings function available globally
window.loadUserBookings = loadUserBookings;

// Initialize
if (auth.currentUser && bookingsList) {
    loadUserBookings();
} 