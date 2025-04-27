/**
 * Calendar Module
 * Handles rendering the calendar and managing date selection
 */

// DOM Elements
const calendarDaysElement = document.getElementById('calendar-days');
const monthYearElement = document.getElementById('month-year');
const prevMonthBtn = document.getElementById('prev-month');
const nextMonthBtn = document.getElementById('next-month');
const bookingModal = document.getElementById('booking-modal');
const bookingDateInput = document.getElementById('booking-date');
const closeBookingModalBtn = document.getElementById('close-booking-modal');
const cancelBookingBtn = document.getElementById('cancel-booking');
const newBookingBtn = document.getElementById('new-booking-btn');

// DOM Elements for dropdown functionality
const viewSelect = document.getElementById('view-select');
const filtersSelect = document.getElementById('filters-select');

// Global variables
let currentDate = new Date();
let selectedDate = null;
let bookings = [];

/**
 * Format date as YYYY-MM-DD
 * @param {Date} date - The date to format
 * @returns {string} - Formatted date string
 */
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Format date for display (e.g., April 15, 2025)
 * @param {Date} date - The date to format
 * @returns {string} - Formatted date string
 */
function formatDisplayDate(date) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

/**
 * Load bookings for the current month
 * @returns {Promise} - Promise that resolves with the bookings
 */
function loadMonthBookings() {
    if (!auth.currentUser) return Promise.resolve([]);
    
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    const startDateStr = formatDate(startOfMonth);
    const endDateStr = formatDate(endOfMonth);
    
    return db.collection('bookings')
        .where('date', '>=', startDateStr)
        .where('date', '<=', endDateStr)
        .get()
        .then(snapshot => {
            bookings = [];
            snapshot.forEach(doc => {
                const bookingData = doc.data();
                bookings.push({
                    id: doc.id,
                    ...bookingData,
                    // Ensure all bookings have a status
                    status: bookingData.status || 'pending'
                });
            });
            return bookings;
        })
        .catch(error => {
            window.authFunctions.showNotification(`Error loading bookings: ${error.message}`, 'error');
            return [];
        });
}

/**
 * Check availability for a specific date
 * @param {string} dateStr - The date to check in YYYY-MM-DD format
 * @returns {Object} - Availability info with status and available slots
 */
function getDateAvailability(dateStr) {
    // Filter bookings for this date, excluding cancelled bookings
    const dateBookings = bookings.filter(booking => 
        booking.date === dateStr && booking.status !== 'cancelled');
    
    // Check if maintenance day (e.g., 22nd and 23rd of each month)
    const date = new Date(dateStr);
    if (date.getDate() === 22 || date.getDate() === 23) {
        return { status: 'maintenance', availableSlots: 0, totalSlots: 0 };
    }
    
    // All slots for the day (8 one-hour slots from 9AM to 5PM)
    const totalSlots = 8;
    const bookedSlots = dateBookings.length;
    const availableSlots = totalSlots - bookedSlots;
    
    // If all slots booked, return booked status
    if (availableSlots === 0) {
        return { status: 'booked', availableSlots: 0, totalSlots };
    }
    
    return { status: 'available', availableSlots, totalSlots };
}

/**
 * Render the calendar for the current month
 */
