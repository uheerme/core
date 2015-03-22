using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web;

namespace Samesound.Providers
{
    public class MusicUploadProvider
    {
        const string DEFAULT_DIRECTORY = "App_Data";
        protected string _directory;
        protected bool   _override;

        public MusicUploadProvider(int channelId) : this(channelId, false) { }
        public MusicUploadProvider(int channelId, bool @override) : this(Path.Combine(DEFAULT_DIRECTORY, channelId.ToString()), @override) { }
        public MusicUploadProvider(string directory, bool @override)
        {
            _directory = directory;
            _override  = @override;
        }

        public virtual MusicUploadProvider Init()
        {
            if (Directory.Exists(_directory) && _override)
            {
                Directory.Delete(_directory, true);
            }
            
            Directory.CreateDirectory(_directory);
            return this;
        }

        public virtual MusicUploadProvider Save(HttpPostedFileBase music)
        {
            if (music == null || music.ContentLength == 0)
            {
                throw new ApplicationException("Cannot save invalid music {" + music.FileName + "}");
            }

            return this;
        }
    }
}