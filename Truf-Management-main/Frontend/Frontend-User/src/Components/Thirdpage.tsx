import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Thirdpage.css";
import {
  getSlotsByDate,
  bookSlot,
  formatTimeForAPI,
  formatDateForAPI,
  checkUser,
  registerUser,
  getIndianTime,
} from "../services/api";
import { useAuth } from "../context/AuthContext";

// Add this style block after imports - it will ensure error messages are properly displayed
const errorStyle = `
  .error-message {
    background-color: #ffdddd;
    color: #ff0000;
    padding: 10px;
    margin: 10px 0;
    border-radius: 5px;
    text-align: center;
    font-weight: bold;
  }
`;

type SlotStatus = "available" | "booked" | "disabled" | "maintenance";

type Slot = {
  time: string;
  status: SlotStatus;
};

type Props = {
  selectedDate: Date;
};

const defaultSlots: Slot[] = [
  { time: "12 AM", status: "available" },
  { time: "1 AM", status: "available" },
  { time: "2 AM", status: "available" },
  { time: "3 AM", status: "available" },
  { time: "4 AM", status: "available" },
  { time: "5 AM", status: "available" },
  { time: "6 AM", status: "available" },
  { time: "7 AM", status: "available" },
  { time: "8 AM", status: "available" },
  { time: "9 AM", status: "available" },
  { time: "10 AM", status: "available" },
  { time: "11 AM", status: "available" },
  { time: "12 PM", status: "available" },
  { time: "1 PM", status: "available" },
  { time: "2 PM", status: "available" },
  { time: "3 PM", status: "available" },
  { time: "4 PM", status: "available" },
  { time: "5 PM", status: "available" },
  { time: "6 PM", status: "available" },
  { time: "7 PM", status: "available" },
  { time: "8 PM", status: "available" },
  { time: "9 PM", status: "available" },
  { time: "10 PM", status: "available" },
  { time: "11 PM", status: "available" },
  { time: "12 AM (Next Day)", status: "available" },
];

