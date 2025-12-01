using Microsoft.AspNetCore.Mvc;
using Npgsql;
using turfmanagement.Connection;
using System;
using System.Collections.Generic;
using System.Globalization;

namespace turfmanagement.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AdminDashboardController : ControllerBase
    {
        private readonly DatabaseConnection _db;

        private static readonly string[] MonthNames = {
            "Jan", "Feb", "Mar", "Apr", "May", "Jun",
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
        };

        private static readonly string[] Colors = {
            "#FF5733", "#33C1FF", "#FFC300", "#DAF7A6", "#C70039", "#900C3F",
            "#581845", "#4CAF50", "#FF9800", "#3F51B5", "#E91E63", "#795548"
        };

        public AdminDashboardController(DatabaseConnection db)
        {
            _db = db;
        }

        private int CalculateHourDifference(string from, string to)
        {
            try
            {
                DateTime fromTime = DateTime.ParseExact(from.Trim(), "h tt", CultureInfo.InvariantCulture);
                DateTime toTime = DateTime.ParseExact(to.Trim(), "h tt", CultureInfo.InvariantCulture);

                var diff = (toTime - fromTime).TotalHours;
                if (diff < 0) diff += 24;

                return (int)Math.Round(diff);
            }
            catch
            {
                return 0;
            }
        }

        [HttpGet("year")]
        public IActionResult GetYearlyStats([FromQuery] int year)
        {
            var result = new List<MonthBookingData>();
            int totalBookings = 0;
            int totalHours = 0;

            try
            {
                using var conn = _db.GetConnection();
                conn.Open();

                string query = @"
                    SELECT 
                        EXTRACT(MONTH FROM BookingDate) AS month,
                        SlotTimeFrom,
                        SlotTimeTo
                    FROM Bookings
                    WHERE EXTRACT(YEAR FROM BookingDate) = @year;
                ";

                using var cmd = new NpgsqlCommand(query, conn);
                cmd.Parameters.AddWithValue("@year", year);

                using var reader = cmd.ExecuteReader();
                var counts = new Dictionary<int, (int count, int hours)>();

                while (reader.Read())
                {
                    int month = Convert.ToInt32(reader["month"]);
                    string from = reader["SlotTimeFrom"].ToString();
                    string to = reader["SlotTimeTo"].ToString();

                    int hours = CalculateHourDifference(from, to);

                    if (!counts.ContainsKey(month))
                        counts[month] = (0, 0);

                    counts[month] = (counts[month].count + 1, counts[month].hours + hours);
                    totalBookings++;
                    totalHours += hours;
                }

                for (int i = 1; i <= 12; i++)
                {
                    result.Add(new MonthBookingData
                    {
                        Label = MonthNames[i - 1],
                        Bookings = counts.ContainsKey(i) ? counts[i].count : 0,
                        Hours = counts.ContainsKey(i) ? counts[i].hours : 0,
                        Color = Colors[i - 1]
                    });
                }
            }
            catch (Exception ex)
            {

                return StatusCode(500, new { message = "Failed to fetch yearly stats." + ex.Message });
            }

            return Ok(new { totalBookings, totalHours, data = result });
        }

        [HttpGet("month")]
        public IActionResult GetMonthlyStats([FromQuery] int month, [FromQuery] int year)
        {
            var result = new List<DayBookingData>();
            int totalBookings = 0;
            int totalHours = 0;

            try
            {
                using var conn = _db.GetConnection();
                conn.Open();

                string query = @"
                    SELECT 
                        EXTRACT(DAY FROM BookingDate) AS day,
                        SlotTimeFrom,
                        SlotTimeTo
                    FROM Bookings
                    WHERE EXTRACT(MONTH FROM BookingDate) = @month AND EXTRACT(YEAR FROM BookingDate) = @year;
                ";

                using var cmd = new NpgsqlCommand(query, conn);
                cmd.Parameters.AddWithValue("@month", month);
                cmd.Parameters.AddWithValue("@year", year);

                using var reader = cmd.ExecuteReader();
                var counts = new Dictionary<int, (int count, int hours)>();

                while (reader.Read())
                {
                    int day = Convert.ToInt32(reader["day"]);
                    string from = reader["SlotTimeFrom"].ToString();
                    string to = reader["SlotTimeTo"].ToString();

                    int hours = CalculateHourDifference(from, to);

                    if (!counts.ContainsKey(day))
                        counts[day] = (0, 0);

                    counts[day] = (counts[day].count + 1, counts[day].hours + hours);
                    totalBookings++;
                    totalHours += hours;
                }

                int daysInMonth = DateTime.DaysInMonth(year, month);
                for (int i = 1; i <= daysInMonth; i++)
                {
                    result.Add(new DayBookingData
                    {
                        Day = i,
                        Bookings = counts.ContainsKey(i) ? counts[i].count : 0,
                        Hours = counts.ContainsKey(i) ? counts[i].hours : 0
                    });
                }
            }
            catch (Exception ex)
            {

                return StatusCode(500, new { message = "Failed to fetch monthly stats." + ex.Message });
            }

            return Ok(new { totalBookings, totalHours, data = result });
        }

        [HttpGet("summary")]
        public IActionResult GetSummary()
        {
            var summary = new CountSummary();

            try
            {
                using var conn = _db.GetConnection();
                conn.Open();

                string query = @"
                    SELECT BookingDate, SlotTimeFrom, SlotTimeTo
                    FROM Bookings;
                ";

                using var cmd = new NpgsqlCommand(query, conn);
                using var reader = cmd.ExecuteReader();

                DateTime today = DateTime.Today;

                while (reader.Read())
                {
                    DateTime date = Convert.ToDateTime(reader["BookingDate"]);
                    string from = reader["SlotTimeFrom"].ToString();
                    string to = reader["SlotTimeTo"].ToString();

                    int hours = CalculateHourDifference(from, to);

                    if (date == today)
                    {
                        summary.Today++;
                        summary.TodayHours += hours;
                    }
                    else if (date > today)
                    {
                        summary.Upcoming++;
                        summary.UpcomingHours += hours;
                    }
                    else
                    {
                        summary.Past++;
                        summary.PastHours += hours;
                    }
                }
            }
            catch (Exception ex)
            {

                return StatusCode(500, new { message = "Failed to fetch summary data." + ex.Message });
            }

            return Ok(summary);
        }

        public class MonthBookingData
        {
            public string Label { get; set; }
            public int Bookings { get; set; }
            public int Hours { get; set; }
            public string Color { get; set; }
        }

        public class DayBookingData
        {
            public int Day { get; set; }
            public int Bookings { get; set; }
            public int Hours { get; set; }
        }

        public class CountSummary
        {
            public int Today { get; set; }
            public int Upcoming { get; set; }
            public int Past { get; set; }
            public int TodayHours { get; set; }
            public int UpcomingHours { get; set; }
            public int PastHours { get; set; }
        }
    }
}