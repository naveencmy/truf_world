import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { isAuthenticated } from "../utils/auth";

export const useAuthRedirect = (redirectTo: string = "/login") => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate(redirectTo, { replace: true });
    }
  }, [navigate, redirectTo]);
};

export const useRequireAuth = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = () => {
      if (!isAuthenticated()) {
        navigate("/login", { replace: true });
      }
    };

    checkAuth();

    // Listen for auth changes
    window.addEventListener("userLogout", checkAuth);

    return () => {
      window.removeEventListener("userLogout", checkAuth);
    };
  }, [navigate]);

  return isAuthenticated();
};
