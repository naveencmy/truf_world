import { useEffect, useState } from "react";
import "../styles/Secondpage.css";
import image1 from "../assets/herosectionbgg.jpg";
import image2 from "../assets/logo.png";
import image3 from "../assets/heroImage.svg";
import image4 from "../assets/img.jpeg";
import { getIndianTime } from "../services/api";

const images = [image1, image2, image3, image4];
const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MAX_DAYS_AHEAD = 1000;

type SecondpageProps = {
  onDateClick: (date: Date) => void;
};

const Secondpage: React.FC<SecondpageProps> = ({ onDateClick }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [currentDateTime, setCurrentDateTime] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [rollingDates, setRollingDates] = useState<Date[]>([]);
  const [visibleCount, setVisibleCount] = useState(3);
  const [startIndex, setStartIndex] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width <= 500) setVisibleCount(3);
      else if (width <= 768) setVisibleCount(4);
      else if (width <= 1024) setVisibleCount(5);
      else setVisibleCount(6);
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const fetchTime = async () => {
      const now = new Date(await getIndianTime());
      now.setHours(0, 0, 0, 0);
      setCurrentDateTime(now);
      setSelectedDate(now);
      const dates: Date[] = [];
      for (let i = 0; i < MAX_DAYS_AHEAD; i++) {
        const d = new Date(now);
        d.setDate(now.getDate() + i);
        dates.push(d);
      }
      setRollingDates(dates);
    };
    fetchTime();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % images.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    if (diff > 50) handleNext();
    else if (diff < -50) handlePrev();
    setTouchStartX(null);
  };

  const handlePrev = () => {
    setStartIndex((prev) => Math.max(prev - visibleCount, 0));
  };

  const handleNext = () => {
    const filteredDates = rollingDates.filter(
      (date) =>
        date.getFullYear() === selectedDate.getFullYear() &&
        date.getMonth() === selectedDate.getMonth()
    );
    const maxIndex = Math.max(0, filteredDates.length - visibleCount);
    setStartIndex((prev) => Math.min(prev + visibleCount, maxIndex));
  };

  const handleDateClick = (date: Date) => {
    if (date < currentDateTime) return;
    setSelectedDate(date);
    onDateClick(date);
  };

  const formatDate = (date: Date) => date.getDate();
  const isSelected = (date: Date) =>
    selectedDate.toDateString() === date.toDateString();

  const prevMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() - 1);
    if (
      newDate.getFullYear() < currentDateTime.getFullYear() ||
      (newDate.getFullYear() === currentDateTime.getFullYear() &&
        newDate.getMonth() < currentDateTime.getMonth())
    ) {
      return;
    }
    setSelectedDate(newDate);
    setStartIndex(0);
  };

  const nextMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setSelectedDate(newDate);
    setStartIndex(0);
  };

  return (
    <div className="container">
      {/* Image Carousel */}
      <div className="slider">
        <button
          className="nav-btn nav-left"
          onClick={() =>
            setCurrentSlide(
              (prev) => (prev - 1 + images.length) % images.length
            )
          }
        >
          &#x276E;
        </button>
        <div className="slider-image-wrapper">
          <div
            className="slider-track"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {images.map((src, index) => (
              <img
                key={index}
                src={src}
                alt={`Slide ${index + 1}`}
                className="slider-image"
                loading="lazy"
              />
            ))}
          </div>
        </div>
        <button
          className="nav-btn nav-right"
          onClick={() => setCurrentSlide((prev) => (prev + 1) % images.length)}
        >
          &#x276F;
        </button>
      </div>

      {/* Month Navigation */}
      <div className="calendar-nav">
        <button
          className="left-calendar"
          onClick={prevMonth}
          disabled={
            selectedDate.getFullYear() === currentDateTime.getFullYear() &&
            selectedDate.getMonth() === currentDateTime.getMonth()
          }
        >
          &#x276E;
        </button>
        <span>
          {selectedDate.toLocaleString("default", { month: "long" })}{" "}
          {selectedDate.getFullYear()}
        </span>
        <button className="right-calendar" onClick={nextMonth}>
          &#x276F;
        </button>
      </div>

      {/* Rolling Date Navigation */}
      <div className="calendar-nav weekdays-inside-nav">
        <button
          className="left-calendar"
          onClick={handlePrev}
          disabled={startIndex <= 0}
        >
          &#x276E;
        </button>
        <div
          className="weekdays"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {rollingDates
            .filter(
              (date) =>
                date.getFullYear() === selectedDate.getFullYear() &&
                date.getMonth() === selectedDate.getMonth()
            )
            .slice(startIndex, startIndex + visibleCount)
            .map((date, i) => (
              <div
                key={i}
                className={`day ${isSelected(date) ? "selected" : ""}`}
                onClick={() => handleDateClick(date)}
              >
                <span>{formatDate(date)}</span>
                <span>{weekdays[date.getDay()]}</span>
              </div>
            ))}
        </div>
        <button
          className="right-calendar"
          onClick={handleNext}
          disabled={
            startIndex >=
            Math.max(
              0,
              rollingDates.filter(
                (date) =>
                  date.getFullYear() === selectedDate.getFullYear() &&
                  date.getMonth() === selectedDate.getMonth()
              ).length - visibleCount
            )
          }
        >
          &#x276F;
        </button>
      </div>

      <div className="footer-msg">Book The Slot And Enjoy Your Day!</div>
    </div>
  );
};


export default Secondpage;
