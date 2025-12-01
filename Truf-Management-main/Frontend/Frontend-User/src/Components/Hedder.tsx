import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { updateUserName } from "../services/api";
import { useLocation } from "react-router-dom";

import "../styles/Hedder.css";

// Assets
import EditIcon from "../assets/edit.svg";
import Login from "../assets/loginicon.png";
import logo from "../assets/logo.png";

// Header component (handles logo, user dropdown, login/logout)
function Hedder() {
  const navigate = useNavigate();
  let phoneNo = "8778873866"; // Default phone number fallback
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { currentUser, logout } = useAuth(); // Auth context
  const [dropdownVisible, setDropdownVisible] = useState(false); // Controls dropdown visibility
  const [isEditing, setIsEditing] = useState(false); // Controls editing state

  // Helper: Get user's name from context or localStorage
  const getDisplayName = () => {
    if (currentUser?.displayName) return currentUser.displayName;

    try {
      const localUser = localStorage.getItem("user");
      if (localUser) {
        const parsedUser = JSON.parse(localUser);
        phoneNo = parsedUser.phone || phoneNo;
        console.log("Parsed user:", phoneNo);
        return parsedUser.username || parsedUser.name || "User";
      }
    } catch (error) {
      // console.error("Error parsing user data:", error);
    }

    return "Guest";
  };

  // State for storing and editing name
  const [username, setUsername] = useState(() => getDisplayName());
  const [nameInput, setNameInput] = useState(username);

  // Update username when auth state changes
  useEffect(() => {
    const newUsername = getDisplayName();
    setUsername(newUsername);
    setNameInput(newUsername);
  }, [currentUser]);

  // Custom events: userLogin / userLogout
  useEffect(() => {
    const handleUserLogin = () => {
      const newUsername = getDisplayName();
      setUsername(newUsername);
      setNameInput(newUsername);
    };

    const handleUserLogout = () => {
      setUsername("Guest");
      setNameInput("Guest");
      setDropdownVisible(false);
      setIsEditing(false);
    };

    window.addEventListener("userLogin", handleUserLogin);
    window.addEventListener("userLogout", handleUserLogout);

    return () => {
      window.removeEventListener("userLogin", handleUserLogin);
      window.removeEventListener("userLogout", handleUserLogout);
    };
  }, []);

  // Toggle dropdown menu
  const toggleDropdown = () => {
    setDropdownVisible((prev) => !prev);
    setIsEditing(false);
  };

  // Save edited username
  const handleSave = async () => {
    if (nameInput.trim()) {
      const trimmedName = nameInput.trim();
      setUsername(trimmedName);

      try {
        const localUser = localStorage.getItem("user");
        if (localUser) {
          const parsedUser = JSON.parse(localUser);
          const phoneNumber = parsedUser.phone || currentUser?.phoneNumber;
          // console.log("Updating name for phone:", phoneNumber);

          // Update localStorage
          parsedUser.username = trimmedName;
          localStorage.setItem("user", JSON.stringify(parsedUser));

          // Update backend
          if (phoneNumber) {
            try {
              await updateUserName(phoneNumber, trimmedName);
            } catch (apiError) {
              console.error("Failed to update name in backend:", apiError);
            }
          }
        }
      } catch (error) {
        console.error("Error updating user data:", error);
      }
    }

    setIsEditing(false);
  };

  // Handle logout logic
  const handleLogout = async () => {
    try {
      await logout();
      setUsername("Guest");
      setNameInput("Guest");
      setDropdownVisible(false);
      setIsEditing(false);
      window.dispatchEvent(new Event("userLogout")); // Custom event
      navigate("/"); // Redirect to home
    } catch (error) {
      console.error("Error during logout:", error);
      setDropdownVisible(false);
      navigate("/");
    }
  };

  // Get phone number from location state (if any)
  const location = useLocation() as { state?: { phoneNumber?: string } };
  const [phoneNumber] = useState(() => location.state?.phoneNumber || "9876543210");
  // console.log("Phone Number from location:", phoneNumber);
  // console.log(location.state);

  // Hide dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownVisible(false);
        setIsEditing(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <>
      <nav className="nav">
        {/* Logo (left) */}
        <img src={logo} alt="Logo" className="logo" />

        {/* If user is logged in, show profile section */}
        {currentUser ? (
          <div className="profile-section" ref={dropdownRef}>
            {/* Avatar (initial of username) */}
            <div className="avatar-circle large" onClick={toggleDropdown}>
              {username?.charAt(0).toUpperCase()}
            </div>

            {/* Dropdown menu */}
            {dropdownVisible && (
              <div className="dropdown-menu">
                <div className="dropdown-header">
                  <div className="avatar-circle">{username.charAt(0)}</div>

                  {/* Edit mode: input for name */}
                  {isEditing ? (
                    <div className="edit-name-section">
                      <input
                        type="text"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleSave();
                          } else if (e.key === "Escape") {
                            e.preventDefault();
                            setIsEditing(false);
                            setNameInput(username);
                          }
                        }}
                        placeholder="Enter your name"
                        maxLength={30}
                        autoFocus
                        className="edit-name-input"
                      />
                      <div className="edit-buttons">
                        <img
                          src={EditIcon}
                          alt="Save"
                          className="edit-icon"
                          onClick={handleSave}
                          title="Save (Enter)"
                          style={{ opacity: nameInput.trim() ? 1 : 0.5 }}
                        />
                        <button
                          className="cancel-edit"
                          onClick={() => {
                            setIsEditing(false);
                            setNameInput(username);
                          }}
                          title="Cancel (Esc)"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View mode: show name and edit icon
                    <div className="name-display">
                      <span className="display-name" title="Click to edit">
                        {username}
                      </span>
                      <img
                        src={EditIcon}
                        alt="Edit"
                        className="edit-icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsEditing(true);
                          setNameInput(username);
                        }}
                        title="Edit name"
                      />
                    </div>
                  )}
                </div>

                <hr className="divider" />

                {/* Bookings button */}
                <button
                  className="Booking"
                  onClick={() =>
                    navigate("/user", {
                      state: { phone: phoneNumber },
                    })
                  }
                >
                  Bookings
                </button>

                <hr className="divider" />

                {/* Logout button */}
                <div className="logout-btn" onClick={handleLogout}>
                  <img src={Login} alt="Logout" className="logout-icon" />
                  Log out
                </div>
              </div>
            )}
          </div>
        ) : (
          // If no user, show Login button
          <div className="login-section">
            <button
              className="login-button"
              onClick={() => navigate("/login")}
              title="Login"
            >
              <img src={Login} alt="Login" className="login-icon" />
              Login
            </button>
          </div>
        )}
      </nav>
    </>
  );
}

export default Hedder;
