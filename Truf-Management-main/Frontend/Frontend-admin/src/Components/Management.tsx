import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import back from "../assets/back.svg";
import "../styles/Management.css";
import LoadingPage from "./LoadingPage";
import {
  BookingCancel,
  CancellingSlots,
  DeleteMaintenence,
  GetSlots,
  MarkMaintenence,
} from "../services/api";

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const today = new Date();
today.setHours(0, 0, 0, 0);

type SlotStatus = "available" | "booked" | "disabled" | "maintenance";

type Slot = {
  time: string;
  status: SlotStatus;
  startTime?: string;
};

type APISlot = {
  slotId: number;
  slotDate: string;
  slotTime: string;
  status: "Unavailable" | "Maintenance";
};

const formatTime = (hour: number): string => {
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour} ${period}`;
};

const formatToApiTime = (time: string): string => {
  const [hourStr, period] = time.trim().split(" ");
  const hour = hourStr.padStart(2, "0");
  return `${hour}:00 ${period}`;
};

const getAllSlots = (): Slot[] => {
  const slots: Slot[] = [];
  for (let i = 0; i < 24; i++) {
    const from = formatTime(i);
    const to = formatTime((i + 1) % 24);
    slots.push({
      time: `${from} to ${to}`,
      status: "available",
      startTime: from.toUpperCase().trim(),
    });
  }
  return slots;
};

const Management = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [clickedDate, setClickedDate] = useState<Date | null>(null);
  const [slots, setSlots] = useState<Slot[]>(getAllSlots());
  const [selectedSlots, setSelectedSlots] = useState<number[]>([]);
  const [popupSlotIndex, setPopupSlotIndex] = useState<number | null>(null);
  const [popupBookedIndex, setPopupBookedIndex] = useState<number | null>(null);
  const [showMarkPopup, setShowMarkPopup] = useState(false);
  const [selectAll, setSelectAll] = useState(false);
  const slotRefs = useRef<(HTMLDivElement | null)[]>([]);

  const nextWeek = () =>
    setSelectedDate((prev) => new Date(prev.getTime() + 7 * 86400000));

  const prevWeek = () => {
    const newDate = new Date(selectedDate.getTime() - 7 * 86400000);
    if (newDate >= today) setSelectedDate(newDate);
  };

  const nextMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setSelectedDate(newDate);
  };

  const prevMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() - 1);
    if (newDate >= today) setSelectedDate(newDate);
  };

  const getWeekDates = () => {
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(selectedDate);
      d.setDate(selectedDate.getDate() + i);
      days.push(d);
    }
    return days;
  };

  async function cancelBooking(
    reason: string,
    phoneNumber: string
  ): Promise<void> {
    try {
      const data = await BookingCancel({ reason, phoneNumber });

      if (!data) {
        alert("Can't send the canclled message to the user");
        window.location.reload();
      }
      window.location.reload();
    } catch (err) {
      alert("Failed to cancel the booking. Please try again later.");
      window.location.reload();
    }
  }

  const [loading, setLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    reason: string;
    dateStr: string;
    time: string;
  } | null>(null);

  useEffect(() => {
    if (loading && pendingAction) {
      const timeout = setTimeout(async () => {
        try {
          const date = pendingAction.dateStr;
          const validReason = pendingAction.reason;
          const time = pendingAction.time;
          const response = await CancellingSlots({ date, time, validReason });
          if (response === false) {
            alert("Can't cancel the slot. Please try again later");
            window.location.reload();
          }
          const constPhoneNumber = await response.phoneno;
          await cancelBooking(validReason, constPhoneNumber);
          setSlots((prev) =>
            prev.map((s, i) =>
              i === popupBookedIndex ? { ...s, status: "available" } : s
            )
          );
          setPopupBookedIndex(null);
        } catch (err) {
          alert("Failed to cancel booking. Please try again.");
          window.location.reload();
        } finally {
          setLoading(false);
        }
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [loading, pendingAction]);

  useEffect(() => setClickedDate(today), []);

  useEffect(() => {
    if (!clickedDate) return;

    (async () => {
      try {
        const y = clickedDate.getFullYear();
        const m = String(clickedDate.getMonth() + 1).padStart(2, "0");
        const d = String(clickedDate.getDate()).padStart(2, "0");
        const dateString = `${y}-${m}-${d}`;

        const response = await GetSlots({ dateString });
        const apiSlots = response as APISlot[];

        const unavailable = new Set(
          apiSlots
            .filter((s) => s.status === "Unavailable")
            .map((s) => s.slotTime.replace(/\s+/g, " ").trim().toUpperCase())
        );

        const maintenance = new Set(
          apiSlots
            .filter((s) => s.status === "Maintenance")
            .map((s) => s.slotTime.replace(/\s+/g, " ").trim().toUpperCase())
        );

        const updated = getAllSlots().map((slot) => {
          const t = slot.startTime!.replace(/\s+/g, " ").trim().toUpperCase();
          if (unavailable.has(t))
            return { ...slot, status: "disabled" as SlotStatus };
          if (maintenance.has(t))
            return { ...slot, status: "maintenance" as SlotStatus };
          return { ...slot, status: "available" as SlotStatus };
        });

        setSlots(updated);
        setSelectedSlots([]);
        setSelectAll(false);
      } catch (err) {
        alert("Can't load the slots. Please try again later.");
      }
    })();
  }, [clickedDate]);

  const isPastDate = (d: Date) => d < today;
  const formatDate = (d: Date) => `${d.getDate()}`;

  const handleDateClick = (d: Date) => {
    if (!isPastDate(d)) setClickedDate(d);
  };

  const isPastSlot = (slot: Slot): boolean => {
    if (!clickedDate) return false;
    if (clickedDate.toDateString() !== today.toDateString()) return false;

    const [hourStr, period] = slot.startTime!.split(" ");
    let hour = parseInt(hourStr);
    if (period === "PM" && hour !== 12) hour += 12;
    if (period === "AM" && hour === 12) hour = 0;

    const now = new Date();
    const slotTime = new Date(now);
    slotTime.setHours(hour, 15, 0, 0);
    return now >= slotTime;
  };

  const handleSlotClick = (idx: number) => {
    const slot = slots[idx];

    if (isPastSlot(slot)) {
      return;
    }

    if (slot.status === "maintenance") {
      setPopupSlotIndex(idx);
      return;
    }
    if (slot.status === "disabled") {
      setPopupBookedIndex(idx);
      return;
    }
    if (slot.status === "booked") {
      return;
    }

    setSelectedSlots((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const handleSelectAllChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setSelectAll(checked);
    setSelectedSlots(
      checked
        ? slots
            .map((s, i) => (s.status === "available" ? i : -1))
            .filter((i) => i !== -1)
        : []
    );
  };

  const handleMarkAsMaintenance = () => {
    setSlots((prev) =>
      prev.map((s, i) =>
        selectedSlots.includes(i) ? { ...s, status: "maintenance" } : s
      )
    );
    setSelectedSlots([]);
    setSelectAll(false);
  };

  const weekDates = getWeekDates();

  if (loading) return <LoadingPage />;

  return (
    <div className="main-container">
      <button className="back-button" onClick={() => navigate(-1)}>
        <img src={back} alt="Back" />
        Management
      </button>
      <div className="calendar-nav">
        <button className="left-calendar" onClick={prevMonth}>
          &#x276E;
        </button>
        <span>
          {selectedDate.toLocaleString("default", { month: "long" })}{" "}
          {selectedDate.getFullYear()}
        </span>
        <button className="right-calendar" onClick={nextMonth}>
          &#x276F;
        </button>
      </div>
      <div className="calendar-nav weekdays-inside-nav">
        <button className="left-calendar" onClick={prevWeek}>
          &#x276E;
        </button>

        <div className="weekdays">
          {weekDates.map((d, i) => {
            const isSelected = clickedDate?.toDateString() === d.toDateString();
            return (
              <div
                key={i}
                className={`day ${isSelected ? "selected" : ""} ${
                  isPastDate(d) ? "disabled" : ""
                }`}
                onClick={() => handleDateClick(d)}
              >
                <span>{formatDate(d)}</span>
                <span>{weekdays[d.getDay() === 0 ? 6 : d.getDay() - 1]}</span>
              </div>
            );
          })}
        </div>

        <button className="right-calendar" onClick={nextWeek}>
          &#x276F;
        </button>
      </div>
      <h1 className="slot-title">Time Slots</h1>
      <section className="select-container">
        <label className="select-label">
          <input
            type="checkbox"
            checked={selectAll}
            onChange={handleSelectAllChange}
          />
          <span>Select all</span>
        </label>
      </section>
      <div className="slot-grid">
        {slots.map((slot, i) => (
          <div
            key={i}
            ref={(el) => {
              slotRefs.current[i] = el;
            }}
            className={`slot-box ${slot.status} ${
              selectedSlots.includes(i) ? "selected" : ""
            } ${isPastSlot(slot) ? "past-slot disabled" : ""}`}
            onClick={() => handleSlotClick(i)}
          >
            <div>{slot.time.split(" to ")[0]}</div>
            <div className="slot-to">to</div>
            <div>{slot.time.split(" to ")[1]}</div>
          </div>
        ))}
      </div>
      <div className="end-buttons">
        <button
          className="mark-maintanance"
          onClick={() => setShowMarkPopup(true)}
          disabled={selectedSlots.length === 0}
        >
          Mark as Maintenance
        </button>
      </div>

      {popupSlotIndex !== null && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-content-inner">
              <h2>Remove Maintenance</h2>
              <p>
                Do you want to remove maintenance for slot:{" "}
                <strong>{slots[popupSlotIndex].time}</strong>?
              </p>
              <div className="modal-actions">
                <button
                  className="remove-maintanance-button"
                  onClick={async () => {
                    if (!clickedDate) return;
                    const y = clickedDate.getFullYear();
                    const m = String(clickedDate.getMonth() + 1).padStart(
                      2,
                      "0"
                    );
                    const d = String(clickedDate.getDate()).padStart(2, "0");
                    const dateStr = `${y}-${m}-${d}`;
                    const raw = slots[popupSlotIndex].startTime!;
                    const time = formatToApiTime(raw);

                    try {
                      const response = await DeleteMaintenence(dateStr, [time]);
                      if (response === false)
                        alert(
                          "Can't remove the maintenance slot. Please try again later"
                        );
                      setSlots((prev) =>
                        prev.map((s, i) =>
                          i === popupSlotIndex
                            ? { ...s, status: "available" }
                            : s
                        )
                      );
                      setPopupSlotIndex(null);
                    } catch (err) {
                      alert(
                        "Can't remove the maintenance slot. Please try again later"
                      );
                    }
                  }}
                >
                  Yes, Remove
                </button>
                <button
                  className="cancel-popup-button"
                  onClick={() => setPopupSlotIndex(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {popupBookedIndex !== null && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-content-inner">
              <p>
                Cancelling: <strong>{slots[popupBookedIndex].time}</strong>
              </p>

              <div className="cancellation-form">
                <div className="form-group">
                  <label htmlFor="reason">Reason for Cancellation:</label>
                  <select id="reason" className="form-input">
                    <option value="">Select a reason</option>
                    <option value="No Show">Extreme weather conditions</option>
                    <option value="Facility Maintenance">
                      Turf maintenance or emergency repair
                    </option>
                    <option value="User Request">User Request</option>
                    <option value="Policy Violation">Special events</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  className="remove-maintanance-button"
                  onClick={() => {
                    if (!clickedDate) return;

                    const reason = (
                      document.getElementById("reason") as HTMLSelectElement
                    ).value;

                    if (!reason) {
                      alert("Please fill in all required fields");
                      return;
                    }

                    const y = clickedDate.getFullYear();
                    const m = String(clickedDate.getMonth() + 1).padStart(
                      2,
                      "0"
                    );
                    const d = String(clickedDate.getDate()).padStart(2, "0");
                    const dateStr = `${y}-${m}-${d}`;
                    const time = slots[popupBookedIndex].startTime!;

                    setPendingAction({ reason, dateStr, time });
                    setLoading(true);
                  }}
                >
                  Confirm
                </button>
                <button
                  className="cancel-popup-button"
                  onClick={() => setPopupBookedIndex(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showMarkPopup && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-content-inner">
              <h2>Mark as Maintenance</h2>
              <p>
                Are you sure you want to mark{" "}
                <strong>{selectedSlots.length}</strong> slot
                {selectedSlots.length !== 1 && "s"} as maintenance?
              </p>
              <div className="modal-actions">
                <button
                  className="remove-maintanance-button"
                  onClick={async () => {
                    if (!clickedDate) return;
                    const y = clickedDate.getFullYear();
                    const m = String(clickedDate.getMonth() + 1).padStart(
                      2,
                      "0"
                    );
                    const d = String(clickedDate.getDate()).padStart(2, "0");
                    const dateStr = `${y}-${m}-${d}`;
                    const timeSlots = selectedSlots.map((i) =>
                      formatToApiTime(slots[i].startTime!)
                    );

                    try {
                      const response = await MarkMaintenence(
                        dateStr,
                        timeSlots
                      );
                      if (!response) {
                        alert(
                          "Can't mark the slot as maintenence. Please try again later."
                        );
                      } else {
                        handleMarkAsMaintenance();
                        setShowMarkPopup(false);
                      }
                    } catch (err) {
                      alert(
                        "Can't mark the slot as maintenence. Please try again later."
                      );
                    }
                  }}
                >
                  Yes, Confirm
                </button>
                <button
                  className="cancel-popup-button"
                  onClick={() => setShowMarkPopup(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Management;
