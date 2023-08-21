using Microsoft.AspNetCore.Mvc;

namespace VisusCore.ControlRoomTheme.Controllers;

public class HomeController : Controller
{
    [HttpGet("/")]
    public IActionResult Index() => View();
}
