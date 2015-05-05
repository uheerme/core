using System;

namespace Uheer.Core.Interfaces
{
    public interface IDateTrackable
    {
        DateTime DateCreated { get; set; }
        DateTime? DateUpdated { get; set; }
    }
}