function renderCalendar() {
    if (!calendarDaysElement) {
        console.error("Calendar days element not found");
        return;
    }
    
    // Clear the calendar
    calendarDaysElement.innerHTML = '';
    
    // Update month/year display
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    if (monthYearElement) {
        monthYearElement.textContent = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    }
    
    // Get first day of the month
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    
    // Get last day of the month
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    // Get day of week for first day (0 = Sunday, 6 = Saturday)
    const firstDayOfWeek = firstDayOfMonth.getDay();
    
    // Get last day of previous month
    const lastDayOfPrevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0).getDate();
    
    // Define grid of 7 columns
    calendarDaysElement.className = 'grid grid-cols-7 gap-0';
    
    // Calculate days from previous month to show
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
        const dayNumber = lastDayOfPrevMonth - i;
        const prevMonthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, dayNumber);
        const dateStr = formatDate(prevMonthDate);
        
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day other-month';
        
        // Add date number
        const dateNumber = document.createElement('div');
        dateNumber.className = 'calendar-day-number';
        dateNumber.textContent = dayNumber;
        dayElement.appendChild(dateNumber);
        
        calendarDaysElement.appendChild(dayElement);
    }
    
    // Add days of current month
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
        const currentMonthDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
        const dateStr = formatDate(currentMonthDate);
        const availability = getDateAvailability(dateStr);
        
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        
        // Check if it's today
        const today = new Date();
        if (i === today.getDate() && 
            currentDate.getMonth() === today.getMonth() && 
            currentDate.getFullYear() === today.getFullYear()) {
            dayElement.classList.add('today');
        }
        
        // Check if it's selected date
        if (selectedDate && i === selectedDate.getDate() && 
            currentDate.getMonth() === selectedDate.getMonth() && 
            currentDate.getFullYear() === selectedDate.getFullYear()) {
            dayElement.classList.add('selected');
        }
        
        // Add date number
        const dateNumber = document.createElement('div');
        dateNumber.className = 'calendar-day-number';
        dateNumber.textContent = i;
        dayElement.appendChild(dateNumber);
        
        // Add status indicator
        const statusElement = document.createElement('div');
        statusElement.className = `calendar-day-status status-${availability.status}`;
        statusElement.textContent = availability.status.charAt(0).toUpperCase() + availability.status.slice(1);
        dayElement.appendChild(statusElement);
        
        // Add slots information
        if (availability.status === 'available') {
            const slotsElement = document.createElement('div');
            slotsElement.className = 'day-slots';
            slotsElement.textContent = `${availability.availableSlots} slots`;
            dayElement.appendChild(slotsElement);
            
            // Make clickable for booking
            dayElement.style.cursor = 'pointer';
            dayElement.addEventListener('click', () => {
                // Check if user is logged in
                if (!auth.currentUser) {
                    // Show login prompt
                    window.authFunctions.showNotification('Please log in to book this slot', 'info');
                    // Show login modal
                    if (loginModal) {
                        loginModal.classList.remove('hidden');
                        loginModal.classList.add('flex');
                    }
                    return;
                }
                
                selectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
                bookingDateInput.value = formatDisplayDate(selectedDate);
                
                // Show booking modal
                bookingModal.classList.remove('hidden');
                bookingModal.classList.add('flex');
                
                // Update calendar to show selected day
                renderCalendar();
            });
        } else if (availability.status === 'booked') {
            const slotsElement = document.createElement('div');
            slotsElement.className = 'day-slots';
            slotsElement.textContent = 'Full';
            dayElement.appendChild(slotsElement);
        } else if (availability.status === 'maintenance') {
            const slotsElement = document.createElement('div');
            slotsElement.className = 'day-slots';
            slotsElement.textContent = 'Closed';
            dayElement.appendChild(slotsElement);
        }
        
        calendarDaysElement.appendChild(dayElement);
    }
    
    // Calculate how many days from next month to show to complete the grid
    const daysFromCurrentMonth = lastDayOfMonth.getDate();
    const daysFromPreviousMonth = firstDayOfWeek;
    const totalDaysShown = daysFromCurrentMonth + daysFromPreviousMonth;
    const remainingCells = 42 - totalDaysShown; // 42 = 6 rows * 7 days
    
    // Show days from next month
    for (let i = 1; i <= remainingCells; i++) {
        const nextMonthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, i);
        const dateStr = formatDate(nextMonthDate);
        
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day other-month';
        
        // Add date number
        const dateNumber = document.createElement('div');
        dateNumber.className = 'calendar-day-number';
        dateNumber.textContent = i;
        dayElement.appendChild(dateNumber);
        
        calendarDaysElement.appendChild(dayElement);
    }
}

/**
 * Navigate to previous month
 */
function goToPreviousMonth() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    loadMonthBookings().then(() => renderCalendar());
}

/**
 * Navigate to next month
 */
function goToNextMonth() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    loadMonthBookings().then(() => renderCalendar());
}

/**
 * Handle view type change (month, week, day)
 * @param {string} viewType - The view type (month, week, day)
 */
