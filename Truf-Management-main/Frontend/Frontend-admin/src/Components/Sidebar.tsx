import { FC } from "react";
import { NavLink } from "react-router-dom";

import DashboardIcon from "../assets/Dashboard.svg";
import BookingIcon from "../assets/Booking.svg";
import ManagementIcon from "../assets/management.svg";
import UserDetailIcon from "../assets/userdetails.svg";
import back from "../assets/back.svg";

import "../styles/Sidebar.css";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  role?: "admin" | "user";
}

const Sidebar: FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  return (
    <>
      <div className={`sidebar ${isOpen ? "open" : ""}`}>
        <div className="header">
          <button
            onClick={() => setIsOpen(false)}
            className="menu-btn"
            aria-label="Close menu"
          >
            <img src={back} alt="Close" />
          </button>
        </div>
        <nav>
          <ul>
            <li>
              <NavLink
                to="/"
                className={({ isActive }: { isActive: boolean }) =>
                  isActive ? "active" : ""
                }
                onClick={() => setIsOpen(false)}
              >
                <span className="nav-link-content">
                  <img
                    src={DashboardIcon}
                    alt="Dashboard"
                    className="nav-icon"
                  />
                  Dashboard
                </span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/admin/booking"
                className={({ isActive }: { isActive: boolean }) =>
                  isActive ? "active" : ""
                }
                onClick={() => setIsOpen(false)}
              >
                <span className="nav-link-content">
                  <img src={BookingIcon} alt="Booking" className="nav-icon" />
                  Booking
                </span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/admin/management"
                className={({ isActive }: { isActive: boolean }) =>
                  isActive ? "active" : ""
                }
                onClick={() => setIsOpen(false)}
              >
                <span className="nav-link-content">
                  <img
                    src={ManagementIcon}
                    alt="Management"
                    className="nav-icon"
                  />
                  Management
                </span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/admin/userdetail"
                className={({ isActive }: { isActive: boolean }) =>
                  isActive ? "active" : ""
                }
                onClick={() => setIsOpen(false)}
              >
                <span className="nav-link-content">
                  <img
                    src={UserDetailIcon}
                    alt="User Details"
                    className="nav-icon"
                  />
                  User Details
                </span>
              </NavLink>
            </li>
          </ul>
        </nav>
      </div>
      {isOpen && <div className="overlay" onClick={() => setIsOpen(false)} />}
      {!isOpen && (
        <div className="message-btn" onClick={() => setIsOpen(true)}>
          <img src={back} alt="Open Menu" />
        </div>
      )}
    </>
  );
};

export default Sidebar;
