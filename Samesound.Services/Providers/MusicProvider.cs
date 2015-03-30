using Samesound.Core;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http.Headers;
using System.Net.Mime;
using System.Text;
using System.Threading.Tasks;
using System.Web;

namespace Samesound.Services.Providers
{
    public abstract class MusicProvider
    {
        public const string DEFAULT_DIRECTORY = "~/App_Data";
        public const string DEFAULT_TEMPORARY = "temporary";
        public const int DEFAULT_BUFFER_SIZE = 65536;
        
        private static Dictionary<string, string> _mimeNames;
        public static Dictionary<string, string> MimeNames
        {
            get
            {
                if (_mimeNames == null)
                {
                    _mimeNames = new Dictionary<string, string>();

                    _mimeNames.Add(".mp3", "audio/mpeg");
                    _mimeNames.Add(".mp4", "video/mp4");
                    _mimeNames.Add(".ogg", "application/ogg");
                    _mimeNames.Add(".ogv", "video/ogg");
                    _mimeNames.Add(".oga", "audio/ogg");
                    _mimeNames.Add(".wav", "audio/x-wav");
                    _mimeNames.Add(".webm", "video/webm");
                }

                return _mimeNames;
            }
        }

        public static string ContextualizedPath(params string[] nodes)
        {
            return HttpContext.Current.Server.MapPath(Path.Combine(nodes));
        }

        public static string TranslateLocalFileName(Music music)
        {
            return ContextualizedPath(
                    DEFAULT_DIRECTORY,
                    music.ChannelId.ToString(),
                    Path.ChangeExtension(
                        music.Id.ToString(),
                        Path.GetExtension(music.Name))
                );
        }

        public static FileInfo GetFileInfo(Music music)
        {
            return GetFileInfo(TranslateLocalFileName(music));
        }

        public static FileInfo GetFileInfo(string localFileName)
        {
            return new FileInfo(localFileName);
        }

        public static MediaTypeHeaderValue GetMimeNameFromExtension(string ext)
        {
            string value;
            return new MediaTypeHeaderValue(
                    MimeNames.TryGetValue(ext.ToLowerInvariant(), out value)
                    ? value
                    : MediaTypeNames.Application.Octet
                );
        }
    }
}
