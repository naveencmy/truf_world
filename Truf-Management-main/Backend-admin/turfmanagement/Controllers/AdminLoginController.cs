using Microsoft.AspNetCore.Mvc;
using Npgsql;
using turfmanagement.Connection;
using System.Security.Cryptography;
using System.Text;

namespace turfmanagement.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AdminLoginController : ControllerBase
    {
        private readonly DatabaseConnection _db;

        public AdminLoginController(DatabaseConnection db)
        {
            _db = db;
        }

      [HttpPost("validate")]
public IActionResult Login([FromBody] LoginDto loginDto)
{
    using var conn = _db.GetConnection();
    conn.Open();

    string query = "SELECT PhoneNumber FROM admin WHERE username = @username";
    using var cmd = new NpgsqlCommand(query, conn);
    cmd.Parameters.AddWithValue("@username", loginDto.Username);

    using var reader = cmd.ExecuteReader();
    if (reader.Read())
    {
        return Ok(new
        {
            phoneNumber = reader["PhoneNumber"]
        });
    }

    return NotFound(new { message = "Admin not found" });
}

    }

    public class LoginDto
    {
        public string Username { get; set; }
        public string Password { get; set; }
    }
}
