import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/User.css";
type Booking = {
  date: string;
  timeFrom: string;
  timeTo: string;
  status?: string;
};

type UserData = {
  name: string;
  phoneNumber: string;
  totalBookings: number;
  lastBooking: string;
  totalHours: string;
  upcomingBookings: Booking[];
  pastBookings: Booking[];
};

const User = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const phoneNumber = location.state?.phone || location.state?.phoneNumber;

  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let phoneNo = "9876543210";
    const hold = localStorage.getItem("user");
    if (hold) {
      const parsedUser = JSON.parse(hold);
      phoneNo = parsedUser.phone || phoneNo;
    }

    // Use phoneNumber from navigation state if available, otherwise use localStorage
    const finalPhoneNumber = phoneNumber || phoneNo;

    if (!finalPhoneNumber) {
      setError("Phone number not provided.");
      setLoading(false);
      return;
    }

    // `http://localhost:5125/api/AdminSingleUserDetails/user-details/${finalPhoneNumber}`
    axios
      .get(
        `https://api.turrfzone.com/api/AdminSingleUserDetails/user-details/${phoneNo}`
      )
      .then((res) => {
        setUser(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load user data.");
        setLoading(false);
      });
  }, [phoneNumber]);

  const formatDate = (dateStr: string): string => {
    if (!dateStr || dateStr === "N/A") return "N/A";

    // Handle both DD/MM/YYYY and DD-MM-YYYY formats
    const dateParts = dateStr.split(/[-/]/);
    if (dateParts.length !== 3) return dateStr;

    const [day, month, year] = dateParts;
    const date = new Date(`${year}-${month}-${day}`);
    return isNaN(date.getTime())
      ? "Invalid Date"
      : date.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
  };

  const formatTimeRange = (timeFrom?: string, timeTo?: string): string => {
    if (!timeFrom || !timeTo) return "Not Scheduled";

    const parseTime = (t: string) => {
      // Handle "12 AM", "1 PM" format
      if (t.includes("AM") || t.includes("PM")) {
        return t;
      }

      // Handle "12:00" format and convert to 12-hour format
      const formatted = t.includes(":") ? t : `${t.replace(/\s+/g, "")}:00`;
      const date = new Date(`1970-01-01T${formatted}`);

      if (isNaN(date.getTime())) return t;
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    };

    return `${parseTime(timeFrom)} – ${parseTime(timeTo)}`;
  };

  if (loading)
    return <div className="user-container">Loading user details...</div>;
  if (error) return <div className="user-container">{error}</div>;
  if (!user)
    return <div className="user-container">No user data available.</div>;

  return (
    <div className="user-container">
      <h2
        className="user-header"
        onClick={() => {
          navigate("/");
        }}
      >
        &larr; User Details
      </h2>

      <div className="parent">
        {/* div1 */}
        <div className="user-card div1">
          <div className="user-info-header">
            <div className="user-avatar">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <h2 className="user-name">{user.name}</h2>
          </div>
          <div className="user-info-details">
            <div className="info-row">
              <span className="label">Total Bookings :</span>
              <span className="value">{user.totalBookings}</span>
            </div>
            <div className="info-row">
              <span className="label">Mobile Number :</span>
              <span className="value">{user.phoneNumber}</span>
            </div>
            <div className="info-row">
              <span className="label">Last Booking:</span>
              <span className="value">{formatDate(user.lastBooking)}</span>
            </div>
          </div>
        </div>

        {/* div2 */}
        <div className="user-card div2">
          <div className="card-header green-header">Total Booking Hours</div>
          <div className="booking-hours">
            <p>Total Booking Hours :</p>
            <strong>{user.totalHours}</strong>
          </div>
        </div>

        {/* div3 - Upcoming Bookings */}
        <div className="user-card scrollable div3">
          <div className="card-header green-header">
            Upcoming Booking{" "}
            <div className="badge">{user.upcomingBookings.length}</div>
          </div>
          <div className="booking-scroll">
            {user.upcomingBookings.length > 0 ? (
              user.upcomingBookings.map((item, index) => (
                <div
                  key={`${item.date}-${item.timeFrom}-${item.timeTo}-${index}`}
                  className="booking-entry"
                >
                  <div className="booking-left">
                    <div className="booking-date">{formatDate(item.date)}</div>
                    <div className="booking-time">
                      {formatTimeRange(item.timeFrom, item.timeTo)}
                    </div>
                  </div>
                  <div
                    className={`status-tag ${
                      item.status?.toLowerCase() || "upcoming"
                    }`}
                  >
                    {item.status || "Booked"}
                  </div>
                </div>
              ))
            ) : (
              <div className="no-bookings-message">No upcoming bookings</div>
            )}
          </div>
        </div>

        {/* div4 - Past Bookings */}
        <div className="user-card scrollable div4">
          <div className="card-header green-header">
            Past Bookings{" "}
            <div className="badge">{user.pastBookings.length}</div>
          </div>
          <div className="booking-scroll">
            {user.pastBookings.length > 0 ? (
              user.pastBookings.map((item, index) => {
                const status = item.status?.toLowerCase() || "completed";
                return (
                  <div
                    key={`${item.date}-${item.timeFrom}-${item.timeTo}-${index}`}
                    className="booking-entry"
                  >
                    <div className="booking-left">
                      <div className="booking-date">
                        {formatDate(item.date)}
                      </div>
                      <div className="booking-time">
                        {formatTimeRange(item.timeFrom, item.timeTo)}
                      </div>
                    </div>
                    <div className={`status-tag ${status}`}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="no-bookings-message">No past bookings</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default User;
