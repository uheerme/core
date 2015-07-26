using Uheer.ViewModels;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web.Http;
using System.Web.Http.Description;
using System.IO;
using System.Collections.Concurrent;
using System.Threading; //Just to debug, need to be deleted.

namespace Uheer.Controllers
{
    /// <summary>
    /// The controller responsible for managing play, pause and update events for 
    /// a channel.
    /// </summary>
    [RoutePrefix("api/Events")]
    public class EventsController : ApiController
    {
        /// <summary>
        /// The map of ChannelID -> StreamService maintained in memory.
        /// </summary>
        protected static readonly ConcurrentDictionary<int, UheerPushStreamService> streams
            = new ConcurrentDictionary<int, UheerPushStreamService>();

        /// <summary>
        /// Get the event stream for a specific channel.
        /// </summary>
        /// <param name="id">The id of the channel associated with the event stream.</param>
        /// <returns>A Stream of events that clients can listen.</returns>
        [Route("{id}")]
        public HttpResponseMessage GetEventsStream(int id)
        {
            var response = Request.CreateResponse();

            UheerPushStreamService s = streams.GetOrAdd(id, (key) => new UheerPushStreamService());
            response.Content = s.GetResponseContext();

            return response;
        }

        /// <summary>
        /// Send a message to all peers connected to the specified channel.
        /// </summary>
        /// <param name="id">Channel which the message is referencing</param>
        /// <param name="message">Message that is intended to send</param>
        /// <returns>A Ok response.</returns>
        [Route("{id}/{message}")]
        public IHttpActionResult GetBroadcastMessage(int id, string message)
        {
            if (!streams.ContainsKey(id))
            {
                return BadRequest("Cannot broadcast to nonexistent channel #" + id + ".");
            }

            UheerPushStreamService s;
            if (streams.TryGetValue(id, out s) && !s.SendMessage(message))
            {
                streams.TryRemove(id, out s);
            }

            return Ok();
        }
    }
}
