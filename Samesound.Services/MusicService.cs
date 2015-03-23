using Samesound.Core;
using Samesound.Data;
using Samesound.Services.Infrastructure;
using Samesound.Services.Providers;
using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Linq;
using System.Threading.Tasks;
using System.Web;

namespace Samesound.Services
{
    public class MusicService : Service<Music>
    {
        public MusicService(SamesoundContext db) : base(db) { }

        public virtual async Task<ICollection<Music>> Paginate(int skip, int take)
        {
            return await Db.Musics
                .OrderBy(m => m.Id)
                .Skip(skip)
                .Take(take)
                .ToListAsync();
        }

        public override async Task<int> Delete(Music music)
        {
            MusicUploadProvider.Remove(music.ChannelId, music.Name);
            return await base.Delete(music);
        }

        public virtual async Task<ICollection<Music>> OfChannel(int channelId, int skip, int take)
        {
            return await Db.Musics
                .Where(m => m.ChannelId == channelId)
                .OrderBy(m => m.Id)
                .Take(take)
                .Skip(skip)
                .ToListAsync();
        }
    }
}
