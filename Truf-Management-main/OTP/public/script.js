let currentPhone = '';
let countdownTimer = null;

// API calls
async function apiCall(endpoint, data) {
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        return { success: response.ok, data: result };
    } catch (error) {
        return { success: false, data: { message: 'Network error. Please try again.' } };
    }
}

// Send OTP
async function sendOtp() {
    const phoneInput = document.getElementById('phone');
    const sendButton = document.getElementById('send-otp');
    const messageDiv = document.getElementById('phone-message');
    
    const phone = phoneInput.value.trim();
    
    if (!phone) {
        showMessage(messageDiv, 'Please enter a phone number', 'error');
        return;
    }
    
    if (!/^\d{10,15}$/.test(phone)) {
        showMessage(messageDiv, 'Please enter a valid phone number', 'error');
        return;
    }
    
    // Show loading state
    sendButton.disabled = true;
    sendButton.classList.add('loading');
    messageDiv.innerHTML = '';
    console.log('Sending OTP to:', "localhost:3000/generate", phone);
    const result = await apiCall('/generate', { phone });
    
    // Remove loading state
    sendButton.disabled = false;
    sendButton.classList.remove('loading');
    
    if (result.success) {
        currentPhone = phone;
        showMessage(messageDiv, result.data.message, 'success');
        setTimeout(() => {
            showStep('otp-step');
            document.getElementById('phone-display').textContent = phone;
            document.getElementById('otp').focus();
            startCountdown();
        }, 1000);
    } else {
        showMessage(messageDiv, result.data.message, 'error');
    }
}

// Verify OTP
async function verifyOtp() {
    const otpInput = document.getElementById('otp');
    const verifyButton = document.getElementById('verify-otp');
    const messageDiv = document.getElementById('otp-message');
    
    const otp = otpInput.value.trim();
    
    if (!otp) {
        showMessage(messageDiv, 'Please enter the OTP', 'error');
        return;
    }
    
    if (!/^\d{6}$/.test(otp)) {
        showMessage(messageDiv, 'Please enter a valid 6-digit OTP', 'error');
        return;
    }
    
    // Show loading state
    verifyButton.disabled = true;
    verifyButton.classList.add('loading');
    messageDiv.innerHTML = '';
    
    const result = await apiCall('/verify', { phone: currentPhone, otp });
    
    // Remove loading state
    verifyButton.disabled = false;
    verifyButton.classList.remove('loading');
    
    if (result.success) {
        showMessage(messageDiv, result.data.message, 'success');
        clearInterval(countdownTimer);
        setTimeout(() => {
            showStep('success-step');
        }, 1000);
    } else {
        showMessage(messageDiv, result.data.message, 'error');
        otpInput.value = '';
        otpInput.focus();
    }
}

// Resend OTP
async function resendOtp() {
    const resendButton = document.getElementById('resend-otp');
    const messageDiv = document.getElementById('otp-message');
    
    resendButton.disabled = true;
    resendButton.classList.add('loading');
    messageDiv.innerHTML = '';
    
    const result = await apiCall('/generate', { phone: currentPhone });
    
    resendButton.disabled = false;
    resendButton.classList.remove('loading');
    
    if (result.success) {
        showMessage(messageDiv, 'OTP resent successfully', 'success');
        document.getElementById('otp').value = '';
        startCountdown();
    } else {
        showMessage(messageDiv, result.data.message, 'error');
    }
}

// Change phone number
function changePhone() {
    clearInterval(countdownTimer);
    document.getElementById('phone').value = '';
    document.getElementById('otp').value = '';
    currentPhone = '';
    showStep('phone-step');
    document.getElementById('phone').focus();
}

// Reset form
function resetForm() {
    clearInterval(countdownTimer);
    document.getElementById('phone').value = '';
    document.getElementById('otp').value = '';
    document.getElementById('userName').value = '';
    document.getElementById('bookingDateTime').value = '';
    document.getElementById('phone-message').innerHTML = '';
    document.getElementById('otp-message').innerHTML = '';
    document.getElementById('booking-message').innerHTML = '';
    currentPhone = '';
    showStep('phone-step');
    document.getElementById('phone').focus();
}

