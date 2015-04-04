using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web.Http;
using System.Web.Http.Description;

namespace Samesound.Controllers
{
    /// <summary>
    /// The controller responsible for reporting the API status.
    /// </summary>
    [RoutePrefix("api/Status")]
    public class StatusController : ApiController
    {
        /// <summary>
        /// Get the current timestamp set in the server.
        /// For synchronization purposes, please consider the round trip time-frame when requesting this route.
        /// </summary>
        /// <returns>A DateTime representing the current timestamp in the server.</returns>
        [Route("Now")]
        [ResponseType(typeof(DateTime))]
        public IHttpActionResult GetCurrentTime()
        {
            return Ok(DateTime.Now);
        }
    }
}
