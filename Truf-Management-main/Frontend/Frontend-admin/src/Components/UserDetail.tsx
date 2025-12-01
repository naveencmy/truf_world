import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import back from "../assets/back.svg";
import print from "../assets/print.svg";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import "../styles/UserDetail.css";
import { MultiUser } from "../services/api";

interface BookingEntry {
  no: number;
  name: string;
  phoneNumber: string;
  lastBooking: string;
  upcomingBooking: string;
  totalBookings: number;
}

const Booking = () => {
  const navigate = useNavigate();
  const [bookingData, setBookingData] = useState<BookingEntry[]>([]);
  const [filterText, setFilterText] = useState("");

  useEffect(() => {
    MultiUser()
      .then((data) => setBookingData(data))
      .catch(() => {
        alert("Can't load the users. Please try again later.");
      });
  }, []);

  const handleExport = () => {
    const worksheetData = [
      [
        "No",
        "Last booking",
        "Name",
        "Phone No.",
        "Upcoming booking",
        "Booking Hours",
      ],
      ...bookingData.map((entry) => [
        entry.no,
        entry.lastBooking,
        entry.name,
        entry.phoneNumber,
        entry.upcomingBooking,
        entry.totalBookings,
      ]),
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Bookings");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const data = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(data, "Bookings.xlsx");
  };

  const filteredData = bookingData.filter((entry) => {
    const lower = filterText.toLowerCase();
    return (
      entry.name.toLowerCase().includes(lower) ||
      entry.phoneNumber.toLowerCase().includes(lower) ||
      entry.lastBooking.toLowerCase().includes(lower) ||
      entry.upcomingBooking.toLowerCase().includes(lower)
    );
  });

  return (
    <div className="booking-page">
      <button className="back" onClick={() => navigate(-1)}>
        <img src={back} alt="Go back" className="back-icon" />
        User
      </button>

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

        <button className="expert-button" onClick={handleExport}>
          <img src={print} alt="Export" className="print-icon" />
          Export Table
        </button>
      </div>

      <div className="table-container p-4">
        <table className="w-full border border-collapse">
          <thead>
            <tr className="bg-green-800 text-white text-left">
              <th className="p-2 border">No</th>
              <th className="p-2 border">Last booking</th>
              <th className="p-2 border">Name</th>
              <th className="p-2 border">Phone No.</th>
              <th className="p-2 border">Upcoming booking</th>
              <th className="p-2 border">Booking Hours</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((entry) => (
              <tr
                key={entry.no}
                className="border hover:bg-gray-100 cursor-pointer"
                onClick={() =>
                  navigate("/admin/userdetail/user", {
                    state: {
                      no: entry.no,
                      date: entry.lastBooking,
                      name: entry.name,
                      phone: entry.phoneNumber,
                      upcoming: entry.upcomingBooking,
                      bookinghours: entry.totalBookings,
                    },
                  })
                }
              >
                <td className="p-2 border">{entry.no}</td>
                <td className="p-2 border">{entry.lastBooking}</td>
                <td className="p-2 border">{entry.name}</td>
                <td className="p-2 border">{entry.phoneNumber}</td>
                <td className="p-2 border">{entry.upcomingBooking}</td>
                <td className="p-2 border">{entry.totalBookings}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Booking;
