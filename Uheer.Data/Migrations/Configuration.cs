namespace Uheer.Data.Migrations
{
    using Microsoft.AspNet.Identity;
    using Microsoft.AspNet.Identity.EntityFramework;
    using System;
    using System.Collections.Generic;
    using System.Data.Entity;
    using System.Data.Entity.Migrations;
    using System.Linq;
    using Uheer.Core;

    public sealed class Configuration : DbMigrationsConfiguration<Uheer.Data.UheerContext>
    {
        public Configuration()
        {
            AutomaticMigrationsEnabled = true;
            AutomaticMigrationDataLossAllowed = true;
            ContextKey = "Uheer.Data.UheerContext";
        }

        protected override void Seed(Uheer.Data.UheerContext context)
        {
            var u = new UserManager<User>(new UserStore<User>(new UheerContext()));
            var r = new RoleManager<IdentityRole>(new RoleStore<IdentityRole>(new UheerContext()));

            var users = new List<User>
            {
                new User
                {
                    UserName = "lucasolivdavid@gmail.com",
                    Email = "lucasolivdavid@gmail.com",
                    DisplayName = "Lucas David",
                    EmailConfirmed = true,
                },

                new User
                {
                    UserName = "smokeonline@gmail.com",
                    Email = "smokeonline@gmail.com",
                    DisplayName = "João Paulo",
                    EmailConfirmed = true,
                },

                new User
                {
                    UserName = "camilomoreira91@gmail.com",
                    Email = "camilomoreira91@gmail.com",
                    DisplayName = "Camilo Moreira",
                    EmailConfirmed = true,
                    
                },
            };

            var roles = new List<IdentityRole>
            {
                new IdentityRole { Name = "admin"},
                new IdentityRole { Name = "listener"},
                new IdentityRole { Name = "dj"},
            };

            foreach (var role in roles)
            {
                try
                {
                    r.Create(role);
                }
                catch (Exception)
                {
                    //
                }
            }

            foreach (var user in users)
            {
                try
                {
                    if (u.Create(user, "root1234!").Succeeded)
                    {
                        var foundUser = u.FindByName(user.UserName);
                        u.AddToRoles(foundUser.Id, new string[] { "admin", });
                    }
                }
                catch (Exception)
                {
                    //
                }
            }
        }
    }
}
