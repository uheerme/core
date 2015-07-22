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
    public class EventsController : ApiController
    {

        private static readonly ConcurrentDictionary<int, UheerPushStreamService> channelsStreams = new ConcurrentDictionary<int, UheerPushStreamService>();

        /// <summary>
        /// Get stream of events.
        /// </summary>
        /// <returns>A Stream of events that clients can listen.</returns>
        [Route("api/Channels/{channelId}/Events")]
        public HttpResponseMessage GetEventsStream([FromUri]int channelId)
        {
            var response = Request.CreateResponse();
            UheerPushStreamService uheerPushStream = channelsStreams.GetOrAdd(channelId, (key) => 
             new UheerPushStreamService());
            response.Content = uheerPushStream.getResponseContext();
            return response;
        }

        /// <summary>
        /// Send a message to all peers connected to the specified channel
        /// </summary>
        /// <param name="channelId">Channel which the message is referencing</param>
        /// <param name="message">Message that is intended to send</param>
        [Route("api/Channels/{channelId}/Events/{message}")]
        [HttpGet]
        public void sendMessage(int channelId, string message)
        {
            UheerPushStreamService channelStream;
            if (channelsStreams.TryGetValue(channelId, out channelStream) && !channelStream.sendMessage(message))
            {
                channelsStreams.TryRemove(channelId, out channelStream);
                // Is necessary a message to be sent to a channel that nobody is receiving events 
                //to clean the channelStream from memory.
            }
        }
    }
}