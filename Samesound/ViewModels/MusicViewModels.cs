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
        [Range(0, int.MaxValue)]
        public int SizeInBytes { get; set; }

        [Required]
        [Range(0, int.MaxValue)]
        public int LengthInMinutes { get; set; }

        [Required]
        public int ChannelId { get; set; }
        
        public static explicit operator Music(MusicCreateViewModel m)
        {
            return new Music
            {
                Name            = m.Name,
                SizeInBytes     = m.SizeInBytes,
                LengthInMinutes = m.LengthInMinutes,
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
        [Range(0, int.MaxValue)]
        public int SizeInBytes { get; set; }

        [Required]
        [Range(0, int.MaxValue)]
        public int LengthInMinutes { get; set; }

        [Required]
        public int ChannelId { get; set; }
        
        public void Update(Music c)
        {
            c.Name            = Name;
            c.SizeInBytes     = SizeInBytes;
            c.LengthInMinutes = LengthInMinutes;
            c.ChannelId       = ChannelId;
        }
    }

    public class MusicResultViewModel
    {
        public int    Id   { get; set; }
        public string Name { get; set; }
        public int SizeInBytes     { get; set; }
        public int LengthInMinutes { get; set; }
        public int ChannelId       { get; set; }
        public DateTime  DateCreated { get; set; }
        public DateTime? DateUpdated { get; set; }

        public static explicit operator MusicResultViewModel(Music c)
        {
            return new MusicResultViewModel
            {
                Id                = c.Id,
                Name              = c.Name,
                SizeInBytes       = c.SizeInBytes,
                LengthInMinutes   = c.LengthInMinutes,
                ChannelId         = c.ChannelId,
                DateCreated       = c.DateCreated,
                DateUpdated       = c.DateUpdated
            };
        }
    }
}