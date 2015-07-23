using Uheer.Core;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Web;

namespace Uheer.ViewModels
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
        [StringLength(128, MinimumLength = 4)]
        public string Name { get; set; }
        /// <summary>
        /// The author of the new Channel. It can be their MAC address, email or regular username.
        /// </summary>
        public string AuthorId { get; set; }
        /// <summary>
        /// The IP address that uniquely identifies the network used by the Owner of the channel.
        /// This property is overridden by the server's storage procedure and will be ignored if sent to the server.
        /// </summary>
        public string HostIpAddress { get; set; }
        /// <summary>
        /// The MAC address that uniquely identifies the network used by the Owner of the channel.
        /// </summary>
        public string HostMacAddress { get; set; }

        public static explicit operator Channel(ChannelCreateViewModel m)
        {
            return m == null ? null : new Channel
            {
                Name = m.Name,
                AuthorId = m.AuthorId,
                HostIpAddress = m.HostIpAddress,
                HostMacAddress = m.HostMacAddress
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
        /// <summary>
        /// A boolean that indicates if the Channel loops its musics or not.
        /// </summary>
        [DefaultValue(true)]
        public bool Loops { get; set; }

        public void Update(Channel c)
        {
            c.Name = Name;
            c.Loops = Loops;
        }
    }

    /// <summary>
    /// The view-model which represents a Channel entry with its Musics.
    /// </summary>
    public class ChannelResultViewModel : ChannelListResultViewModel
    {
        /// <summary>
        /// The collection of Musics that belong to this Channel.
        /// </summary>
        public ICollection<MusicResultViewModel> Musics { get; set; }
        /// <summary>
        /// Explicit conversion from Channel to ChannelResultViewModel.
        /// </summary>
        /// <param name="c">The Channel that will be converted.</param>
        /// <returns>The ChannelResultViewModel that represents the Channel c.</returns>
        public static explicit operator ChannelResultViewModel(Channel c)
        {
            return c == null ? null : new ChannelResultViewModel
            {
                Id = c.Id,
                Name = c.Name,
                Author = (UserResultViewModel)c.Author,
                HostIpAddress = c.HostIpAddress,
                HostMacAddress = c.HostMacAddress,
                Loops = c.Loops,
                DateCreated = c.DateCreated,
                DateUpdated = c.DateUpdated,
                DateDeactivated = c.DateDeactivated,

                Musics = c.Musics
                    .Select(m => (MusicResultViewModel)m)
                    .ToList(),

                CurrentId = c.CurrentId,
                CurrentStartTime = c.CurrentStartTime
            };
        }
    }

    /// <summary>
    /// The view-model which represents a Channel entry without its Musics.
    /// </summary>
    public class ChannelListResultViewModel
    {
        /// <summary>
        /// The surrogate key that uniquely identifies a Channel in the database.
        /// </summary>
        public int Id { get; set; }
        /// <summary>
        /// The name of the Channel.
        /// </summary>
        public string Name { get; set; }
        /// <summary>
        /// The Owner of the Channel. It can be set to be the email address, the MAC address or a regular username.
        /// </summary>
        public UserResultViewModel Author { get; set; }
        /// <summary>
        /// The IP address that uniquely identifies the network used by the Owner of the channel.
        /// </summary>
        public string HostIpAddress { get; set; }
        /// <summary>
        /// The MAC address that uniquely identifies the network used by the Owner of the channel.
        /// </summary>
        public string HostMacAddress { get; set; }
        /// <summary>
        /// A boolean that indicates if the Channel loops its musics or not.
        /// </summary>
        public bool Loops { get; set; }
        /// <summary>
        /// The Id of the Music that is currently being played.
        /// </summary>
        public int? CurrentId { get; set; }
        /// <summary>
        /// The start timestamp of the current music.
        /// </summary>
        public DateTime? CurrentStartTime { get; set; }
        /// <summary>
        /// The moment when the Channel was created.
        /// </summary>
        public DateTime DateCreated { get; set; }
        /// <summary>
        /// The moment when the Channel was last updated. If it never were, this value will be null.
        /// </summary>
        public DateTime? DateUpdated { get; set; }
        /// <summary>
        /// The moment when the Channel was deactivated. If this Channel is still active, this value will be null.
        /// </summary>
        public DateTime? DateDeactivated { get; set; }
        /// <summary>
        /// Explicit conversion from Channel to ChannelListResultViewModel.
        /// </summary>
        /// <param name="c">The Channel that will be converted.</param>
        /// <returns>The ChannelListResultViewModel that represents the Channel c.</returns>
        public static explicit operator ChannelListResultViewModel(Channel c)
        {
            return c == null ? null : new ChannelListResultViewModel
            {
                Id = c.Id,
                Name = c.Name,
                Author = (UserResultViewModel)c.Author,
                HostIpAddress = c.HostIpAddress,
                HostMacAddress = c.HostMacAddress,
                Loops = c.Loops,
                DateCreated = c.DateCreated,
                DateUpdated = c.DateUpdated,
                DateDeactivated = c.DateDeactivated,
                CurrentId = c.CurrentId,
                CurrentStartTime = c.CurrentStartTime
            };
        }
    }

    /// <summary>
    /// The view model used to indicate which Music is currently being display in a Channel.
    /// </summary>
    public class ChannelCurrentResultViewModel
    {
        /// <summary>
        /// The surrogate key that uniquely identifies a Channel in the database.
        /// </summary>
        public int Id { get; set; }
        /// <summary>
        /// The Id of the Music that is currently being played.
        /// </summary>
        public int? CurrentId { get; set; }
        /// <summary>
        /// The start timestamp of the current music.
        /// </summary>
        public DateTime? CurrentStartTime { get; set; }
        /// <summary>
        /// Explicit conversion from Channel to ChannelCurrentResultViewModel.
        /// </summary>
        /// <param name="c">The Channel that will be converted.</param>
        /// <returns>The ChannelCurrentResultViewModel that represents the current song being played at the Channel c.</returns>
        public static explicit operator ChannelCurrentResultViewModel(Channel c)
        {
            return c == null ? null : new ChannelCurrentResultViewModel
            {
                Id = c.Id,
                CurrentId = c.CurrentId,
                CurrentStartTime = c.CurrentStartTime
            };
        }
    }
}
