export const isAuthenticated = (): boolean => {
  try {
    const user = localStorage.getItem("user");
    if (!user) return false;

    const userData = JSON.parse(user);

    // Check if user has isAuthenticated flag
    if (!userData.isAuthenticated) return false;

    // Optional: Check if login time is within acceptable range (e.g., 24 hours)
    if (userData.loginTime) {
      const loginTime = new Date(userData.loginTime);
      const now = new Date();
      const hoursDiff =
        (now.getTime() - loginTime.getTime()) / (1000 * 60 * 60);

      // If more than 24 hours, consider session expired
      if (hoursDiff > 24) {
        logout();
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error("Error checking authentication:", error);
    return false;
  }
};

export const getUser = () => {
  try {
    const user = localStorage.getItem("user");
    if (!user) return null;

    return JSON.parse(user);
  } catch (error) {
    console.error("Error getting user data:", error);
    return null;
  }
};

export const logout = () => {
  localStorage.removeItem("user");
  window.dispatchEvent(new CustomEvent("userLogout"));
};

export const updateUserSession = () => {
  try {
    const user = localStorage.getItem("user");
    if (user) {
      const userData = JSON.parse(user);
      userData.loginTime = new Date().toISOString();
      localStorage.setItem("user", JSON.stringify(userData));
    }
  } catch (error) {
    console.error("Error updating user session:", error);
  }
};
