import { BookingItem } from "./datatypes";

const baseUrlAdmin = "https://admin-api.turrfzone.com";
const baseUrlMessage = "https://otp.turrfzone.com";

// Booking Status Api
export const BookingStatusApi = async ({
  currentView,
}: {
  currentView: string;
}) => {
  try {
    const response = await fetch(
      `${baseUrlAdmin}/api/AdminBooking?status=${currentView}`
    );

    if (!response.ok) {
      const errorText = await response.text(); // Get more readable server message
      throw new Error(`HTTP error! Status: ${response.status} - ${errorText}`);
    }

    const BookingItems: BookingItem[] = await response.json();
    return BookingItems;
  } catch (error: any) {
    alert("Can't load the slots, please try again later.");
    window.location.reload();
  }
};

//Only url is provided for the dashbord

export const DashbordGraphYear = ({ year }: { year: number }) => {
  return `${baseUrlAdmin}/api/AdminDashboard/year?year=${year}`;
};

export const DashbordGraphMonth = ({
  month,
  year,
}: {
  month: number;
  year: number;
}) => {
  return `${baseUrlAdmin}/api/AdminDashboard/month?month=${month}&year=${year}`;
};

// Dashbord Summary
export const DashboardSummary = async () => {
  try {
    const result = await fetch(`${baseUrlAdmin}/api/AdminDashboard/summary`);
    return result.json();
  } catch (err) {
    alert("An unexpected error has been occured when taking the summary");
    window.location.reload();
  }
};

// Booking cancel
export const BookingCancel = async ({
  reason,
  phoneNumber,
}: {
  reason: string;
  phoneNumber: string;
}) => {
  try {
    const response = await fetch(`${baseUrlMessage}/booking/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason, phoneNumber }),
    });

    if (response.ok) {
      return true;
    }
    return false;
  } catch (err) {
    alert("Can't send the cancel message to the user");
    window.location.reload();
  }
};

// Cancelling the Slots
export const CancellingSlots = async ({
  date,
  time,
  validReason,
}: {
  date: string;
  time: string;
  validReason: string;
}) => {
  try {
    const response = await fetch(`${baseUrlAdmin}/api/CancelSlots/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slots: [
          {
            slotDate: new Date(date),
            slotTime: time,
          },
        ],
        reason: validReason,
        cancelledBy: "Admin",
      }),
    });
    if (response.ok) return response.json();
    return false;
  } catch (err) {
    alert("Can't cancel the slot. Please try again later");
    window.location.reload();
  }
};

// Getting the slots
export const GetSlots = async ({ dateString }: { dateString: string }) => {
  const response = await fetch(`${baseUrlAdmin}/api/Slots/${dateString}`);
  return response.json();
};

// Mark as Maintenence
export const MarkMaintenence = async (date: string, timeSlots: string[]) => {
  try {
    const res = await fetch(
      `${baseUrlAdmin}/api/AdminSlotManagement/mark-maintenance`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, timeSlots }),
      }
    );

    if (!res.ok) return false;
    return await res.json();
  } catch (error) {
    alert("Can't mark the slot as maintenence. Please try again later.");
  }
};

// Delete the Maintenance
export const DeleteMaintenence = async (date: string, timeSlots: string[]) => {
  try {
    const res = await fetch(
      `${baseUrlAdmin}/api/AdminSlotManagement/delete-maintenance`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date,
          timeSlots,
        }),
      }
    );

    if (!res.ok) {
      return false;
    }

    return await res.json();
  } catch (error) {
    alert("Can't remove the maintenance slot. Please try again later");
  }
};

// Showing Multi User
export const MultiUser = async () => {
  try {
    const res = await fetch(`${baseUrlAdmin}/api/AdminUser/details`);
    if (!res.ok) throw new Error("Failed to load users");
    return await res.json();
  } catch (error) {
    alert("Can't load the users. Please try again later.");
  }
};

// Single User Details
export const SingleUserDetails = async (phoneNumber: number) => {
  try {
    const res = await fetch(
      `${baseUrlAdmin}/api/AdminSingleUserDetails/user-details/${phoneNumber}`
    );
    if (!res.ok) throw new Error("Failed to load user data.");
    return await res.json();
  } catch (error) {
    console.error("Error fetching user details:", error);
    throw error;
  }
};
