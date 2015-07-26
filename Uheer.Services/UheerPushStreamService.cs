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

        public PushStreamContent GetResponseContext()
        {
            return new PushStreamContent((Action<Stream, HttpContent, TransportContext>)OnMessageAvailable, "text/event-stream");
        }

        private void OnMessageAvailable(Stream stream, HttpContent content, TransportContext context)
        {
            StreamWriter streamWriter = new StreamWriter(stream);
            connectedClients.TryAdd(streamWriter, streamWriter);
        }

        public bool SendMessage(string s)
        {
            foreach (var clientStream in connectedClients)
            {
                try
                {
                    clientStream.Value.WriteLine("id:" + messageCounter);
                    clientStream.Value.WriteLine("data:" + s + "\n");
                    clientStream.Value.Flush();
                }
                catch (Exception e)
                {
                    // Client disconnected.
                    if (e.HResult == -2147023667)
                    {
                        StreamWriter ignored;
                        connectedClients.TryRemove(clientStream.Key, out ignored);
                    }
                    else
                    {
                        throw e;
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