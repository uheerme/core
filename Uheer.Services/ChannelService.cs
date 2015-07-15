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

namespace Uheer.Services
{
    public class ChannelService : Service<Channel>
    {
        public ChannelService(UheerContext db) : base(db) { }

        public virtual async Task<Channel> FindWithMusics(int id)
        {
            return await Db.Channels
                .Include(c => c.Musics)
                .SingleOrDefaultAsync(c => c.Id == id);
        }

        public virtual async Task<ICollection<Channel>> Paginate(int skip, int take)
        {
            return await Db.Channels
                .OrderBy(c => c.DateDeactivated)
                .ThenByDescending(c => c.Id)
                .Skip(skip)
                .Take(take)
                .ToListAsync();
        }

        public virtual async Task<ICollection<Channel>> ActiveChannels(int skip, int take)
        {
            return await Db.Channels
                .Where(c => c.DateDeactivated == null)
                .OrderByDescending(c => c.Id)
                .Skip(skip)
                .Take(take)
                .ToListAsync();
        }

        public virtual async Task<int> Play(Channel channel, Music music)
        {
            if (!channel.Musics.Any(m => m.Id == music.Id))
            {
                throw new MusicDoesNotBelongToChannelException("The music {" + music.Name + "} does not belong to the channel {" + channel.Name + "}.");
            }

            channel.CurrentId = music.Id;
            channel.CurrentStartTime = DateTime.UtcNow;

            return await Update(channel);
        }

        public virtual async Task<int> Deactivate(Channel channel)
        {
            if (!channel.IsActive())
            {
                throw new ChannelIsAlreadyDeactivatedException("The channel #" + channel.Id + " cannot be deactivated, since its state is not active.");
            }

            MusicUploadProvider.RemoveAll(channel.Id);

            channel.DateDeactivated = DateTime.UtcNow;
            return await Update(channel);
        }

        public override async Task<int> Delete(Channel channel)
        {
            MusicUploadProvider.RemoveAll(channel.Id);

            return await base.Delete(channel);
        }
    }
}
