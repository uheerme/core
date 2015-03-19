using Samesound.Core.Interfaces;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Samesound.Core
{
    public class Music : IDateTrackable
    {
        [Key]
        public int Id { get; set; }

        public string Name     { get; set; }
        public int SizeInBytes { get; set; }
        public int LengthInMinutes { get; set; }

        [ForeignKey("Channel")]
        public int ChannelId { get; set; }
        public virtual Channel Channel { get; set; }

        public DateTime  DateCreated { get; set; }
        public DateTime? DateUpdated { get; set; }
    }
}
