using Samesound.Core;
using Samesound.ViewModels;
using System;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web;

namespace Samesound.Providers
{
    /// <summary>
    /// Provides support during the upload and removal of uploaded songs.
    /// </summary>
    public abstract class MusicUploadProvider
    {
        const string DEFAULT_DIRECTORY = "~/App_Data";

        public static string ContextualizedDirectory(params string[] nodes)
        {
            return HttpContext.Current.Server.MapPath(Path.Combine(nodes));
        }

        public static async Task<MusicCreateViewModel> SaveFileInContext(HttpRequestMessage request)
        {
            // Transfer data to temporary location.
            var provider = new MultipartFormDataStreamProvider(ContextualizedDirectory(DEFAULT_DIRECTORY));
            await request.Content.ReadAsMultipartAsync(provider);

            // Get the song's name and channel.
            var name = provider.FormData.GetValues("Name").First();
            var channelId = provider.FormData.GetValues("ChannelId").First();

            if (string.IsNullOrEmpty(name) || string.IsNullOrEmpty(channelId) || channelId == "0")
            {
                throw new ApplicationException("Uploaded data is invalid { name:" + name + ", channel:" + channelId + " }.");
            }

            // Create the directory, if it does not exist.
            var path = ContextualizedDirectory(DEFAULT_DIRECTORY, channelId);
            Directory.CreateDirectory(path);

            // Finally, move file to correct destination.
            path = ContextualizedDirectory(DEFAULT_DIRECTORY, channelId, name);
            var file = provider.FileData.First();
            File.Move(file.LocalFileName, path);

            return new MusicCreateViewModel
            {
                Name = name,
                ChannelId = int.Parse(channelId)
            };
        }

        public static void Remove(Music music)
        {
            Remove(music.ChannelId, music.Name);
        }

        public static void Remove(int channelId, string name)
        {
            var path = ContextualizedDirectory(
                DEFAULT_DIRECTORY, channelId.ToString(), name
            );

            if (File.Exists(path))
            {
                File.Delete(path);
            }
        }

        public static void RemoveAll(int channelId)
        {
            Directory.Delete(
                recursive: true,
                path: ContextualizedDirectory(
                    DEFAULT_DIRECTORY, channelId.ToString()
                )
            );
        }
    }
}