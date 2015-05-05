using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace Uheer.Controllers
{
    /// <summary>
    /// The web application's controller.
    /// </summary>
    public class HomeController : Controller
    {
        /// <summary>
        /// The method that returns the Home view, which contains the angular.js application.
        /// </summary>
        /// <returns>The Home view.</returns>
        public ActionResult Index()
        {
            return View();
        }
    }
}
