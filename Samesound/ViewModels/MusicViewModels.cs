using Samesound.Core;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Web;

namespace Samesound.ViewModels
{
    /// <summary>
    /// The view model used to create Music entries in the database.
    /// </summary>
    public class MusicCreateViewModel
    {
        /// <summary>
        /// The name that the new Music will assume. The music file will be renamed to match this name.
        /// </summary>
        [Required]
        [StringLength(128, MinimumLength=4)]
        public string Name     { get; set; }

        /// <summary>
        /// The id of the Channel that contains this Music.
        /// </summary>
        [Required]
        public int ChannelId { get; set; }

        /// <summary>
        /// The size of the file which represents the music.
        /// This property is read-only and will be ignored when sent to the server.
        /// </summary>
        public int SizeInBytes { get; set; }
        
        public static explicit operator Music(MusicCreateViewModel m)
        {
            return new Music
            {
                Name            = m.Name,
                SizeInBytes     = m.SizeInBytes,
                ChannelId       = m.ChannelId
            };
        }
    }

    /// <summary>
    /// The view model used to update Music entries in the database.
    /// </summary>
    public class MusicUpdateViewModel
    {
        /// <summary>
        /// The surrogate key that uniquely identifies a Music in the database.
        /// </summary>
        [Required]
        public int Id { get; set; }

        /// <summary>
        /// The name that the new Music will assume. The music file will be renamed to match this name.
        /// </summary>
        [Required]
        [StringLength(128, MinimumLength = 4)]
        public string Name { get; set; }

        public void Update(Music c)
        {
            if (c.Id != Id)
            {
                throw new ApplicationException("Cannot update a music with Id that does not match the view-model Id.");
            }

            c.Name = Name;
        }
    }

    /// <summary>
    /// The view model used to display Music entries.
    /// </summary>
    public class MusicResultViewModel
    {
        /// <summary>
        /// The surrogate key that uniquely identifies a Music in the database.
        /// </summary>
        public int    Id   { get; set; }
        /// <summary>
        /// The name of the Music.
        /// </summary>
        public string Name { get; set; }
        /// <summary>
        /// The size (in bytes) that the music file occupies/occupied in the server's disks.
        /// </summary>
        public int SizeInBytes     { get; set; }
        /// <summary>
        /// The id of the Channel which contains the Music.
        /// </summary>
        public int ChannelId       { get; set; }
        /// <summary>
        /// The moment when the Music was created.
        /// </summary>
        public DateTime  DateCreated { get; set; }
        /// <summary>
        /// The moment when the Music was last updated. If it never were, this value will be null.
        /// </summary>
        public DateTime? DateUpdated { get; set; }

        public static explicit operator MusicResultViewModel(Music c)
        {
            return c == null ? null : new MusicResultViewModel
            {
                Id                = c.Id,
                Name              = c.Name,
                SizeInBytes       = c.SizeInBytes,
                ChannelId         = c.ChannelId,
                DateCreated       = c.DateCreated,
                DateUpdated       = c.DateUpdated
            };
        }
    }

    /// <summary>
    /// The view model used to request the stream of a Music's file.
    /// </summary>
    public class MusicDownloadViewModel
    {
        /// <summary>
        /// The surrogate key that uniquely identifies a Music in the database.
        /// </summary>
        [Required]
        public int Id { get; set; }
    }
}
