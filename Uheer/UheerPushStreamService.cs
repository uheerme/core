using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web;

namespace Uheer
{
    public class UheerPushStreamService
    {
        private readonly ConcurrentDictionary<StreamWriter, StreamWriter> connectedClients = new ConcurrentDictionary<StreamWriter, StreamWriter>();
        private static int messageCounter = 0;

        public PushStreamContent getResponseContext()
        {
            return new PushStreamContent((Action<Stream, HttpContent, TransportContext>)onMessageAvailable, "text/event-stream");
        }

        private void onMessageAvailable(Stream stream, HttpContent content, TransportContext context)
        {
            StreamWriter streamWriter = new StreamWriter(stream);
            connectedClients.TryAdd(streamWriter, streamWriter);
        }

        public bool sendMessage(string s)
        {
            foreach (var clientStream in connectedClients)
            {
                try
                {
                    clientStream.Value.WriteLine("id:" + messageCounter++);
                    clientStream.Value.WriteLine("data:" + s + "\n");
                    clientStream.Value.Flush();
                }
                catch (Exception ex)
                {
                    if (ex.HResult == -2147023667) // Client disconnected.
                    {
                        StreamWriter ignored;
                        connectedClients.TryRemove(clientStream.Key, out ignored);
                    }
                    else
                    {
                        throw ex;
                    }
                }
            }

            if (connectedClients.Count > 0)
            {
                messageCounter++;
                return true;
            }
            else
            {
                return false;
            }
        }
    }
}