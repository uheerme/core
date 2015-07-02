using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Web;
using System.Security.Claims;

namespace Uheer.Managers
{
    /// <summary>
    /// Authorization manager.
    /// Defines the authorization logic behide Uheer's backend.
    /// </summary>
    public class UheerAuthorizationManager : ClaimsAuthorizationManager
    {
        /// <summary>
        /// Check if an user has authoritah to access a resource on a given context.
        /// </summary>
        /// <param name="context">The context in which the claim authorization decorator was invoked.</param>
        /// <returns>True, if the user is authorized to access the resource. False, otherwise.</returns>
        public override bool CheckAccess(AuthorizationContext context)
        {
            return context.Principal.Identity.IsAuthenticated
                && context.Resource.All(r => context.Principal.HasClaim(r.Type, r.Value));
        }
    }
}