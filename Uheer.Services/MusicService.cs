using Uheer.Core;
using Uheer.Data;
using Uheer.Services.Exceptions;
using Uheer.Services.Infrastructure;
using Uheer.Services.Providers;
using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Linq;
using System.Threading.Tasks;
using System.Web;

namespace Uheer.Services
{
    public class MusicService : Service<Music>
    {
        public MusicService(UheerContext db) : base(db) { }

        public virtual async Task<ICollection<Music>> Paginate(int skip, int take)
        {
            return await Db.Musics
                .OrderBy(m => m.Id)
                .Skip(skip)
                .Take(take)
                .ToListAsync();
        }

        public override async Task<Music> Add(Music music)
        {
            var channel = await Db.Channels.FindAsync(music.ChannelId);
            if (!channel.IsActive())
            {
                throw new DeactivatedChannelException(
                    "Cannot insert a music on a deactivated channel {channel's id:" + channel.Id + "}."
                );
            }

            return await base.Add(music);
        }

        public override async Task<int> Delete(Music music)
        {
            MusicUploadProvider.TryToRemoveMusic(music);

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
