using Microsoft.AspNet.Identity.EntityFramework;
using Samesound.Core.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Samesound.Data
{
    public class SamesoundContext : IdentityDbContext<ApplicationUser>
    {
        public SamesoundContext()
            : base("DefaultConnection", throwIfV1Schema: false)
        {
        }

        public static SamesoundContext Create()
        {
            return new SamesoundContext();
        }
    }
}
