using Samesound.Core;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http;
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
        
        private static Dictionary<string, string> _mediaTypes;
        public static Dictionary<string, string> MediaTypes
        {
            get
            {
                if (_mediaTypes == null)
                {
                    _mediaTypes = new Dictionary<string, string>();

                    _mediaTypes.Add(".mp3", "audio/mpeg");
                    _mediaTypes.Add(".ogg", "application/ogg");
                    _mediaTypes.Add(".oga", "audio/ogg");
                    _mediaTypes.Add(".wav", "audio/x-wav");
                }

                return _mediaTypes;
            }
        }
        private static Dictionary<string, string> _extensions;
        public static Dictionary<string, string> Extensions
        {
            get
            {
                if (_extensions == null)
                {
                    _extensions = new Dictionary<string, string>();

                    _extensions.Add("audio/mpeg", ".mp3");
                    _extensions.Add("audio/mp3", ".mp3");
                    _extensions.Add("application/ogg", ".ogg");
                    _extensions.Add("audio/ogg", ".oga");
                    _extensions.Add("audio/x-wav", ".wav");
                }

                return _extensions;
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
                    MediaTypes.TryGetValue(ext.ToLowerInvariant(), out value)
                    ? value
                    : MediaTypeNames.Application.Octet
                );
        }

        public static string SupportedMediaTypesToString()
        {
            var result = "";
            foreach (var pair in MediaTypes)
            {
                result += " " + pair.Value;
            }
            return result;
        }
    }
}
