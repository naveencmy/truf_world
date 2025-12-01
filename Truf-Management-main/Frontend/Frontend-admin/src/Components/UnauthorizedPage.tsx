import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const UnauthorizedPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to login after 3 seconds
    const timer = setTimeout(() => {
      navigate("/login", { replace: true });
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        textAlign: "center",
        backgroundColor: "#f5f5f5",
        padding: "20px",
      }}
    >
      <h1 style={{ color: "#d32f2f", marginBottom: "20px" }}>
        🔒 Unauthorized Access
      </h1>
      <p style={{ fontSize: "18px", marginBottom: "20px", color: "#666" }}>
        You need to log in to access this page.
      </p>
      <p style={{ fontSize: "14px", color: "#999" }}>
        Redirecting to login page in 3 seconds...
      </p>
      <button
        onClick={() => navigate("/login", { replace: true })}
        style={{
          marginTop: "20px",
          padding: "10px 20px",
          backgroundColor: "#1976d2",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          fontSize: "16px",
        }}
      >
        Go to Login
      </button>
    </div>
  );
};

export default UnauthorizedPage;
