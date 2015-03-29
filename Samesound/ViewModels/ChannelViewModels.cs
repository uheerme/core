using Samesound.Core;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Web;

namespace Samesound.ViewModels
{
    /// <summary>
    /// The view model used to create Channel entries in the database.
    /// </summary>
    public class ChannelCreateViewModel
    {
        /// <summary>
        /// The name that the new Channel should assume.
        /// </summary>
        [Required]
        [StringLength(128, MinimumLength=4)]
        public string Name { get; set; }
        
        /// <summary>
        /// The Owner of the new Channel. It can be their MAC address, email or regular username.
        /// </summary>
        [Required]
        public string Owner { get; set; }

        /// <summary>
        /// A string that uniquely identifies the network used by the Owner.
        /// It can be the real IP address, the MAC address or a combination of both.
        /// This property is read-only and will be ignored when sent to the server.
        /// </summary>
        public string NetworkIdentifier { get; set; }

        public static explicit operator Channel(ChannelCreateViewModel m)
        {
            return m == null ? null : new Channel
            {
                Name  = m.Name,
                Owner = m.Owner,
                NetworkIdentifier = m.NetworkIdentifier
            };
        }
    }

    /// <summary>
    /// The view model used to update Channel entries in the database.
    /// </summary>
    public class ChannelUpdateViewModel
    {
        /// <summary>
        /// The surrogate key that uniquely identifies a Channel in the database.
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// The new name that the existing Channel should assume.
        /// </summary>
        [Required]
        public string Name { get; set; }

        public void Update(Channel c)
        {
            c.Name = Name;
        }
    }

    /// <summary>
    /// The view model used to display Channel entries.
    /// </summary>
    public class ChannelResultViewModel
    {
        /// <summary>
        /// The surrogate key that uniquely identifies a Channel in the database.
        /// </summary>
        public int       Id    { get; set; }
        /// <summary>
        /// The name of the Channel.
        /// </summary>
        public string    Name  { get; set; }
        /// <summary>
        /// The Owner of the Channel. It can be set to be the email address, the MAC address or a regular username.
        /// </summary>
        public string    Owner { get; set; }
        /// <summary>
        /// A string that uniquely identifies the network used by the Owner. It can be the real IP address, the MAC address or a combination of both.
        /// </summary>
        public string    NetworkIdentifier { get; set; }
        /// <summary>
        /// The collection of Musics that belong to this Channel.
        /// </summary>
        public ICollection<MusicResultViewModel> Musics { get; set; }
        /// <summary>
        /// The Music that is currently being played.
        /// </summary>
        public MusicResultViewModel Playing { get; set; }
        /// <summary>
        /// The moment when the Channel was created.
        /// </summary>
        public DateTime  DateCreated  { get; set; }
        /// <summary>
        /// The moment when the Channel was last updated. If it never were, this value will be null.
        /// </summary>
        public DateTime? DateUpdated { get; set; }
        /// <summary>
        /// The moment when the Channel was deactivated. If this Channel is still active, this value will be null.
        /// </summary>
        public DateTime? DateDeactivated { get; set; }

        public static explicit operator ChannelResultViewModel(Channel c)
        {
            return c == null ? null : new ChannelResultViewModel
            {
                Id                = c.Id,
                Name              = c.Name,
                Owner             = c.Owner,
                NetworkIdentifier = c.NetworkIdentifier,
                DateCreated       = c.DateCreated,
                DateUpdated       = c.DateUpdated,
                DateDeactivated   = c.DateDeactivated,
                
                Musics = c.Musics
                    .Select(m => (MusicResultViewModel)m)
                    .ToList()
                //Playing = (MusicResultViewModel)c.Playing
            };
        }
    }
}