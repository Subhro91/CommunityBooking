/**
 * Admin Module
 * Handles booking management for administrators
 */

// DOM Elements
const totalBookingsElement = document.getElementById('total-bookings');
const pendingBookingsElement = document.getElementById('pending-bookings');
const approvedBookingsElement = document.getElementById('approved-bookings');
const deniedBookingsElement = document.getElementById('denied-bookings');
const adminBookingsList = document.getElementById('admin-bookings-list');
const searchBookingsInput = document.getElementById('search-bookings');
const filterStatusSelect = document.getElementById('filter-status');
const bookingDetailsModal = document.getElementById('booking-details-modal');
const closeDetailsModalBtn = document.getElementById('close-details-modal');
const approveBookingBtn = document.getElementById('approve-booking');
const denyBookingBtn = document.getElementById('deny-booking');

// Booking detail elements
const detailIdElement = document.getElementById('detail-id');
const detailStatusElement = document.getElementById('detail-status');
const detailUserElement = document.getElementById('detail-user');
const detailResourceElement = document.getElementById('detail-resource');
const detailDateElement = document.getElementById('detail-date');
const detailTimeElement = document.getElementById('detail-time');
const detailPurposeElement = document.getElementById('detail-purpose');
const detailCreatedElement = document.getElementById('detail-created');

// Global variables
let allBookings = [];
let filteredBookings = [];
let currentBooking = null;

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
 * Format timestamp for display
 * @param {Object} timestamp - Firestore timestamp
 * @returns {string} - Formatted date and time
 */
function formatTimestamp(timestamp) {
    if (!timestamp) return 'N/A';
    
    const date = timestamp.toDate();
    const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    };
    
    return date.toLocaleString('en-US', options);
}

/**
 * Update booking statistics
 */
function updateBookingStats() {
    const total = allBookings.length;
    const pending = allBookings.filter(b => b.status === 'pending').length;
    const approved = allBookings.filter(b => b.status === 'approved').length;
    const denied = allBookings.filter(b => b.status === 'denied').length;
    
    if (totalBookingsElement) totalBookingsElement.textContent = total;
    if (pendingBookingsElement) pendingBookingsElement.textContent = pending;
    if (approvedBookingsElement) approvedBookingsElement.textContent = approved;
    if (deniedBookingsElement) deniedBookingsElement.textContent = denied;
}

/**
 * Load all bookings
 */
function loadAllBookings() {
    window.authFunctions.showLoading();
    
    db.collection('bookings')
        .orderBy('createdAt', 'desc')
        .get()
        .then(snapshot => {
            allBookings = [];
            
            snapshot.forEach(doc => {
                const booking = {
                    id: doc.id,
                    ...doc.data()
                };
                
                allBookings.push(booking);
            });
            
            filteredBookings = [...allBookings];
            updateBookingStats();
            renderBookingsList();
            
            window.authFunctions.hideLoading();
        })
        .catch(error => {
            window.authFunctions.hideLoading();
            window.authFunctions.showNotification(`Error loading bookings: ${error.message}`, 'error');
        });
}

/**
 * Filter bookings based on search and status
 */
function filterBookings() {
    const searchTerm = searchBookingsInput ? searchBookingsInput.value.toLowerCase() : '';
    const statusFilter = filterStatusSelect ? filterStatusSelect.value : 'all';
    
    filteredBookings = allBookings.filter(booking => {
        // Filter by status
        if (statusFilter !== 'all' && booking.status !== statusFilter) {
            return false;
        }
        
        // Filter by search term
        if (searchTerm) {
            const searchableFields = [
                booking.bookingId,
                booking.userEmail,
                formatResourceName(booking.resource),
                booking.date,
                booking.purpose
            ].map(field => field ? field.toLowerCase() : '');
            
            return searchableFields.some(field => field.includes(searchTerm));
        }
        
        return true;
    });
    
    renderBookingsList();
}

/**
 * Render the bookings list
 */
function renderBookingsList() {
    if (!adminBookingsList) return;
    
    adminBookingsList.innerHTML = '';
    
    if (filteredBookings.length === 0) {
        adminBookingsList.innerHTML = '<tr><td colspan="8" class="text-center py-4">No bookings found</td></tr>';
        return;
    }
    
    filteredBookings.forEach(booking => {
        renderBookingRow(booking);
    });
}

/**
 * Render a booking row
 * @param {Object} booking - Booking data
 */
