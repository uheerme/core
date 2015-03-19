using Samesound.Core;
using Samesound.Data;
using Samesound.Services.Infrastructure;
using System.Collections.Generic;
using System.Data.Entity;
using System.Linq;
using System.Threading.Tasks;

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
    }
}