function changeViewType(viewType) {
    console.log("Changing view to:", viewType);
    // For now just show a notification about the view change
    // In a full implementation, this would render different calendar views
    window.authFunctions.showNotification(`Changed to ${viewType} view`, 'info');
    
    // Update calendar UI based on view type
    if (viewType === 'month') {
        // Default month view - already implemented
        if (calendarDaysElement) {
            calendarDaysElement.className = 'grid grid-cols-7 gap-0';
        }
    } else if (viewType === 'week') {
        // Week view would show just one week
        if (calendarDaysElement) {
            calendarDaysElement.className = 'grid grid-cols-7 gap-0';
            // Additional logic for week view would go here
        }
    } else if (viewType === 'day') {
        // Day view would show just one day with hourly slots
        if (calendarDaysElement) {
            calendarDaysElement.className = 'grid grid-cols-1 gap-0';
            // Additional logic for day view would go here
        }
    }
    
    // Re-render calendar with the new view
    renderCalendar();
}

/**
 * Filter resources to show
 * @param {string} resourceFilter - The resource filter value
 */
function filterResources(resourceFilter) {
    console.log("Filtering resources by:", resourceFilter);
    // For now just show a notification about the filter
    // In a full implementation, this would filter the calendar by resource
    window.authFunctions.showNotification(`Filtered to show ${resourceFilter === 'all' ? 'all resources' : resourceFilter}`, 'info');
    
    // Re-render calendar with the filter
    renderCalendar();
}

// Event listeners
if (prevMonthBtn) {
    prevMonthBtn.addEventListener('click', goToPreviousMonth);
}

if (nextMonthBtn) {
    nextMonthBtn.addEventListener('click', goToNextMonth);
}

if (closeBookingModalBtn) {
    closeBookingModalBtn.addEventListener('click', () => {
        bookingModal.classList.add('hidden');
        bookingModal.classList.remove('flex');
    });
}

if (cancelBookingBtn) {
    cancelBookingBtn.addEventListener('click', () => {
        bookingModal.classList.add('hidden');
        bookingModal.classList.remove('flex');
    });
}

if (newBookingBtn) {
    newBookingBtn.addEventListener('click', () => {
        // Set selected date to today
        selectedDate = new Date();
        bookingDateInput.value = formatDisplayDate(selectedDate);
        
        // Show booking modal
        bookingModal.classList.remove('hidden');
        bookingModal.classList.add('flex');
    });
}

// Close modal when clicking outside
if (bookingModal) {
    bookingModal.addEventListener('click', (e) => {
        if (e.target === bookingModal) {
            bookingModal.classList.add('hidden');
            bookingModal.classList.remove('flex');
        }
    });
}

// Add event listeners for dropdowns
if (viewSelect) {
    viewSelect.addEventListener('change', (e) => {
        changeViewType(e.target.value);
    });
}

if (filtersSelect) {
    filtersSelect.addEventListener('change', (e) => {
        filterResources(e.target.value);
    });
}

// Make functions globally available for other modules
window.calendarFunctions = {
    formatDate,
    formatDisplayDate,
    loadMonthBookings,
    renderCalendar,
    getDateAvailability
};

// Add debug function to check elements
function debugElements() {
    console.log("Debugging calendar elements:");
    console.log("calendarDaysElement:", calendarDaysElement);
    console.log("monthYearElement:", monthYearElement);
    console.log("prevMonthBtn:", prevMonthBtn);
    console.log("nextMonthBtn:", nextMonthBtn);
    console.log("bookingModal:", bookingModal);
    console.log("bookingDateInput:", bookingDateInput);
}

// Initialize calendar on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log("Calendar initialization");
    
    // Debug DOM elements
    debugElements();
    
    // Check if calendar elements exist
    if (calendarDaysElement && monthYearElement) {
        console.log("Calendar elements found, rendering calendar");
        
        // Render initial calendar regardless of auth state
        renderCalendar();
        
        // Try to load bookings if user is authenticated
        if (auth && auth.currentUser) {
            console.log("User is authenticated, loading bookings");
            loadMonthBookings().then(() => {
                renderCalendar();
            });
        } else {
            console.log("User is not authenticated, showing empty calendar");
        }
    } else {
        console.error("Calendar elements not found");
        if (!calendarDaysElement) console.error("Missing: calendarDaysElement");
        if (!monthYearElement) console.error("Missing: monthYearElement");
    }
}); 