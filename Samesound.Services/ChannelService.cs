using Samesound.Core;
using Samesound.Data;
using Samesound.Services.Infrastructure;
using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Linq;
using System.Threading.Tasks;

namespace Samesound.Services
{
    public class ChannelService : Service<Channel>
    {
        public ChannelService(SamesoundContext db) : base(db) { }

        public virtual async Task<ICollection<Channel>> Paginate(int skip, int take)
        {
            return await Db.Channels
                .OrderBy(c => c.Id)
                .Skip(skip)
                .Take(take)
                .ToListAsync();
        }

        public virtual async Task<int> Play(Channel channel, Music music)
        {
            if (!channel.Musics.Any(m => m.Id == music.Id))
            {
                throw new ApplicationException();
            }

            channel.Playing = music;

            return await Update(channel);
        }
    }
}
