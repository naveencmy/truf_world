import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { isAuthenticated } from "../utils/auth";
import Logo from "../assets/logo.png";
import "./Login.css";

function Login() {
  const baseUrlValidate = "https://admin-api.turrfzone.com";
  const baseUrlOtp = "https://otp.turrfzone.com";

  const [formData, setFormData] = useState({
    username: "",
    otp: Array(6).fill("").join(""),
    password: "",
    phoneNumber: "",
  });

  const [currentStep, setCurrentStep] = useState<"initial" | "phone-verify">(
    "initial"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [otpTimer, setOtpTimer] = useState(300);
  const [timerActive, setTimerActive] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const navigate = useNavigate();

  // Check if user is already authenticated and redirect to dashboard
  useEffect(() => {
    if (isAuthenticated()) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  const sendSMS = async () => {
    try {
      const response = await fetch(`${baseUrlOtp}/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: "9361070035",
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Failed to send SMS:", error);
    }
  };

  const verifyOtp = async () => {
    try {
      const response = await fetch(`${baseUrlOtp}/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: phoneNumber,
          otp: formData.otp,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        console.error(`Backend says:`, text);
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      return true;
    } catch (error) {
      return false;
    }
  };

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

    return () => clearInterval(interval);
  }, [timerActive, otpTimer]);

  const formatTimer = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    setCurrentStep("phone-verify");
    setOtpTimer(300);
    setTimerActive(true);
    setLoading(false);
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { otp } = formData;

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

    const result = await verifyOtp();

    if (result) {
      setTimerActive(false);
      localStorage.setItem(
        "user",
        JSON.stringify({
          username: formData.username,
          phone: formData.phoneNumber,
          isAuthenticated: true,
          loginTime: new Date().toISOString(),
        })
      );
      window.dispatchEvent(new CustomEvent("userLogin"));
      navigate("/");
      setLoading(false);
    } else {
      setError("Invalid OTP. Please try again.");
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    setError("");

    try {
      await sendSMS();
      setOtpTimer(300);
      setTimerActive(true);
      setFormData((prev) => ({ ...prev, otp: "" }));
    } catch (err: any) {
      setError(err.message || "Failed to resend OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleValidatePassword = async () => {
    if (!formData.username || !formData.password) {
      setError("Enter both username and password");
      return;
    }

    try {
      const response = await fetch(
        `${baseUrlValidate}/api/AdminLogin/validate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: formData.username,
            password: formData.password,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        await setPhoneNumber(data.phoneNumber);
        sendSMS();
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Invalid credentials");
      }
    } catch (err) {
      setError("Failed to validate. Try again.");
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
                <label htmlFor="username">Username :</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Enter your username"
                  required
                />
              </div>
              <div className="lables">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  required
                />
              </div>
              {error && <p className="error-message">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="submit-btn"
                onClick={handleValidatePassword}
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
                  <strong>+91{phoneNumber}</strong>.
                </p>

                <div className="otp-timer-container">
                  {timerActive ? (
                    <p className="timer-message">
                      OTP expires in:
                      <span className="timer-display">
                        {formatTimer(otpTimer)}
                      </span>
                    </p>
                  ) : otpTimer === 0 ? (
                    <p className="timer-expired">
                      OTP has expired. Please go back and request a new one.
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="lables">
                <p>Please enter the 6-digit code below.</p>

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
                        const val = e.target.value.replace(/\D/, "");
                        const otpArray = formData.otp.split("");
                        otpArray[i] = val || "";
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
                          otpArray[i] = "";
                          setFormData((prev) => ({
                            ...prev,
                            otp: otpArray.join(""),
                          }));
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
                className="L-back-button"
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
        </div>
      </div>
    </div>
  );
}

export default Login;
