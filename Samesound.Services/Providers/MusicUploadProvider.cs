using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web;

namespace Samesound.Services.Providers
{
    public class MusicUploadProvider
    {
        const string DEFAULT_DIRECTORY = "~/App_Data";
        protected string _directory;
        protected bool   _override;
        protected bool   _cacheOperations;
        protected Dictionary<string, HttpPostedFileBase> _musics;

        public bool IsInitiated { get; private set; }

        public MusicUploadProvider(int channelId, bool cacheOperations = false, bool @override = false)
            : this(Path.Combine(DEFAULT_DIRECTORY, channelId.ToString()), cacheOperations, @override) { }
        public MusicUploadProvider(string directory, bool cacheOperations, bool @override)
        {
            _directory       = directory;
            _cacheOperations = cacheOperations;
            _override        = @override;
            _musics = new Dictionary<string, HttpPostedFileBase>();
        }

        public virtual MusicUploadProvider Init()
        {         
            Directory.CreateDirectory(_directory);
            IsInitiated = true;
            return this;
        }

        public virtual MusicUploadProvider Save(HttpPostedFileBase music, string name = null)
        {
            if (!IsInitiated)
            {
                throw new ApplicationException("Cannot save music in a non initiated MusicUploadProvider. Did you forget to call Init() first?");
            }

            if (music == null || music.ContentLength == 0)
            {
                throw new ApplicationException("Cannot save a invalid/empty music: " + name);
            }

            if (string.IsNullOrEmpty(name)) { name = music.FileName; }

            if (_musics.ContainsKey(name) && !_override)
            {
                throw new ApplicationException("Cannot override already existing music: " + name + ".");
            }
            
            _musics[name] = music;

            if (!_cacheOperations)
            {
                Commit();
            }

            return this;
        }

        public virtual MusicUploadProvider RemoveAll()
        {
            Directory.Delete(_directory, recursive:true);
            _musics.Clear();
            return this;
        }

        public virtual MusicUploadProvider Remove(string name)
        {
            if (_musics.ContainsKey(name))
            {
                _musics.Remove(name);
            }
            else
            {
                name = Path.Combine(_directory, name);
                if (File.Exists(name))
                {
                    File.Delete(name);
                }
            }

            return this;
        }

        public virtual MusicUploadProvider Commit()
        {
            foreach (var entry in _musics)
            {
                var name  = entry.Key;
                var music = entry.Value;

                music.SaveAs(Path.Combine(_directory, name));
            }

            _musics.Clear();
            return this;
        }
    }
}