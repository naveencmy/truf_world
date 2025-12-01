import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Hedder from "./Components/Hedder";
import Hero from "./Components/Hero";
import Login from "./Login/Login";
import Secondpage from "./Components/Secondpage";
import Thirdpage from "./Components/Thirdpage";
import { useRef, useEffect, useState } from "react";
import { useAuth } from "./context/AuthContext";
import User from "./Components/User";
import Footer from "./Components/Footer";

function App() {
  const secondPageRef = useRef<HTMLDivElement>(null);
  const thirdPageRef = useRef<HTMLDivElement>(null);

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { currentUser, loading } = useAuth();

  useEffect(() => {
    window.scrollTo(0, 0);

    // Set the correct Indian time when component mounts
    const setInitialDate = async () => {
      try {
        const { getIndianTime } = await import("./services/api");
        const indianTime = await getIndianTime();
        setSelectedDate(new Date(indianTime));
      } catch (error) {
        console.error("Failed to get Indian time:", error);
        // Fall back to local time if API fails
        setSelectedDate(new Date());
      }
    };

    setInitialDate();
  }, []);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          fontSize: "1.5rem",
        }}
      >
        Loading...
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={currentUser ? <Navigate to="/" /> : <Login />}
        />
        <Route
          path="/"
          element={
            <>
              <Hedder />
              <Hero
                onScrollClick={() => {
                  secondPageRef.current?.scrollIntoView({ behavior: "smooth" });
                }}
              />
              <div ref={secondPageRef}>
                <Secondpage onDateClick={(date) => setSelectedDate(date)} />
              </div>
              <div ref={thirdPageRef}>
                <Thirdpage selectedDate={selectedDate} />
                <Footer />
              </div>
            </>
          }
        />
        <Route path="/user" element={<User />} />
      </Routes>
    </Router>
  );
}

export default App;
