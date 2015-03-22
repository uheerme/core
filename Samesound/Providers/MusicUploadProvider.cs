﻿using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web;

namespace Samesound.Providers
{
    public class MusicUploadProvider
    {
        const string DEFAULT_DIRECTORY = "~/App_Data";
        protected string _directory;
        protected bool   _override;
        protected bool   _cacheOperations;
        protected List<HttpPostedFileBase> _musics;

        public bool IsInitiated { get; private set; }

        public MusicUploadProvider(int channelId, bool cacheOperations) : this(channelId, cacheOperations, false) { }
        public MusicUploadProvider(int channelId, bool cacheOperations, bool @override)
            : this(Path.Combine(DEFAULT_DIRECTORY, channelId.ToString()), cacheOperations, @override) { }
        public MusicUploadProvider(string directory, bool cacheOperations, bool @override)
        {
            _directory       = directory;
            _cacheOperations = cacheOperations;
            _override        = @override;
            _musics = new List<HttpPostedFileBase>();
        }

        public virtual MusicUploadProvider Init()
        {
            if (Directory.Exists(_directory) && _override)
            {
                Directory.Delete(_directory, true);
            }
            
            Directory.CreateDirectory(_directory);
            IsInitiated = true;
            return this;
        }

        public virtual MusicUploadProvider Save(HttpPostedFileBase music)
        {
            if (!IsInitiated)
            {
                throw new ApplicationException("Cannot save music in a non initiated MusicUploadProvider. Did you forget to call Init() first?");
            }

            if (music == null || music.ContentLength == 0)
            {
                throw new ApplicationException("Cannot save a invalid/empty music: " + music.FileName);
            }

            _musics.Add(music);

            if (!_cacheOperations)
            {
                Commit();
            }

            return this;
        }

        public virtual MusicUploadProvider Remove(HttpPostedFileBase music)
        {
            if (_musics.Contains(music))
            {
                _musics.Remove(music);
            }
            else
            {
                var name = Path.Combine(_directory, music.FileName);
                if (File.Exists(name))
                {
                    File.Delete(name);
                }
            }

            return this;
        }

        public virtual MusicUploadProvider Commit()
        {
            foreach (var music in _musics)
            {
                var name = Path.Combine(_directory, music.FileName);
                music.SaveAs(name);
            }

            _musics.Clear();
            return this;
        }
    }
}