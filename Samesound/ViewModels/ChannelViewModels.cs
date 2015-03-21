using Samesound.Core;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Web;

namespace Samesound.ViewModels
{
    public class ChannelCreateViewModel
    {
        [Required]
        [StringLength(128, MinimumLength=4)]
        public string Name { get; set; }
        
        [Required]
        public string Owner { get; set; }

        [Required]
        [StringLength(256, MinimumLength=7)]
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

    public class ChannelUpdateViewModel
    {
        public int Id { get; set; }

        [Required]
        public string Name { get; set; }

        public void Update(Channel c)
        {
            c.Name = Name;
        }
    }

    public class ChannelResultViewModel
    {
        public int       Id    { get; set; }
        public string    Name  { get; set; }
        public string    Owner { get; set; }
        public string    NetworkIdentifier { get; set; }
        public ICollection<MusicResultViewModel> Musics { get; set; }
        public MusicResultViewModel Playing { get; set; }
        public DateTime  DateCreated  { get; set; }
        public DateTime? DateUpdated { get; set; }
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
                    .ToList(),
                Playing = (MusicResultViewModel)c.Playing
            };
        }
    }
}