import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { sendOtp } from "../services/api";
import Logo from "../assets/logo.png";
import "./Login.css";

// Extend Window interface to include recaptchaVerifier

// API base URL
const API_BASE_URL = "https://api.turrfzone.com/api";
const baseUrlOtp = "https://otp.turrfzone.com";

function Login() {
  const [formData, setFormData] = useState({
    phone: "",
    username: "",
    otp: Array(6).fill("").join(""),
  });

  const [verified, setIsVerified] = useState(false);

  const [currentStep, setCurrentStep] = useState<
    "initial" | "phone-verify" | "username"
  >("initial");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [otpTimer, setOtpTimer] = useState(300);
  const [timerActive, setTimerActive] = useState(false);
  const navigate = useNavigate();

  const sendSMS = async () => {
    try {
      const phoneNumber = formData.phone;
      const response = await fetch(`${baseUrlOtp}/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: phoneNumber,
        }),
      });

      if (!response.ok) {
        console.log(
          `Failed to send SMS: ${response.status} ${response.statusText}`
        );
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log("API response:", data);
      return data;
    } catch (error) {
      console.error("Failed to send SMS:", error);
    }
  };

  const verifyOtp = async () => {
    try {
      const phoneNumber = formData.phone; // make sure formData.phone is defined
      const otp = formData.otp; // make sure formData.otp is defined

      console.log("Sending verify request:", { phoneNumber, otp });

      const response = await fetch(`${baseUrlOtp}/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: phoneNumber, // ✅ make sure your backend expects `phone` (not `phoneNumber`)
          otp: otp,
        }),
      });

      if (!response.ok) {
        const text = await response.text(); // helpful for debugging bad responses
        console.error(`Backend says:`, text);
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log("OTP verification response:", data);
      console.log();

      // ✅ adjust this check to match your backend’s real response
      if (response.ok) {
        setIsVerified(true);
      } else {
        setIsVerified(false);
        console.error("OTP verification failed:", data.message);
      }
      return true;
    } catch (error) {
      setIsVerified(false);
      console.error("Failed to verify OTP:", error);
      return false;
    }
  };

  // useEffect(() => {
  //   // Initialize reCAPTCHA with a slight delay to ensure the DOM element exists
  //   const initializeRecaptcha = () => {
  //     try {
  //       if (
  //         !window.recaptchaVerifier &&
  //         document.getElementById("recaptcha-container")
  //       ) {
  //         window.recaptchaVerifier = new RecaptchaVerifier(
  //           auth,
  //           "recaptcha-container",
  //           {
  //             size: "normal",
  //             callback: (_response: any) => {
  //               console.log("reCAPTCHA solved successfully");
  //               setRecaptchaVerified(true);
  //               setError(""); // Clear any previous errors
  //             },
  //             "expired-callback": () => {
  //               console.log("reCAPTCHA expired");
  //               setRecaptchaVerified(false);
  //               setError("reCAPTCHA expired. Please verify again.");
  //             },
  //           }
  //         );

  //         // Render the reCAPTCHA
  //         window.recaptchaVerifier
  //           .render()
  //           .then(() => {
  //             console.log("reCAPTCHA rendered successfully");
  //           })
  //           .catch((error) => {
  //             console.error("Error rendering reCAPTCHA:", error);
  //             setError("Failed to load reCAPTCHA. Please refresh the page.");
  //           });
  //       }
  //     } catch (error) {
  //       console.error("Error initializing reCAPTCHA:", error);
  //       setError("Failed to initialize reCAPTCHA. Please refresh the page.");
  //     }
  //   };

  //   // Use a timeout to ensure the DOM is ready
  //   const timeout = setTimeout(initializeRecaptcha, 1000);

  //   return () => {
  //     clearTimeout(timeout);
  //     // Clean up reCAPTCHA when component unmounts
  //     if (window.recaptchaVerifier) {
  //       try {
  //         window.recaptchaVerifier.clear();
  //         delete (window as any).recaptchaVerifier;
  //       } catch (error) {
  //         console.error("Error cleaning up reCAPTCHA:", error);
  //       }
  //     }
  //   };
  // }, []);

  // OTP Timer countdown effect
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (timerActive && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prevTimer) => {
          if (prevTimer <= 1) {
            setTimerActive(false);
            setError("OTP has expired. Please request a new one.");
            return 0;
          }
          return prevTimer - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [timerActive, otpTimer]);

  // Format timer display (MM:SS)
  const formatTimer = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
  };

  // Register new user
  const registerUser = async (phoneNumber: string, name: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/user/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber: phoneNumber,
          name: name,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return { success: true, userId: data.userId };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.message };
      }
    } catch (error) {
      console.error("Error registering user:", error);
      return { success: false, error: "Network error" };
    }
  };

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { phone } = formData;

      // Validate phone input
      if (!/^\d{10}$/.test(phone)) {
        setError("Please enter a valid 10-digit phone number.");
        setLoading(false);
        return;
      }

      // // Check if reCAPTCHA is verified
      // if (!recaptchaVerified) {
      //   setError("Please complete the reCAPTCHA verification.");
      //   setLoading(false);
      //   return;
      // }

      // Also send OTP using SampleOtpController for testing
      try {
        await sendOtp(phone); // Send just the 10-digit number to backend
        // console.log(
        //   "🎯 OTP also sent via SampleOtpController - Check backend console for OTP!"
        // );
      } catch (sampleOtpError) {
        // console.log("SampleOtp also failed:", sampleOtpError);
        // Don't fail the whole process if SampleOtp fails
      }

      // Move to OTP verification step
      setCurrentStep("phone-verify");

      // Start the 5-minute countdown timer
      setOtpTimer(300); // Reset to 5 minutes
      setTimerActive(true);

      setLoading(false);
    } catch (err: any) {
      setError(err.message || "Failed to send OTP. Please try again.");
      setLoading(false);
    }
  };

  const checkUserInDatabase = async (phoneNumber: string) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/user/check?phoneNumber=${phoneNumber}`
      );

      if (response.status === 200) {
        const data = await response.json();
        return { exists: true, name: data.name, userId: data.userId };
      } else if (response.status === 404) {
        return { exists: false };
      } else {
        console.error("Unexpected response:", response.status);
        return { exists: false };
      }
    } catch (error) {
      console.error("Error checking user:", error);
      return { exists: false };
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { otp, phone } = formData;
      let result;
      if (!otp || otp.length !== 6) {
        setError("Please enter a valid 6-digit OTP.");
        setLoading(false);
        return;
      }

      if (otpTimer === 0) {
        setError("OTP has expired. Please request a new one.");
        setLoading(false);
        return;
      }

      // Try SampleOtpController verification first
      // let otpVerified = false;
      try {
        // console.log(
        //   "🔐 Attempting OTP verification with SampleOtpController..."
        // );
        result = await verifyOtp();
        console.log(result);
        console.log(verified);
        if (result == true) setIsVerified(true);
        // else setIsVerified(false);
        // console.log("✅ OTP verified successfully via SampleOtpController!");
        // if(verified) otpVerified = true; // Set to true if verification is successful
      } catch (e) {
        console.log("❌ SampleOtpController verification failed:");
        console.log("🔄 Falling back to dummy OTP verification...");

        // Dummy OTP verification - accept any 6-digit code as fallback
        console.log("Verifying dummy OTP:", otp, "for phone:", phone);
        // otpVerified = true; // Accept any 6-digit code as fallback
        //  if(verified) otpVerified = true;
      }

      if (!result) {
        setError("Invalid OTP. Please try again.");
        setLoading(false);
        return;
      }

      // Stop the timer when OTP is successfully verified
      setTimerActive(false);

      // Check if user exists in database
      const userExists = await checkUserInDatabase(phone);

      if (userExists.exists) {
        // Store user info and redirect to home page
        console.log(userExists);
        localStorage.setItem(
          "user",
          JSON.stringify({
            userid: userExists.userId,
            username: userExists.name,
            phone: phone,
            isAuthenticated: true,
          })
        );

        // Trigger auth context update
        window.dispatchEvent(new CustomEvent("userLogin"));

        navigate("/");
      } else {
        // User needs to provide username
        setCurrentStep("username");
      }
    } catch (err: any) {
      console.error("Error verifying OTP:", err);
      setError("Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { username, phone } = formData; // Removed email since it's commented out

      if (!username.trim()) {
        setError("Please enter your name.");
        setLoading(false);
        return;
      }

      // Register the user
      const result = await registerUser(phone, username.trim());

      if (result.success) {
        // Store user info and redirect to home page
        const userData: any = {
          userid: result.userId,
          username: username.trim(),
          phone: phone,
          isAuthenticated: true,
        };

        localStorage.setItem("user", JSON.stringify(userData));

        // Trigger auth context update
        window.dispatchEvent(new CustomEvent("userLogin"));

        // Small delay to ensure auth context updates
        setTimeout(() => {
          navigate("/");
        }, 100);
      } else {
        setError(result.error || "Failed to register user. Please try again.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to register user. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP function
  const handleResendOTP = async () => {
    setLoading(true);
    setError("");

    try {
      const phoneNumber = `+91${formData.phone}`;
      console.log("Resending OTP to phone:", phoneNumber);

      // Also resend OTP using SampleOtpController for testing
      try {
        await sendOtp(formData.phone); // Send just the 10-digit number to backend
        console.log(
          "🎯 OTP also resent via SampleOtpController - Check backend console for OTP!"
        );
      } catch (sampleOtpError) {
        console.log("SampleOtp resend also failed:", sampleOtpError);
        // Don't fail the whole process if SampleOtp fails
      }

      // Reset and start the timer again
      setOtpTimer(300);
      setTimerActive(true);
      setError("");

      // Clear the OTP input
      setFormData((prev) => ({ ...prev, otp: "" }));
    } catch (err: any) {
      setError(err.message || "Failed to resend OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="overall">
      <div className="left-log">
        <img src={Logo} alt="Logo" className="logo-image" />
      </div>

      <div className="right-log">
        <div className="form">
          {currentStep === "initial" && (
            <form className="login-form" onSubmit={handleVerificationSubmit}>
              <h2>Login</h2>

              <div className="lables">
                <label htmlFor="phone">Phone Number:</label>
                <input
                  type="text"
                  id="phone"
                  name="phone"
                  maxLength={10}
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter 10-digit phone number"
                  required
                />
              </div>

              {error && <p className="error-message">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="submit-btn"
                onClick={sendSMS}
              >
                {loading ? "Sending OTP..." : "Send OTP"}
              </button>
            </form>
          )}

          {currentStep === "phone-verify" && (
            <form className="login-form" onSubmit={handleVerifyOTP}>
              <h2>Verify Phone Number</h2>
              <div className="message-container">
                <p className="success-message">
                  A verification code has been sent to{" "}
                  <strong>+91{formData.phone}</strong>.
                </p>
                <p>Please enter the 6-digit code below.</p>

                {/* OTP Timer Display */}
                <div className="otp-timer-container">
                  {timerActive ? (
                    <p className="timer-message">
                      OTP expires in:
                      <span
                        className="timer-display"
                        data-warning={
                          otpTimer <= 120 && otpTimer > 60 ? "true" : "false"
                        }
                        data-critical={otpTimer <= 60 ? "true" : "false"}
                      >
                        {formatTimer(otpTimer)}
                      </span>
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="lables">
                <label htmlFor="otp">Verification Code:</label>
                <div className="otp-input-container">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <input
                      key={i}
                      id={`otp-${i}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      className="otp-box"
                      disabled={otpTimer === 0}
                      value={formData.otp[i] || ""}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/, ""); // Digits only
                        const otpArray = formData.otp.split("");

                        otpArray[i] = val || ""; // If empty or cleared
                        setFormData((prev) => ({
                          ...prev,
                          otp: otpArray.join(""),
                        }));

                        if (val && i < 5) {
                          const next = document.getElementById(`otp-${i + 1}`);
                          if (next) (next as HTMLInputElement).focus();
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Backspace") {
                          const otpArray = formData.otp.split("");

                          // Clear current box
                          otpArray[i] = "";
                          setFormData((prev) => ({
                            ...prev,
                            otp: otpArray.join(""),
                          }));

                          // Move back
                          if (i > 0) {
                            const prevInput = document.getElementById(
                              `otp-${i - 1}`
                            );
                            if (prevInput)
                              (prevInput as HTMLInputElement).focus();
                          }
                        }
                      }}
                    />
                  ))}
                </div>
              </div>

              {error && <p className="error-message">{error}</p>}

              <button type="submit" disabled={loading || otpTimer === 0}>
                {loading ? "Verifying..." : "Verify Code"}
              </button>

              {/* Resend OTP Button - only show when timer has expired */}
              {otpTimer === 0 && (
                <button
                  type="button"
                  className="resend-button"
                  onClick={handleResendOTP}
                  disabled={loading}
                >
                  {loading ? "Resending..." : "Resend OTP"}
                </button>
              )}

              <button
                type="button"
                className="back-button"
                onClick={() => {
                  setCurrentStep("initial");
                  setError("");
                  setTimerActive(false);
                  setOtpTimer(300);
                }}
                disabled={loading}
              >
                Back
              </button>
            </form>
          )}

          {currentStep === "username" && (
            <form className="login-form" onSubmit={handleRegisterUser}>
              <h2>Complete Registration</h2>
              <div className="phone-display">
                <p>
                  <strong>Phone:</strong> {formData.phone}
                </p>
              </div>
              <div className="username-block">
                <div className="avatar">
                  {formData.username
                    ? formData.username.charAt(0).toUpperCase()
                    : "👤"}
                </div>
              </div>
              <div className="lables">
                <label htmlFor="username">User Name:</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Enter your name"
                  required
                />
              </div>

              {error && <p className="error-message">{error}</p>}

              <button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default Login;
