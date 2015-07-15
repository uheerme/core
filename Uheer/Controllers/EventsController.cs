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

        private static readonly ConcurrentDictionary<StreamWriter, StreamWriter> connectedClients = new ConcurrentDictionary<StreamWriter, StreamWriter>();
        private static int messageCounter = 0;

        /// <summary>
        /// Get stream of events.
        /// </summary>
        /// <returns>A Stream of events that clients can listen.</returns>
        [Route("api/Channels/{channelId}/Events")]
        public HttpResponseMessage GetEventsStream([FromUri]int channelId)
        {
            var response = Request.CreateResponse();
            response.Content = new PushStreamContent((Action<Stream, HttpContent, TransportContext>)onMessageAvailable, "text/event-stream");
            return response;
        }

        /// <summary>
        /// Register the client stream in a queue.
        /// </summary>
        private static void onMessageAvailable(Stream stream, HttpContent content, TransportContext context)
        {
            StreamWriter streamWriter = new StreamWriter(stream);
            connectedClients.TryAdd(streamWriter, streamWriter);
        }

        public void messageCallback(string s)
        {
            foreach (var clientStream in connectedClients)
            {
                try
                {
                    clientStream.Value.WriteLine("id:" + messageCounter);
                    clientStream.Value.WriteLine("data:" + s + "\n");
                    clientStream.Value.Flush();
                }                    
                catch (Exception ex)
                {
                    if (ex.HResult == -2147023667) // Client disconnected.
                    {
                        StreamWriter ignored;
                        connectedClients.TryRemove(clientStream.Key, out ignored);
                        messageCallback("haha");
                    }
                    else
                    {
                        throw ex;
                    }
                }
            }
            messageCounter++;
        }

        static Timer _timer = default(Timer);
        public void OnTimerEvent(object state)
        {
            try
            {
                _timer.Change(Timeout.Infinite, Timeout.Infinite);
                messageCallback("mensagem numero " + messageCounter);
            }
            finally
            {
                _timer.Change(1000, 1000);
            }
        }
        public EventsController()
        {   
            _timer = _timer ?? new Timer(OnTimerEvent, null, 0, 1000);
        }
    }
}