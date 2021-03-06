﻿using System;
using System.Collections.Generic;
using System.IO;
using System.Net.Http;
using System.Threading.Tasks;
using Uheer.Core;

namespace Uheer.Services.Providers
{
    /// <summary>
    /// Provides support during the upload and removal of uploaded songs.
    /// </summary>
    public abstract class MusicUploadProvider : MusicProvider
    {
        public static string TryToCreateDirectory(string directory, bool @override = false)
        {
            var path = ContextualizedPath(DEFAULT_DIRECTORY, directory);
            if (Directory.Exists(path) && @override)
            {
                Directory.Delete(path, recursive: true);
            }

            Directory.CreateDirectory(path);
            return path;
        }

        public static void TryToRemoveMusic(Music music)
        {
            TryToRemove(ContextualizedPath(DEFAULT_DIRECTORY, music.ChannelId.ToString(), music.Id.ToString()));
        }
        public static void TryToRemoveTemporary(string localFileName)
        {
            TryToRemove(localFileName);
        }
        public static void TryToRemoveTemporaries(ICollection<MultipartFileData> files)
        {
            foreach (var file in files)
            {
                TryToRemoveTemporary(file.LocalFileName);
            }
        }
        public static bool TryToRemove(string path)
        {
            try
            {
                if (File.Exists(path))
                {
                    File.Delete(path);
                    return true;
                }
            }
            catch (IOException) { }
            
            return false;
        }
        public static void RemoveAll(int channelId)
        {
            var path = ContextualizedPath(DEFAULT_DIRECTORY, channelId.ToString());
            if (Directory.Exists(path))
            {
                Directory.Delete(path, recursive: true);
            }
        }

        public static async Task<MultipartFormDataStreamProvider> SaveFilesTemporarily(HttpContent content)
        {
            TryToCreateDirectory(DEFAULT_TEMPORARY);
            
            // Transfer data to temporary location.
            var provider = new MultipartFormDataStreamProvider(ContextualizedPath(DEFAULT_DIRECTORY, DEFAULT_TEMPORARY));
            await content.ReadAsMultipartAsync(provider);

            return provider;
        }

        public static void FinishUpload(string temporaryFileName, Music music)
        {
            if (music.Id == 0 || string.IsNullOrEmpty(music.Name) || music.ChannelId == 0)
            {
                throw new ApplicationException("Uploaded data is invalid { Id:" + music.Id + ", Name:" + music.Name + ", Channel:" + music.ChannelId + " }.");
            }

            // Creates channel's directory, if it doesn't exist already.
            var path = TryToCreateDirectory(music.ChannelId.ToString());

            // Finally, move file to correct destination.
            var fileRealName = Path.ChangeExtension(music.Id.ToString(), Path.GetExtension(music.Name));
            path = Path.Combine(path, fileRealName);
            
            try
            {
                File.Copy(temporaryFileName, path);
                File.Delete(temporaryFileName);
            }
            catch (IOException) { }
        }
    }
}
