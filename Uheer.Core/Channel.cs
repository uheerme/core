﻿using Uheer.Core.Interfaces;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Uheer.Core
{
    public class Channel : IDateTrackable
    {
        public Channel()
        {
            Musics = new List<Music>();
        }

        public bool IsActive()
        {
            return DateDeactivated == null;
        }

        [Key]
        public int Id { get; set; }

        [Required]
        public string Name { get; set; }

        [Required]
        [ForeignKey("Author")]
        public string AuthorId { get; set; }
        public virtual User Author { get; set; }

        public string HostIpAddress { get; set; }
        public string HostMacAddress { get; set; }

        [DefaultValue(true)]
        public bool Loops { get; set; }

        public int? CurrentId { get; set; }
        public DateTime? CurrentStartTime { get; set; }

        public virtual ICollection<Music> Musics { get; set; }

        public DateTime DateCreated { get; set; }

        public DateTime? DateUpdated { get; set; }
        
        public DateTime? DateDeactivated { get; set; }
    }
}
