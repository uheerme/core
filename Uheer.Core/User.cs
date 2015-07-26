﻿using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNet.Identity;
using Microsoft.AspNet.Identity.EntityFramework;
using Microsoft.AspNet.Identity.Owin;
using System.Collections.Generic;

namespace Uheer.Core
{
    // You can add profile data for the user by adding more properties to your User class, please visit http://go.microsoft.com/fwlink/?LinkID=317594 to learn more.
    public class User : IdentityUser
    {
        public async Task<ClaimsIdentity> GenerateUserIdentityAsync(UserManager<User> manager, string authenticationType)
        {
            // Note the authenticationType must match the one defined in CookieAuthenticationOptions.AuthenticationType
            var userIdentity = await manager.CreateIdentityAsync(this, authenticationType);
            // Add custom user claims here

            userIdentity.AddClaims(new List<Claim>()
            {
                new Claim(ClaimTypes.Role, "listener"),
                new Claim(ClaimTypes.Role, "dj"),
                new Claim("http://application/claims/authorization/resource", "channels")
            });

            return userIdentity;
        }

        public string DisplayName { get; set; }
    }

    
}