// Show booking form
function showBookingForm() {
    showStep('booking-step');
    document.getElementById('userName').focus();
    
    // Set minimum datetime to current time
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    document.getElementById('bookingDateTime').min = now.toISOString().slice(0, 16);
}

// Make booking
async function makeBooking() {
    const userNameInput = document.getElementById('userName');
    const dateTimeInput = document.getElementById('bookingDateTime');
    const bookingButton = document.getElementById('make-booking');
    const messageDiv = document.getElementById('booking-message');
    
    const userName = userNameInput.value.trim();
    const dateTime = dateTimeInput.value;
    
    if (!userName) {
        showMessage(messageDiv, 'Please enter your name', 'error');
        return;
    }
    
    if (!dateTime) {
        showMessage(messageDiv, 'Please select date and time', 'error');
        return;
    }
    
    // Check if booking time is in the future
    const bookingDateTime = new Date(dateTime);
    const now = new Date();
    if (bookingDateTime <= now) {
        showMessage(messageDiv, 'Please select a future date and time', 'error');
        return;
    }
    
    // Show loading state
    bookingButton.disabled = true;
    bookingButton.classList.add('loading');
    messageDiv.innerHTML = '';
    
    const result = await apiCall('/booking', { 
        phone: currentPhone, 
        userName: userName, 
        dateTime: dateTime 
    });
    
    // Remove loading state
    bookingButton.disabled = false;
    bookingButton.classList.remove('loading');
    
    if (result.success) {
        showMessage(messageDiv, result.data.message, 'success');
        
        // Show booking details
        const bookingDetails = document.getElementById('booking-details');
        bookingDetails.innerHTML = `
            <p><strong>Booking ID:</strong> ${result.data.bookingId}</p>
            <p><strong>Name:</strong> ${userName}</p>
            <p><strong>Phone:</strong> ${currentPhone}</p>
            <p><strong>Date & Time:</strong> ${result.data.dateTime}</p>
            <p class="success">Confirmation SMS sent to your phone!</p>
        `;
        
        setTimeout(() => {
            showStep('booking-success-step');
        }, 1500);
    } else {
        showMessage(messageDiv, result.data.message, 'error');
    }
}

// Show specific step
function showStep(stepId) {
    // Hide all steps
    document.querySelectorAll('.step').forEach(step => {
        step.classList.remove('active');
    });
    
    // Show target step
    document.getElementById(stepId).classList.add('active');
}

// Show message
function showMessage(element, message, type) {
    element.innerHTML = message;
    element.className = `message ${type}`;
}

// Start countdown timer
function startCountdown() {
    let timeLeft = 180; // 3 minutes in seconds
    const countdownDiv = document.getElementById('countdown');
    
    clearInterval(countdownTimer);
    
    countdownTimer = setInterval(() => {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        
        countdownDiv.textContent = `OTP expires in ${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        if (timeLeft <= 30) {
            countdownDiv.classList.add('warning');
        }
        
        if (timeLeft <= 0) {
            clearInterval(countdownTimer);
            countdownDiv.textContent = 'OTP has expired. Please request a new one.';
            countdownDiv.classList.add('warning');
        }
        
        timeLeft--;
    }, 1000);
}

// Keyboard event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Enter key for phone input
    document.getElementById('phone').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendOtp();
        }
    });
    
    // Enter key for OTP input
    document.getElementById('otp').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            verifyOtp();
        }
    });
    
    // Auto-format OTP input (only numbers)
    document.getElementById('otp').addEventListener('input', function(e) {
        e.target.value = e.target.value.replace(/\D/g, '');
    });
    
    // Auto-format phone input (only numbers)
    document.getElementById('phone').addEventListener('input', function(e) {
        e.target.value = e.target.value.replace(/\D/g, '');
    });
    
    // Focus on phone input when page loads
    document.getElementById('phone').focus();
});