const Thirdpage: React.FC<Props> = ({ selectedDate }) => {
  const baseUrlMessahe = "https://otp.turrfzone.com";

  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [slots, setSlots] = useState<Slot[]>(
    defaultSlots.map((slot) => ({ ...slot }))
  );
  const [selectedSlots, setSelectedSlots] = useState<number[]>([]);
  const [showPopup, setShowPopup] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [startSlotIndex, setStartSlotIndex] = useState<number | null>(null);
  const [endSlotIndex, setEndSlotIndex] = useState<number | null>(null);
  const [showEndTimePopup, setShowEndTimePopup] = useState(false);
  const [showLoginRequiredPopup, setShowLoginRequiredPopup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fromTime =
    startSlotIndex !== null
      ? slots[startSlotIndex].time.replace(" (Next Day)", "")
      : "";
  const toTime =
    endSlotIndex !== null
      ? slots[endSlotIndex].time.replace(" (Next Day)", "")
      : "";
  const slotRefs = useRef<(HTMLDivElement | null)[]>([]);

  const parseTime = (timeStr: string, date: Date) => {
    const isNextDay = timeStr.includes("Next Day");
    const [hourStr, meridian] = timeStr
      .replace(" (Next Day)", "")
      .trim()
      .split(" ");
    let hour = parseInt(hourStr, 10);
    if (meridian === "PM" && hour !== 12) hour += 12;
    if (meridian === "AM" && hour === 12) hour = 0;
    const result = new Date(date);
    if (isNextDay) result.setDate(result.getDate() + 1);
    result.setHours(hour, 0, 0, 0);
    return result;
  };

  // Load slots from backend when date changes
  useEffect(() => {
    let isCancelled = false; // Prevent state updates if component unmounts

    const loadSlots = async () => {
      if (isCancelled) return;

      setLoading(true);
      setError(null);

      // Reset selected slots but keep existing slots visible during loading
      setSelectedSlots([]);

      try {
        // Get current time info
        const now = await getIndianTime();
        const selectedDateString = selectedDate.toDateString();
        const todayString = now.toDateString();
        const isToday = selectedDateString === todayString;

        // Get booked/unavailable slots from backend for this specific date
        const slotsFromBackend = await getSlotsByDate(selectedDate);

        if (isCancelled) return; // Don't continue if component unmounted

        const unavailableSlotTimes = new Set(
          slotsFromBackend
            .filter(
              (slot) =>
                slot.status === "Unavailable" || slot.status === "Maintenance"
            )
            .map((slot) => slot.slotTime)
        );

        // Also create a Set specifically for maintenance slots to track them separately
        const maintenanceSlotTimes = new Set(
          slotsFromBackend
            .filter((slot) => slot.status === "Maintenance")
            .map((slot) => slot.slotTime)
        );

        // Process each default slot
        const processedSlots = defaultSlots.map((slot) => {
          const slotTime = slot.time;
          const cleanSlotTime = slotTime.replace(" (Next Day)", "");

          // FIRST PRIORITY: If it's today, check if the slot time has passed
          // Past time slots should always be disabled regardless of booking status
          if (isToday) {
            const slotDateTime = parseTime(slotTime, selectedDate);
            const hasSlotPassed = now >= slotDateTime;

            if (hasSlotPassed) {
              return {
                ...slot,
                status: "disabled" as SlotStatus,
              };
            }
          }

          // SECOND PRIORITY: Check if this slot is unavailable/booked from backend
          // Only apply this if the slot time hasn't passed
          if (unavailableSlotTimes.has(cleanSlotTime)) {
            // Check if it's specifically a maintenance slot
            if (maintenanceSlotTimes.has(cleanSlotTime)) {
              return {
                ...slot,
                status: "maintenance" as SlotStatus,
              };
            } else {
              return {
                ...slot,
                status: "booked" as SlotStatus,
              };
            }
          }

          // DEFAULT: Available
          return {
            ...slot,
            status: "available" as SlotStatus,
          };
        });

        if (!isCancelled) {
          // Update slots after processing is complete
          setSlots(processedSlots);
          setLoading(false);
        }
      } catch (err) {
        if (!isCancelled) {
          setError("Failed to load slot data");

          // Fallback to default slots with proper time-based disabling
          const now = await getIndianTime();
          const isToday = selectedDate.toDateString() === now.toDateString();

          const fallbackSlots = defaultSlots.map((slot) => {
            if (isToday) {
              const slotDateTime = parseTime(slot.time, selectedDate);
              const hasSlotPassed = now >= slotDateTime;
              if (hasSlotPassed) {
                return { ...slot, status: "disabled" as SlotStatus };
              }
            }
            return { ...slot };
          });

          setSlots(fallbackSlots);
          setLoading(false);
        }
      }
    };

    loadSlots();

    // Cleanup function to prevent memory leaks
    return () => {
      isCancelled = true;
    };

    // Scroll to top
    setTimeout(() => {
      if (slotRefs.current[0]) {
        slotRefs.current[0].scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 100);
  }, [selectedDate]);

  // Separate effect for updating time-based slot status every minute
  useEffect(() => {
    if (selectedDate.toDateString() !== new Date().toDateString()) {
      // Only run time updates for today
      return;
    }

    const updateTimeBasedStatus = async () => {
      const now = await getIndianTime();

      setSlots((prevSlots) =>
        prevSlots.map((slot) => {
          // Check if this slot time has passed
          const slotDateTime = parseTime(slot.time, selectedDate);
          const shouldDisable = now >= slotDateTime;

          // PRIORITY: Time-based disabling overrides all other statuses
          if (shouldDisable) {
            return { ...slot, status: "disabled" as SlotStatus };
          }

          // If time hasn't passed, maintain current status
          // (but don't change disabled slots back to available/booked without proper logic)
          return slot;
        })
      );
    };

    // Update immediately
    updateTimeBasedStatus();

    // Set up interval for future updates
    const interval = setInterval(updateTimeBasedStatus, 60000); // Every minute

    return () => clearInterval(interval);
  }, [selectedDate]);

  const handleSlotClick = (index: number) => {
    const clickedSlot = slots[index];
    if (clickedSlot.status !== "available") return;

    // Check if user is authenticated before allowing slot selection
    if (!currentUser) {
      setShowLoginRequiredPopup(true);
      return;
    }

    // Verify user has the necessary data for booking
    if (!currentUser.phoneNumber) {
      setError(
        "Your account is missing a phone number. Please update your profile before booking."
      );
      return;
    }
    setStartSlotIndex(index);
    setShowEndTimePopup(true);
    setError(null); // Clear any previous errors
  };

  const handleConfirm = () => {
    setShowPopup(false);
    setShowSuccessPopup(true);
    setError(null); // Clear any previous errors
  };

  function getSlotFromDateTime(dateStr: string, timeStr: string): string {
    const [time, meridiem] = timeStr.trim().split(" "); // e.g., "12", "AM"
    let [hourStr, minuteStr] = time.includes(":")
      ? time.split(":")
      : [time, "00"];
    let hour = parseInt(hourStr, 10);

    if (meridiem.toUpperCase() === "PM" && hour !== 12) hour += 12;
    if (meridiem.toUpperCase() === "AM" && hour === 12) hour = 0;

    const datetime = new Date(
      `${dateStr}T${String(hour).padStart(2, "0")}:${minuteStr}:00`
    );
    return datetime.toISOString();
  }

  type BookingPayload = {
    phone: string;
    userName: string;
    dateTime: Date | string;
  };

  async function sendBooking({ phone, userName, dateTime }: BookingPayload) {
    try {
      const isoDateTime =
        typeof dateTime === "string" ? dateTime : dateTime.toISOString();

      const response = await fetch(`${baseUrlMessahe}/booking`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone,
          userName,
          dateTime: isoDateTime,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // console.log("Booking Success:", data);
        alert("Booking Confirmed ✅");
      } else {
        // console.error("Booking Failed:", data.message);
        alert(`Booking Failed ❌: ${data.message}`);
      }
    } catch (error) {
      // console.error("Network Error:", error);
    }
  }

  const handleFinalConfirm = async () => {
    // Double-check authentication before proceeding with booking
    if (!currentUser) {
      setShowLoginRequiredPopup(true);
      setShowSuccessPopup(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const userUid = currentUser.uid;
      if (!userUid) {
        throw new Error("Invalid user authentication. Please login again.");
      }

      // The phoneNumber is important for our backend user system
      const phoneNumber = currentUser.phoneNumber;
      if (!phoneNumber) {
        throw new Error(
          "No phone number associated with your account. Please update your profile."
        );
      }

      const userCheckResponse = await checkUser(phoneNumber);
      let userId: number;
      const displayName =
        currentUser.displayName || `User-${userUid.substring(0, 8)}`;

      if (userCheckResponse.userId) {
        // User already exists, use their ID
        userId = userCheckResponse.userId;
      } else {
        // User doesn't exist in backend, register them

        const userRegisterResponse = await registerUser({
          phoneNumber: phoneNumber,
          name: displayName,
        });

        if (!userRegisterResponse.userId) {
          throw new Error("Failed to register user in backend");
        }

        userId = userRegisterResponse.userId;
      }

      userId = Math.min(Number(userId), 2147483647);
      let endTime = formatTimeForAPI(toTime);
      const bookingData = {
        UserId: userId,
        BookingDate: formatDateForAPI(selectedDate), // "YYYY-MM-DD"
        SlotTimeFrom: formatTimeForAPI(fromTime), // e.g. "2 PM"
        SlotTimeTo: endTime, // e.g. "5 PM" or "12 AM"
        Amount: sorted.length * 600,
      };
      // console.log(bookingData);

      const res = await getSlotFromDateTime(
        bookingData.BookingDate,
        bookingData.SlotTimeFrom
      );
      // console.log(res);
      const sendMsgUsername = displayName;
      const sendMsgPhone = phoneNumber;
      const sendMsgDateTime = new Date(res);

      // console.log(
      //   "Username: " + sendMsgUsername,
      //   sendMsgPhone,
      //   sendMsgDateTime
      // );

      // Submit booking to backend
      const result = await bookSlot(bookingData);

      if (result.bookingId) {
        // Update local state to reflect booking
        const updatedSlots = slots.map((slot, i) =>
          selectedSlots.includes(i)
            ? { ...slot, status: "booked" as SlotStatus }
            : slot
        );
        setSlots(updatedSlots);
        setSelectedSlots([]);
        setStartSlotIndex(null);
        setEndSlotIndex(null);
        setShowSuccessPopup(false);

        // ✅ Send confirmation message to user
        try {
          // const message = `Your booking for ${formatDateForAPI(selectedDate)} from ${formatTimeForAPI(fromTime)} to ${endTime} has been confirmed.`;
          const re = await sendBooking({
            userName: sendMsgUsername,
            phone: sendMsgPhone,
            dateTime: sendMsgDateTime,
          });
          if (re != null) {
          }
        } catch (msgErr) {}
      }
    } catch (err: any) {
      setError(err.message || "Failed to book slot. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const sorted = [...selectedSlots].sort((a, b) => a - b);
  const bookingInfo = {
    date: selectedDate.toLocaleDateString("en-GB"),
    name: currentUser?.displayName || "Guest",
    phone: currentUser?.phoneNumber || "Not provided",
    time: `${fromTime} - ${toTime}`,
    price: sorted.length * 600,
  };
  const totalHours = sorted.length;

  return (
    <div className="main">
      <style>{errorStyle}</style>
      <div className="wrapper">
        {error && <div className="error-message">{error}</div>}
        <div className={`inner-inner ${loading ? "center-loading" : ""}`}>
          {loading ? (
            <div className="loading">
              Loading slots for {selectedDate.toDateString()}...
            </div>
          ) : (
            slots
              .filter((slot) => slot.time !== "12 AM (Next Day)")
              .map((slot, index) => (
                <div
                  key={index}
                  ref={(el) => {
                    slotRefs.current[index] = el;
                  }}
                  className={`slot ${
                    slot.status === "maintenance" ? "booked" : slot.status
                  } ${selectedSlots.includes(index) ? "selected" : ""}`}
                  onClick={() => handleSlotClick(index)}
                >
                  {slot.time}
                </div>
              ))
          )}
        </div>

        {showPopup && (
          <div className="popup-overlay">
            <div className="popup">
              <h2>Confirmation</h2>
              <div className="popup-row">
                <div className="popup-col">
                  <span>From :</span>
                  <div className="time-display">{fromTime}</div>
                </div>
                <div className="popup-col">
                  <span>To :</span>
                  <div className="time-display">{toTime}</div>
                </div>
              </div>

              <div className="popup-row2">
                <span> Total Hours:</span>
                <div className="amount-box">{totalHours} hrs</div>
              </div>
              <div className="popup-row2">
                <span>Amount In Total:</span>
                <div className="amount-box">₹{bookingInfo.price}/-</div>
              </div>
              <p className="note">🔴 Note: This Booking Can't be Canceled</p>
              <div className="popup-buttons">
                <button
                  className="popup-cancel"
                  onClick={() => {
                    setShowPopup(false);
                    setSelectedSlots([]);
                    setStartSlotIndex(null);
                    setEndSlotIndex(null);
                    setError(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  className="popup-confirm"
                  onClick={handleConfirm}
                  disabled={loading}
                >
                  {loading ? "Processing..." : "Confirm"}
                </button>
              </div>
            </div>
          </div>
        )}

        {showSuccessPopup && (
          <div className="popup-overlay">
            <div className="success-popup">
              <div className="tick">✓</div>
              <h2>Thanks for your booking</h2>
              <h3>Your Slot is Ready!</h3>
              {error && <div className="error">{error}</div>}
              <table className="booking-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Name</th>
                    <th>Phone No.</th>
                    <th>Time</th>
                    <th>Price in ₹</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{bookingInfo.date}</td>
                    <td>{currentUser?.displayName || "Guest"}</td>
                    <td>{currentUser?.phoneNumber || "Not provided"}</td>
                    <td>{bookingInfo.time}</td>
                    <td>{bookingInfo.price}</td>
                  </tr>
                </tbody>
              </table>
              <button
                className="final-confirm"
                onClick={handleFinalConfirm}
                disabled={loading}
              >
                {loading ? "Processing..." : "OK"}
              </button>
            </div>
          </div>
        )}

        {showLoginRequiredPopup && (
          <div className="popup-overlay">
            <div className="popup login-required-popup">
              <h2>Login Required</h2>
              <p>You need to login to book slots. Please login to continue.</p>
              <div className="popup-buttons">
                <button
                  className="popup-confirm login-btn"
                  onClick={() => {
                    setShowLoginRequiredPopup(false);
                    // Navigate to login page
                    navigate("/login");
                  }}
                >
                  Login
                </button>
                <button
                  className="popup-cancel"
                  onClick={() => {
                    setShowLoginRequiredPopup(false);
                    setSelectedSlots([]); // Clear selected slots
                    setStartSlotIndex(null); // Reset start slot
                    setEndSlotIndex(null); // Reset end slot
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {showEndTimePopup && startSlotIndex !== null && (
          <div
            className="slide-overlay"
            onClick={() => {
              setShowEndTimePopup(false);
              setSelectedSlots([]); // Clear selected slots
              setStartSlotIndex(null); // Reset start slot
              setEndSlotIndex(null); // Reset end slot
            }}
          >
            <div className="slide-popup" onClick={(e) => e.stopPropagation()}>
              <div className="slide-popup-in">
                <div className="popup-h2">
                  <h2>Select End Time</h2>
                </div>
                <div className="end-time-options">
                  {(() => {
                    const start = startSlotIndex + 1;
                    const endOptions = [];
                    let totalOptionsShown = 0;
                    const maxOptions = 4;

                    for (
                      let i = start;
                      i < slots.length && totalOptionsShown < maxOptions;
                      i++
                    ) {
                      const slot = slots[i];

                      if (slot.status === "available") {
                        endOptions.push(
                          <div
                            key={i}
                            className="end-time-option"
                            onClick={() => {
                              // Check authentication before proceeding with selection
                              if (!currentUser) {
                                setShowLoginRequiredPopup(true);
                                setShowEndTimePopup(false);
                                return;
                              }

                              const selected = [];

                              // Select all slots from start to end (non-inclusive of end time)
                              for (let j = startSlotIndex; j < i; j++) {
                                selected.push(j);
                              }

                              setSelectedSlots(selected);
                              setEndSlotIndex(i);
                              setShowEndTimePopup(false);
                              setShowPopup(true); // immediately trigger popup
                            }}
                          >
                            {slot.time.replace(" (Next Day)", "")}
                          </div>
                        );
                        totalOptionsShown++;
                      } else {
                        // Show non-available slot and stop (as it blocks further selection)
                        endOptions.push(
                          <div
                            key={i}
                            className="end-time-option non-available"
                            onClick={() => {
                              // Check authentication before proceeding with selection
                              if (!currentUser) {
                                setShowLoginRequiredPopup(true);
                                setShowEndTimePopup(false);
                                return;
                              }

                              const selected = [];

                              // Select all slots from start to end (non-inclusive of end time)
                              for (let j = startSlotIndex; j < i; j++) {
                                selected.push(j);
                              }

                              setSelectedSlots(selected);
                              setEndSlotIndex(i);
                              setShowEndTimePopup(false);
                              setShowPopup(true); // immediately trigger popup
                            }}
                          >
                            {slot.status === "maintenance"
                              ? slot.time
                              : slot.time.replace(" (Next Day)", "")}
                          </div>
                        );
                        totalOptionsShown++;
                        // Stop here as non-available slots block further selection
                        break;
                      }
                    }

                    return endOptions;
                  })()}
                </div>
                <div className="popup-btn">
                  <button
                    className="popup-cancel"
                    onClick={() => {
                      setShowEndTimePopup(false);
                      setSelectedSlots([]); // Clear selected slots
                      setStartSlotIndex(null); // Reset start slot
                      setEndSlotIndex(null); // Reset end slot
                      setError(null);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Thirdpage;
