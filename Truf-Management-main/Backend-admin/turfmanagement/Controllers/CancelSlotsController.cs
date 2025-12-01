using Microsoft.AspNetCore.Mvc;
using Npgsql;
using turfmanagement.Connection;
using System;
using System.Collections.Generic;

namespace turfmanagement.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CancelSlotsController : ControllerBase
    {
        private readonly DatabaseConnection _db;

        public CancelSlotsController(DatabaseConnection db)
        {
            _db = db;
        }

        [HttpPost("cancel")]
        public IActionResult CancelSlots([FromBody] CancelSlotDto dto)
        {
            int userId = 0;
            int bookingId = 0;
            string phoneno = "0";
            Console.WriteLine("📥 Received CancelSlots request");

            if (dto.Slots == null || dto.Slots.Count == 0 || string.IsNullOrWhiteSpace(dto.Reason))
            {
                return BadRequest(new { message = "Please provide slot list and reason." });
            }

            using var conn = _db.GetConnection();
            conn.Open();
            using var tran = conn.BeginTransaction();

            try
            {
                foreach (var slot in dto.Slots)
                {
                    if (!DateTime.TryParse(slot.SlotDate, out DateTime parsedDate))
                    {
                        Console.WriteLine($"❌ Invalid date format: {slot.SlotDate}");
                        continue;
                    }

                    try
                    {
                         string getBookingQuery = @"
                        
                        SELECT bookingid, userid
                        FROM bookings
                        WHERE bookingdate = @date
                        AND (
                        (to_timestamp(slottimefrom, 'HH12 AM')::time < to_timestamp(slottimeto, 'HH12 AM')::time
                        AND to_timestamp(@time, 'HH12 AM')::time >= to_timestamp(slottimefrom, 'HH12 AM')::time
                        AND to_timestamp(@time, 'HH12 AM')::time < to_timestamp(slottimeto, 'HH12 AM')::time)

                        OR

                        (to_timestamp(slottimefrom, 'HH12 AM')::time > to_timestamp(slottimeto, 'HH12 AM')::time
                        AND (
                            to_timestamp(@time, 'HH12 AM')::time >= to_timestamp(slottimefrom, 'HH12 AM')::time
                            OR to_timestamp(@time, 'HH12 AM')::time < to_timestamp(slottimeto, 'HH12 AM')::time
                        ))
                        )";

                        

                        using (var cmd = new NpgsqlCommand(getBookingQuery, conn, tran))
                        {
                            cmd.Parameters.AddWithValue("@date", parsedDate.Date);
                            cmd.Parameters.AddWithValue("@time", slot.SlotTime.Trim());


                            using var reader = cmd.ExecuteReader();
                            if (reader.Read())
                            {
                                bookingId = reader.GetInt32(0);
                                userId = reader.GetInt32(1);
                            }
                            else
                            {
                                Console.WriteLine($"⚠️ No matching booking found for date: {parsedDate}, time: {slot.SlotTime}");
                                continue;
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine("💥 Error while fetching UserId and BookingId:");
                        Console.WriteLine($"Exception: {ex.Message}");
                        return StatusCode(500, new { message = "Error fetching booking info", error = ex.Message });
                    }

                    Console.WriteLine($"📅 Booking found - UserId: {userId}, BookingId: {bookingId}");

                    // Step 2: Get user details
                    string userName = "Unknown";
                    string phoneNumber = null;

                    string getUserDetailsQuery = @"
                        SELECT Name, PhoneNumber
                        FROM Users
                        WHERE UserId = @userId;
                    ";

                    using (var cmdUserDetails = new NpgsqlCommand(getUserDetailsQuery, conn, tran))
                    {
                        cmdUserDetails.Parameters.AddWithValue("@userId", userId);
                        using var reader = cmdUserDetails.ExecuteReader();
                        if (reader.Read())
                        {
                            userName = reader.GetString(0);
                            phoneNumber = reader.IsDBNull(1) ? null : reader.GetString(1);
                        }
                    }

                    phoneno = phoneNumber ?? "0";
                    Console.WriteLine($"👤 User details - Name: {userName}, Phone: {phoneNumber}");

                    // Step 3: Insert cancellation info
                    string insertCancel = @"
                        INSERT INTO cancelled_slots (reason, user_id, phone_number, cancelled_by, cancelled_at)
                        VALUES (@reason, @userId, @phoneNumber, @cancelledBy, @cancelledAt);
                    ";

                    using (var cmdInsert = new NpgsqlCommand(insertCancel, conn, tran))
                    {
                        cmdInsert.Parameters.AddWithValue("@reason", dto.Reason);
                        cmdInsert.Parameters.AddWithValue("@userId", userId);
                        cmdInsert.Parameters.AddWithValue("@phoneNumber", (object)phoneNumber ?? DBNull.Value);
                        cmdInsert.Parameters.AddWithValue("@cancelledBy", "admin");
                        cmdInsert.Parameters.AddWithValue("@cancelledAt", DateTime.UtcNow);
                        cmdInsert.ExecuteNonQuery();
                    }

                    // Step 4: Delete the booking
                    if (bookingId > 0)
                    {
                        string deleteBooking = "DELETE FROM slots WHERE bookingid = @bookingId;";

                        using (var cmdDelete = new NpgsqlCommand(deleteBooking, conn, tran))
                        {
                            cmdDelete.Parameters.AddWithValue("@bookingId", bookingId);
                            cmdDelete.ExecuteNonQuery();
                        }

                        string deleteBookingInfo = "DELETE FROM bookings WHERE bookingid = @bookingId;";

                        using (var cmdDeleteInfo = new NpgsqlCommand(deleteBookingInfo, conn, tran))
                        {
                            cmdDeleteInfo.Parameters.AddWithValue("@bookingId", bookingId);
                            cmdDeleteInfo.ExecuteNonQuery();
                        }
                    }
                }

                tran.Commit();
                return Ok(new { phoneno });
            }
            catch (Exception ex)
            {
                try { tran.Rollback(); } catch { }
                return StatusCode(500, new { message = "Error cancelling slots", error = ex.Message });
            }
        }
    }

    public class CancelSlotDto
    {
        public List<SlotEntry> Slots { get; set; }
        public string Reason { get; set; }
    }

    public class SlotEntry
    {
        public string SlotDate { get; set; }
        public string SlotTime { get; set; }
    }
}
