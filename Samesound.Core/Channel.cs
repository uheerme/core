using Samesound.Core.Interfaces;
using System;
using System.ComponentModel.DataAnnotations;

namespace Samesound.Core
{
    public class Channel : IDateTrackable
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string Name { get; set; }

        [Required]
        public string Owner { get; set; }

        public DateTime DateCreated { get; set; }

        public DateTime? DateUpdated { get; set; }
    }
}
