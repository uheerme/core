using System;

namespace Samesound.ViewModels
{
    /// <summary>
    /// The view model that contains all information required to determine the server's current time.
    /// </summary>
    public class CurrentServerTimeViewModel
    {
        /// <summary>
        /// The timestamp that represents the current time in the server.
        /// </summary>
        public DateTime Now { get; set; }
    }
}