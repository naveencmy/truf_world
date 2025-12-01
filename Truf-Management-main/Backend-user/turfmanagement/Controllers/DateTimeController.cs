using Microsoft.AspNetCore.Mvc;
using System;

namespace YourNamespace.Controllers
{
    [ApiController]
    public class DateTimeController : ControllerBase
    {
        [HttpGet("api/current-datetime")]
        public IActionResult GetServerDateTime()
        {
            return Ok(new { dateTime = DateTime.Now });  
        }
    }
}
