using Samesound.Core;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Web;

namespace Samesound.ViewModels
{
    public class MusicCreateViewModel
    {
        [Required]
        [StringLength(128, MinimumLength=4)]
        public string Name     { get; set; }

        [Required]
        public HttpPostedFileBase Stream { get; set; }

        [Required]
        public int ChannelId { get; set; }
        
        public static explicit operator Music(MusicCreateViewModel m)
        {
            return new Music
            {
                Name            = m.Name,
                SizeInBytes     = m.Stream.ContentLength,
                ChannelId       = m.ChannelId
            };
        }
    }

    public class MusicUpdateViewModel
    {
        [Required]
        public int Id { get; set; }

        [Required]
        [StringLength(128, MinimumLength = 4)]
        public string Name { get; set; }

        [Required]
        public HttpPostedFileBase Stream { get; set; }

        [Required]
        public int ChannelId { get; set; }
        
        public void Update(Music c)
        {
            c.Name            = Name;
            c.SizeInBytes     = Stream.ContentLength;
            c.ChannelId       = ChannelId;
        }
    }

    public class MusicResultViewModel
    {
        public int    Id   { get; set; }
        public string Name { get; set; }
        public int SizeInBytes     { get; set; }
        public int LengthInSeconds { get; set; }
        public int ChannelId       { get; set; }
        public DateTime  DateCreated { get; set; }
        public DateTime? DateUpdated { get; set; }

        public static explicit operator MusicResultViewModel(Music c)
        {
            return c == null ? null : new MusicResultViewModel
            {
                Id                = c.Id,
                Name              = c.Name,
                SizeInBytes       = c.SizeInBytes,
                LengthInSeconds   = c.LengthInSeconds,
                ChannelId         = c.ChannelId,
                DateCreated       = c.DateCreated,
                DateUpdated       = c.DateUpdated
            };
        }
    }
}
