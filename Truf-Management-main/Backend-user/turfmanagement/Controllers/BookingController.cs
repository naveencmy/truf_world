using Microsoft.AspNetCore.Mvc;
using Npgsql;
using turfmanagement.Connection;
using System.Globalization;

namespace turfmanagement.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BookingController : ControllerBase
    {
        private readonly DatabaseConnection _db;

        public BookingController(DatabaseConnection db)
        {
            _db = db;
        }

        [HttpPost("book")]
        public IActionResult BookSlot([FromBody] BookSlotDto dto)
        {
            using var conn = _db.GetConnection();
            conn.Open();
            // Ensure the unique constraint exists on (SlotDate, SlotTime)
string createConstraint = @"
    DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1
            FROM pg_constraint
            WHERE conname = 'slot_date_time_unique'
        ) THEN
            ALTER TABLE Slots ADD CONSTRAINT slot_date_time_unique UNIQUE (SlotDate, SlotTime);
        END IF;
    END $$;
";

using (var constraintCmd = new NpgsqlCommand(createConstraint, conn))
{
    constraintCmd.ExecuteNonQuery();
}

            using var tran = conn.BeginTransaction();

            try
            {
                if (!DateTime.TryParse(dto.BookingDate, out DateTime bookingDate))
                    return BadRequest(new { message = "Invalid date format" });

                string insertBooking = @"
                    INSERT INTO Bookings (UserId, BookingDate, SlotTimeFrom, SlotTimeTo, Amount)
                    VALUES (@userId, @date, @from, @to, @amount)
                    RETURNING BookingId;
                ";

                using var cmdBooking = new NpgsqlCommand(insertBooking, conn);
                cmdBooking.Parameters.AddWithValue("@userId", dto.UserId);
                cmdBooking.Parameters.AddWithValue("@date", bookingDate.Date);
                cmdBooking.Parameters.AddWithValue("@from", dto.SlotTimeFrom);
                cmdBooking.Parameters.AddWithValue("@to", dto.SlotTimeTo);
                cmdBooking.Parameters.AddWithValue("@amount", dto.Amount);
                cmdBooking.Transaction = tran;

                int bookingId = (int)cmdBooking.ExecuteScalar();

                try
                {
                    DateTime referenceDate = DateTime.Today;

                    DateTime from = DateTime.ParseExact(
                        dto.SlotTimeFrom,
                        new[] { "h tt", "hh tt" },
                        CultureInfo.InvariantCulture,
                        DateTimeStyles.None);

                    DateTime to = dto.SlotTimeTo == "12 AM"
                        ? referenceDate.AddDays(1).Date
                        : DateTime.ParseExact(dto.SlotTimeTo,
                                              new[] { "h tt", "hh tt" },
                                              CultureInfo.InvariantCulture,
                                              DateTimeStyles.None);

                    from = referenceDate.Date.Add(from.TimeOfDay);
                    if (dto.SlotTimeTo != "12 AM")
                        to = referenceDate.Date.Add(to.TimeOfDay);

                    if (to <= from && dto.SlotTimeTo != "12 AM")
                        to = to.AddDays(1);

                    for (DateTime time = from; time < to; time = time.AddHours(1))
                    {
                        string timeStr = time.ToString("h tt");

                        string insertSlot = @"
                            INSERT INTO Slots (SlotDate, SlotTime, Status, BookingId)
                            VALUES (@date, @time, 'Unavailable', @bookingId)
                            ON CONFLICT (SlotDate, SlotTime) DO UPDATE
                            SET Status = 'Unavailable', BookingId = @bookingId;
                        ";

                        using var cmdSlot = new NpgsqlCommand(insertSlot, conn);
                        cmdSlot.Parameters.AddWithValue("@date", bookingDate.Date);
                        cmdSlot.Parameters.AddWithValue("@time", timeStr);
                        cmdSlot.Parameters.AddWithValue("@bookingId", bookingId);
                        cmdSlot.Transaction = tran;
                        cmdSlot.ExecuteNonQuery();
                    }
                }
                catch (FormatException ex)
                {
                    tran.Rollback();
                    return BadRequest(new { message = $"Invalid time format: {ex.Message}" });
                }
                catch (Exception ex)
                {
                    tran.Rollback();
                    return BadRequest(new { message = $"Error processing time slots: {ex.Message}" });
                }

                string updateUser = @"
                    UPDATE Users
                    SET LastBookingDate = @date
                    WHERE UserId = @userId;
                ";

                using var cmdUser = new NpgsqlCommand(updateUser, conn);
                cmdUser.Parameters.AddWithValue("@date", bookingDate.Date);
                cmdUser.Parameters.AddWithValue("@userId", dto.UserId);
                cmdUser.Transaction = tran;
                cmdUser.ExecuteNonQuery();

                tran.Commit();
                return Ok(new { message = "Booking successful", bookingId });
            }
            catch (Exception ex)
            {
                tran.Rollback();
                return StatusCode(500, new { message = "Booking failed", error = ex.Message });
            }
        }

        [HttpGet("user/{userId}")]
        public IActionResult GetBookingsByUser(int userId)
        {
            var bookings = new List<BookingDto>();
            using var conn = _db.GetConnection();
            conn.Open();

            string query = @"
                SELECT BookingId, UserId, BookingDate, SlotTimeFrom, SlotTimeTo, Amount
                FROM Bookings
                WHERE UserId = @userId
                ORDER BY BookingDate DESC, SlotTimeFrom;
            ";

            using var cmd = new NpgsqlCommand(query, conn);
            cmd.Parameters.AddWithValue("@userId", userId);

            using var reader = cmd.ExecuteReader();
            while (reader.Read())
            {
                bookings.Add(new BookingDto
                {
                    BookingId = (int)reader["BookingId"],
                    UserId = (int)reader["UserId"],
                    BookingDate = ((DateTime)reader["BookingDate"]).ToString("yyyy-MM-dd"),
                    SlotTimeFrom = reader["SlotTimeFrom"].ToString(),
                    SlotTimeTo = reader["SlotTimeTo"].ToString(),
                    Amount = (decimal)reader["Amount"]
                });
            }

            return Ok(bookings);
        }

        [HttpGet("all")]
        public IActionResult GetAllBookings()
        {
            var bookings = new List<BookingDto>();
            using var conn = _db.GetConnection();
            conn.Open();

            string query = @"
                SELECT BookingId, UserId, BookingDate, SlotTimeFrom, SlotTimeTo, Amount
                FROM Bookings
                ORDER BY BookingDate DESC, SlotTimeFrom;
            ";

            using var cmd = new NpgsqlCommand(query, conn);

            using var reader = cmd.ExecuteReader();
            while (reader.Read())
            {
                bookings.Add(new BookingDto
                {
                    BookingId = (int)reader["BookingId"],
                    UserId = (int)reader["UserId"],
                    BookingDate = ((DateTime)reader["BookingDate"]).ToString("yyyy-MM-dd"),
                    SlotTimeFrom = reader["SlotTimeFrom"].ToString(),
                    SlotTimeTo = reader["SlotTimeTo"].ToString(),
                    Amount = (decimal)reader["Amount"]
                });
            }

            return Ok(bookings);
        }

        [HttpDelete("cleanup-slots")]
        public IActionResult CleanupOldSlots()
        {
            using var conn = _db.GetConnection();
            conn.Open();

            try
            {
                string deleteOldSlots = "DELETE FROM Slots WHERE SlotDate < CURRENT_DATE;";
                using var cmd = new NpgsqlCommand(deleteOldSlots, conn);
                int deleted = cmd.ExecuteNonQuery();

                return Ok(new { message = "Old slots deleted", deletedCount = deleted });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to delete old slots", error = ex.Message });
            }
        }

        
    }

    public class BookSlotDto
    {
        public int UserId { get; set; }
        public string BookingDate { get; set; }  // "2025-06-24"
        public string SlotTimeFrom { get; set; }  // "02 PM"
        public string SlotTimeTo { get; set; }    // "05 PM"
        public decimal Amount { get; set; }
    }

    public class BookingDto
    {
        public int BookingId { get; set; }
        public int UserId { get; set; }
        public string BookingDate { get; set; }
        public string SlotTimeFrom { get; set; }
        public string SlotTimeTo { get; set; }
        public decimal Amount { get; set; }
    }
}