function renderBookingRow(booking) {
    const row = document.createElement('tr');
    row.className = 'border-b hover:bg-gray-50';
    
    // Format status badge
    const statusBadge = document.createElement('span');
    statusBadge.className = 'status-badge';
    
    if (booking.status === 'approved') {
        statusBadge.classList.add('status-badge-approved');
        statusBadge.textContent = 'Approved';
    } else if (booking.status === 'denied') {
        statusBadge.classList.add('status-badge-denied');
        statusBadge.textContent = 'Denied';
    } else {
        statusBadge.classList.add('status-badge-pending');
        statusBadge.textContent = 'Pending';
    }
    
    row.innerHTML = `
        <td class="py-3 px-4">${booking.bookingId || 'N/A'}</td>
        <td class="py-3 px-4">${booking.userEmail || 'N/A'}</td>
        <td class="py-3 px-4">${formatResourceName(booking.resource)}</td>
        <td class="py-3 px-4">${booking.date}</td>
        <td class="py-3 px-4">${formatTimeSlot(booking.timeSlot)}</td>
        <td class="py-3 px-4">${booking.purpose}</td>
        <td class="py-3 px-4"></td>
        <td class="py-3 px-4">
            <button class="action-btn action-btn-view" title="View Details">
                <i class="fas fa-eye"></i>
            </button>
            ${booking.status === 'pending' ? `
                <button class="action-btn action-btn-edit" title="Approve Booking">
                    <i class="fas fa-check"></i>
                </button>
                <button class="action-btn action-btn-delete" title="Deny Booking">
                    <i class="fas fa-times"></i>
                </button>
            ` : ''}
        </td>
    `;
    
    // Insert status badge
    row.querySelector('td:nth-child(7)').appendChild(statusBadge);
    
    // Add event listeners for action buttons
    const viewBtn = row.querySelector('.action-btn-view');
    viewBtn.addEventListener('click', () => {
        showBookingDetails(booking);
    });
    
    const approveBtn = row.querySelector('.action-btn-edit');
    if (approveBtn) {
        approveBtn.addEventListener('click', () => {
            updateBookingStatus(booking.id, 'approved');
        });
    }
    
    const denyBtn = row.querySelector('.action-btn-delete');
    if (denyBtn) {
        denyBtn.addEventListener('click', () => {
            updateBookingStatus(booking.id, 'denied');
        });
    }
    
    adminBookingsList.appendChild(row);
}

/**
 * Show booking details in modal
 * @param {Object} booking - Booking data
 */
function showBookingDetails(booking) {
    currentBooking = booking;
    
    detailIdElement.textContent = booking.bookingId || 'N/A';
    
    const statusText = booking.status.charAt(0).toUpperCase() + booking.status.slice(1);
    detailStatusElement.textContent = statusText;
    detailStatusElement.className = `font-medium status-badge status-badge-${booking.status}`;
    
    detailUserElement.textContent = booking.userEmail || 'N/A';
    detailResourceElement.textContent = formatResourceName(booking.resource);
    detailDateElement.textContent = booking.date;
    detailTimeElement.textContent = formatTimeSlot(booking.timeSlot);
    detailPurposeElement.textContent = booking.purpose;
    detailCreatedElement.textContent = booking.createdAt ? formatTimestamp(booking.createdAt) : 'N/A';
    
    // Show/hide action buttons based on status
    if (booking.status === 'pending') {
        approveBookingBtn.style.display = 'block';
        denyBookingBtn.style.display = 'block';
    } else {
        approveBookingBtn.style.display = 'none';
        denyBookingBtn.style.display = 'none';
    }
    
    bookingDetailsModal.classList.remove('hidden');
    bookingDetailsModal.classList.add('flex');
}

/**
 * Update booking status
 * @param {string} bookingId - Booking document ID
 * @param {string} status - New status (approved, denied)
 */
function updateBookingStatus(bookingId, status) {
    window.authFunctions.showLoading();
    
    db.collection('bookings')
        .doc(bookingId)
        .update({
            status,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedBy: auth.currentUser.email
        })
        .then(() => {
            window.authFunctions.hideLoading();
            
            const action = status === 'approved' ? 'approved' : 'denied';
            window.authFunctions.showNotification(`Booking ${action} successfully`, 'success');
            
            if (bookingDetailsModal.classList.contains('flex')) {
                bookingDetailsModal.classList.add('hidden');
                bookingDetailsModal.classList.remove('flex');
            }
            
            loadAllBookings();
        })
        .catch(error => {
            window.authFunctions.hideLoading();
            window.authFunctions.showNotification(`Error updating booking: ${error.message}`, 'error');
        });
}

// Event listeners
if (searchBookingsInput) {
    searchBookingsInput.addEventListener('input', filterBookings);
}

if (filterStatusSelect) {
    filterStatusSelect.addEventListener('change', filterBookings);
}

if (closeDetailsModalBtn) {
    closeDetailsModalBtn.addEventListener('click', () => {
        bookingDetailsModal.classList.add('hidden');
        bookingDetailsModal.classList.remove('flex');
    });
}

if (approveBookingBtn) {
    approveBookingBtn.addEventListener('click', () => {
        if (currentBooking) {
            updateBookingStatus(currentBooking.id, 'approved');
        }
    });
}

if (denyBookingBtn) {
    denyBookingBtn.addEventListener('click', () => {
        if (currentBooking) {
            updateBookingStatus(currentBooking.id, 'denied');
        }
    });
}

// Close modal when clicking outside
if (bookingDetailsModal) {
    bookingDetailsModal.addEventListener('click', (e) => {
        if (e.target === bookingDetailsModal) {
            bookingDetailsModal.classList.add('hidden');
            bookingDetailsModal.classList.remove('flex');
        }
    });
}

// Make loadAllBookings function available globally
window.loadAllBookings = loadAllBookings;

// Initialize
if (auth.currentUser && adminBookingsList) {
    loadAllBookings();
} 