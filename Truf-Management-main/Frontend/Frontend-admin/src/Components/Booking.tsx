// Importing the React libraries
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

// Importing the assests
import back from "../assets/back.svg";
import print from "../assets/print.svg";

// Importing the modules for downloading file
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

// Importing the css
import "../styles/Booking.css";

// Importing the services
import { BookingStatusApi } from "../services/api";

type BookingItem = {
  username: string;
  no: number;
  date: string;
  name: string;
  phone: string;
  time: string;
  price: number;
  status: string;
};

const views: ("past" | "today" | "upcoming")[] = ["past", "today", "upcoming"];

const Booking = () => {
  const navigate = useNavigate();

  const [viewIndex, setViewIndex] = useState(1);
  const [bookingData, setBookingData] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterText, setFilterText] = useState("");
  const currentView = views[viewIndex];
  const filteredData = bookingData.filter((entry) => {
    const lower = filterText.toLowerCase();
    return (
      entry.name.toLowerCase().includes(lower) ||
      entry.phone.toLowerCase().includes(lower) ||
      entry.date.toLowerCase().includes(lower) ||
      entry.status.toLowerCase().includes(lower)
    );
  });

  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await BookingStatusApi({ currentView });
        setBookingData(data ?? []);
      } catch (err) {
        setError("An error has been occured. Please try again later");
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, [currentView]);

  const handlePrevView = () => {
    setViewIndex((prev) => (prev === 0 ? 0 : prev - 1));
  };

  const handleNextView = () => {
    setViewIndex((prev) => (prev === views.length - 1 ? prev : prev + 1));
  };

  const handleExport = () => {
    const data = [
      ["No", "Date", "Name", "Phone No.", "Time", "Price in ₹", "Status"],
      ...bookingData.map((item) => [
        item.no,
        item.date,
        item.name,
        item.phone,
        item.time,
        item.price,
        item.status,
      ]),
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Bookings");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const file = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(file, `Booking_${currentView}.xlsx`);
  };

  return (
    <div className="booking-wrapper">
      <div>
        <button className="back-button" onClick={() => navigate(-1)}>
          <img src={back} alt="Back" />
          Booking
        </button>
      </div>

      <div className="booking-content">
        <input
          name="search-box"
          id="search-box"
          type="text"
          placeholder="Search by name, phone or booking..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          className="search-input"
        />

        <div className="date">
          <img
            src={back}
            alt="Previous"
            className="back-icon"
            onClick={handlePrevView}
            style={{ opacity: viewIndex === 0 ? 0.3 : 1 }}
          />
          {currentView.toUpperCase()}
          <img
            src={back}
            alt="Next"
            className="next-icon"
            onClick={handleNextView}
            style={{ opacity: viewIndex === views.length - 1 ? 0.3 : 1 }}
          />
        </div>

        <button className="expert-button" onClick={handleExport}>
          <img src={print} alt="print" className="print-icon" />
          Export table
        </button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>Date</th>
              <th>Name</th>
              <th>Phone No.</th>
              <th>Time</th>
              <th>Price in ₹</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7}>Loading...</td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={7} style={{ color: "red" }}>
                  {error}
                </td>
              </tr>
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan={7}>No bookings found.</td>
              </tr>
            ) : (
              filteredData.map((item) => (
                <tr
                  key={item.no}
                  className="clickable-row"
                  onClick={() =>
                    navigate("/admin/userdetail/user", {
                      state: {
                        no: item.no,
                        date: item.date,
                        name: item.name,
                        phone: item.phone,
                        upcoming: item.status,
                        bookinghours: item.time,
                      },
                    })
                  }
                >
                  <td>{item.no}</td>
                  <td>{item.date}</td>
                  <td>{item.name}</td>
                  <td>{item.phone}</td>
                  <td>{item.time}</td>
                  <td>{item.price}</td>
                  <td className="status">{item.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Booking;
