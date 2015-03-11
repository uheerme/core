using System;

namespace Samesound.Data.Interfaces
{
    public interface IDateTrackable
    {
        DateTime DateCreated { get; set; }
        DateTime? DateUpdated { get; set; }
    }
}
