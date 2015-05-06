using Uheer.Core;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;
using System.Web;

namespace Uheer.Services.Providers
{
    public class MusicStreamProvider : MusicProvider
    {
        public string LocalFileName { get; set; }
        public int BufferSize { get; set; }

        public MusicStreamProvider()
        {
            BufferSize = DEFAULT_BUFFER_SIZE;
        }

        public MusicStreamProvider(Music music) : this(music, DEFAULT_BUFFER_SIZE) { }

        public MusicStreamProvider(Music music, int bufferSize = DEFAULT_BUFFER_SIZE) 
            : this(music.Id, music.Name, music.ChannelId, bufferSize)
        { }

        public MusicStreamProvider(int musicId, string musicName, int channelId, int bufferSize = DEFAULT_BUFFER_SIZE)
        {
            LocalFileName = ContextualizedPath(
                DEFAULT_DIRECTORY,
                channelId.ToString(),
                Path.ChangeExtension(
                    musicId.ToString(),
                    Path.GetExtension(musicName)));
            BufferSize = bufferSize;
        }

        public MusicStreamProvider(string localFileName, int bufferSize = DEFAULT_BUFFER_SIZE)
        {
            LocalFileName = localFileName;
            BufferSize    = bufferSize;
        }

        public static bool TryReadRangeItem(RangeItemHeaderValue range, long contentLength,
            out long start, out long end)
        {
            if (range.From != null)
            {
                start = range.From.Value;
                if (range.To != null)
                    end = range.To.Value;
                else
                    end = contentLength - 1;
            }
            else
            {
                end = contentLength - 1;
                if (range.To != null)
                    start = contentLength - range.To.Value;
                else
                    start = 0;
            }
            return (start < contentLength && end < contentLength);
        }

        public PushStreamContent StreamFileEntirely()
        {
            var info = GetFileInfo(LocalFileName);

            return new PushStreamContent((outputStream, httpContent, transpContext) =>
            {
                using (outputStream)
                {
                    using (Stream inputStream = info.OpenRead())
                    {
                        try
                        {
                            inputStream.CopyTo(outputStream, (int)info.Length);
                        }
                        catch (Exception error)
                        {
                            Debug.WriteLine(error);
                        }
                    }
                }
            }, MusicStreamProvider.GetMimeNameFromExtension(info.Extension));
        }

        public PushStreamContent StreamFilePartially(long start, long end)
        {
            var info = GetFileInfo(LocalFileName);
            return new PushStreamContent((outputStream, httpContent, transpContext) =>
            {
                using (outputStream)
                {
                    using (Stream inputStream = info.OpenRead())
                    {
                        int count = 0;
                        long remainingBytes = end - start + 1;
                        long position = start;
                        byte[] buffer = new byte[BufferSize];

                        inputStream.Position = start;

                        do
                        {
                            try
                            {
                                count = inputStream.Read(buffer, 0, (int)Math.Min(BufferSize, remainingBytes));
                                outputStream.Write(buffer, 0, count);
                            }
                            catch (Exception error)
                            {
                                Debug.WriteLine(error);
                                break;
                            }
                            position = inputStream.Position;
                            remainingBytes = end - position + 1;
                        } while (position <= end);
                    }
                }
            }, GetMimeNameFromExtension(info.Extension));
        }
    }
}
