const API_BASE_URL = "https://api.turrfzone.com/api"; // Remote backend server

// OTP-related interfaces
export interface OtpSendRequest {
  phoneNumber: string;
}

export interface OtpSendResponse {
  message: string;
}

export interface OtpVerifyRequest {
  phoneNumber: string;
  otp: string;
}

export interface OtpVerifyResponse {
  message: string;
}

export interface SlotDto {
  slotId: number;
  slotDate: string;
  slotTime: string;
  status: string;
}

export interface BookingRequest {
  UserId: number;
  BookingDate: string;
  SlotTimeFrom: string;
  SlotTimeTo: string;
  Amount: number;
}

export interface BookingResponse {
  message: string;
  bookingId?: number;
  error?: string;
}

// User-related interfaces
export interface UserDto {
  phoneNumber: string;
  name?: string;
}

export interface UserCheckResponse {
  message: string;
  userId?: number;
  name?: string;
}

export interface UserRegisterResponse {
  message: string;
  userId?: number;
  name?: string;
  phoneNumber?: string;
}

export interface UserUpdateResponse {
  message: string;
  userId?: number;
  name?: string;
  phoneNumber?: string;
}

// Get slots with exceptions (booked/maintenance slots) for a specific date or all upcoming
export const getSlotExceptions = async (): Promise<SlotDto[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/slots/exceptions`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    return result;
  } catch (error) {
    throw error;
  }
};

// Add maintenance slot
export const addMaintenanceSlot = async (
  slotDate: string,
  slotTime: string
): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/slots/maintenance`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        slotDate,
        slotTime,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.message || `HTTP error! status: ${response.status}`
      );
    }

    return result;
  } catch (error) {
    throw error;
  }
};

// Remove slot
export const removeSlot = async (slotId: number): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/slots/${slotId}`, {
      method: "DELETE",
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.message || `HTTP error! status: ${response.status}`
      );
    }

    return result;
  } catch (error) {
    throw error;
  }
};

// Book a slot
export const bookSlot = async (
  bookingData: BookingRequest
): Promise<BookingResponse> => {
  try {
    const payload = {
      UserId: Math.min(Number(bookingData.UserId), 2147483647), // Ensure it's within int32 range
      BookingDate: bookingData.BookingDate, // Format: "YYYY-MM-DD"
      SlotTimeFrom: bookingData.SlotTimeFrom,
      SlotTimeTo: bookingData.SlotTimeTo,
      Amount: Number(bookingData.Amount), // Ensure it's a number
    };

    const response = await fetch(`${API_BASE_URL}/booking/book`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
    } else {
      alert("Booking has been failed. Please try again later.");
      window.location.reload();
    }

    const result = await response.json();

    if (!response.ok) {
      // Extract detailed error information for debugging
      const errorDetails = result.errors ? JSON.stringify(result.errors) : "";
      const errorMessage =
        result.message ||
        result.error ||
        `HTTP error! status: ${response.status}${
          errorDetails ? " - " + errorDetails : ""
        }`;

      throw new Error(errorMessage);
    }
    return result;
  } catch (error) {
    throw error;
  }
};

// Get slots for a specific date
export const getSlotsByDate = async (date: Date): Promise<SlotDto[]> => {
  try {
    const formattedDate = formatDateForAPI(date);
    const url = `${API_BASE_URL}/slots/date/${formattedDate}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    return result;
  } catch (error) {
    throw error;
  }
};

// Helper function to format date for API calls
export const formatDateForAPI = (date: Date): string => {
  // Use local date components to avoid timezone issues
  // Format must be "YYYY-MM-DD" for the backend to parse correctly
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Helper function to format time for API calls
export const formatTimeForAPI = (timeStr: string): string => {
  // Clean the time string and handle special cases
  // Frontend sends "12 AM", "2 PM", backend expects "12 AM", "2 PM"
  const cleanTime = timeStr.replace(" (Next Day)", "");

  // Ensure proper handling of 12 AM/12 PM cases
  if (cleanTime === "12 AM" || cleanTime === "12 PM") {
    return cleanTime;
  }

  return cleanTime;
};

// Check if user exists by phone number
export const checkUser = async (
  phoneNumber: string
): Promise<UserCheckResponse> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/user/check?phoneNumber=${phoneNumber}`
    );

    if (response.ok) {
      return await response.json();
    } else if (response.status === 404) {
      return { message: "User not found" };
    } else {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    throw error;
  }
};

// Register a new user
export const registerUser = async (
  userData: UserDto
): Promise<UserRegisterResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/user/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.message || `HTTP error! status: ${response.status}`
      );
    }

    return result;
  } catch (error) {
    throw error;
  }
};

// Update user name
export const updateUserName = async (
  phoneNumber: string,
  name: string
): Promise<UserUpdateResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/user/update-name`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phoneNumber,
        name,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.message || `HTTP error! status: ${response.status}`
      );
    }

    return result;
  } catch (error) {
    throw error;
  }
};

// Get the date and time for the slots
export const getIndianTime = async () => {
  const response = await fetch(`${API_BASE_URL}/current-datetime`);
  const data = await response.json();
  const currentDate = data.dateTime;
  return new Date(currentDate);
};

// OTP Functions using SampleOtpController
// Send OTP to phone number
export const sendOtp = async (
  phoneNumber: string
): Promise<OtpSendResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/SampleOtp/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phoneNumber: phoneNumber,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.message || `HTTP error! status: ${response.status}`
      );
    }
    return result;
  } catch (error) {
    throw error;
  }
};

// Verify OTP
export const verifyOtp = async (
  phoneNumber: string
): Promise<OtpVerifyResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/SampleOtp/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phoneNumber: phoneNumber,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.message || `HTTP error! status: ${response.status}`
      );
    }
    return result;
  } catch (error) {
    throw error;
  }
};
