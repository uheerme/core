using Microsoft.AspNet.Identity.EntityFramework;
using Samesound.Core.Models;
using Samesound.Data.Interfaces;
using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace Samesound.Data
{
    public class SamesoundContext : IdentityDbContext<ApplicationUser>
    {
        public SamesoundContext()
            : base("DefaultConnection", throwIfV1Schema: false)
        {
        }

        public void TrackDate()
        {
            foreach (var entity in ChangeTracker.Entries().Where(p => p.State == EntityState.Added || p.State == EntityState.Modified))
            {
                if (entity.State == EntityState.Added && entity.Entity is IDateTrackable)
                {
                    ((IDateTrackable)entity.Entity).DateCreated = DateTime.Now;
                }
                if (entity.State == EntityState.Modified && entity.Entity is IDateTrackable)
                {
                    ((IDateTrackable)entity.Entity).DateUpdated = DateTime.Now;
                }
            }
        }

        public override int SaveChanges()
        {
            TrackDate();
            return base.SaveChanges();
        }

        public override Task<int> SaveChangesAsync()
        {
            TrackDate();
            return base.SaveChangesAsync();
        }

        public override Task<int> SaveChangesAsync(CancellationToken cancellationToken)
        {
            TrackDate();
            return base.SaveChangesAsync(cancellationToken);
        }

        public static SamesoundContext Create()
        {
            return new SamesoundContext();
        }
    }
}
