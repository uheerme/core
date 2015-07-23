using System;
using System.Collections.Generic;
using Uheer.Core;

namespace Uheer.ViewModels
{
    // Models returned by AccountController actions.

    public class ExternalLoginViewModel
    {
        public string Name { get; set; }

        public string Url { get; set; }

        public string State { get; set; }
    }

    public class ManageInfoViewModel
    {
        public string LocalLoginProvider { get; set; }

        public string Email { get; set; }

        public IEnumerable<UserLoginInfoViewModel> Logins { get; set; }

        public IEnumerable<ExternalLoginViewModel> ExternalLoginProviders { get; set; }
    }

    public class UserInfoViewModel
    {
        public string Email { get; set; }

        public bool HasRegistered { get; set; }

        public string LoginProvider { get; set; }
    }

    public class UserLoginInfoViewModel
    {
        public string LoginProvider { get; set; }

        public string ProviderKey { get; set; }
    }

    public class UserResultViewModel
    {
        public string Id { get; set; }
        public string Email { get; set; }

        public static explicit operator UserResultViewModel(User u) {
            return u == null ? null : new UserResultViewModel
            {
                Id = u.Id,
                Email = u.Email
            };
        }
    }
}
