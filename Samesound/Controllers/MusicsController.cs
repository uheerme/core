using Samesound.Core;
using Samesound.Providers;
using Samesound.Services;
using Samesound.Services.Providers;
using Samesound.ViewModels;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web.Http;
using System.Web.Http.Description;

namespace Samesound.Controllers
{
    public class MusicsController : ApiController
    {
        private MusicService _musics;
        
        public MusicsController(MusicService musics)
        {   
            _musics = musics;
        }

        /// <summary>
        /// Get all musics currently on the database.
        /// </summary>
        /// <param name="skip">The number of musics to ignore.</param>
        /// <param name="take">The maximum length of the collection retrieved.</param>
        /// <returns>A collection of MusicResultViewModel.</returns>
        public async Task<ICollection<MusicResultViewModel>> GetMusics(int skip = 0, int take = 100)
        {
            return (await _musics.Paginate(skip, take))
                .Select(p => (MusicResultViewModel)p)
                .ToList();
        }

        /// <summary>
        /// Retrieve a music with given Id.
        /// </summary>
        /// <param name="id">The id of the Music that will be retrieved.</param>
        /// <returns>MusicResultViewModel</returns>
        [ResponseType(typeof(MusicResultViewModel))]
        public async Task<IHttpActionResult> GetMusic(int id)
        {
            try
            {
                var music = await _musics.Find(id);
                if (music == null)
                {
                    throw new KeyNotFoundException();
                }

                return Ok((MusicResultViewModel)music);
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
        }

        /// <summary>
        /// Updates a given music Id.
        /// </summary>
        /// <param name="model">The view model for the Music to be updated.</param>
        /// <returns>A Response with status code equals to 200.</returns>
        [ResponseType(typeof(void))]
        public async Task<IHttpActionResult> PutMusic(MusicUpdateViewModel model)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    throw new ValidationException();
                }

                var music = await _musics.Find(model.Id);
                if (music == null)
                {
                    throw new KeyNotFoundException();
                }

                model.Update(music);
                await _musics.Update(music);
                return Ok();
            }
            catch (ValidationException)
            {
                // All validations errors are already in ModelState.
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
            catch (Exception e)
            {
                ModelState.AddModelError(e.GetType().ToString(), e.Message);
            }

            return BadRequest(ModelState);
        }

        /// <summary>
        /// Create a new Music.
        /// </summary>
        /// <param name="model">The view model for the Music to be created.</param>
        /// <returns>A response with the created Music, if succeeded. A BadRequest response, otherwise.</returns>
        [ResponseType(typeof(MusicResultViewModel))]
        public async Task<IHttpActionResult> PostMusic()
        {
            try
            {
                if (!Request.Content.IsMimeMultipartContent())
                {
                    throw new UnsupportedMediaTypeException("Did you forget to attach the song file?", Request.Content.Headers.ContentType);
                }

                // Temporarily saves all uploaded songs.
                var provider = await MusicUploadProvider.SaveFilesTemporarily(Request.Content);

                // Get the song's name and channel.
                var names = provider.FormData.GetValues("Name");
                var channelIds = provider.FormData.GetValues("ChannelId");
                var files = provider.FileData;

                var createdMusics = new List<MusicResultViewModel>();

                if (names.Length != channelIds.Length)
                {
                    throw new ApplicationException("The data passed is invalid.");
                }
                if (names.Length != files.Count)
                {
                    throw new ApplicationException("The number of entities does not match the number of uploaded files.");
                }

                for (var i = 0; i < names.Length; i++)
                {
                    var m = new MusicCreateViewModel
                    {
                        Name = names[i],
                        ChannelId = int.Parse(channelIds[i])
                    };

                    Validate(m);
                    if (!ModelState.IsValid)
                    {
                        MusicUploadProvider.TryToRemoveTemporary(files[i].LocalFileName);
                        continue;
                    }

                    var music = await _musics.Add((Music)m);
                    MusicUploadProvider.FinishUpload(files[i].LocalFileName, music);

                    createdMusics.Add((MusicResultViewModel)music);
                }

                return Ok(createdMusics);
            }
            catch (Exception e)
            {
                ModelState.AddModelError(e.GetType().ToString(), e.Message);
            }

            return BadRequest(ModelState);
        }

        /// <summary>
        /// Delete a Music with a given Id.
        /// </summary>
        /// <param name="id">The id of the Music to be deleted.</param>
        /// <returns>The Music deleted.</returns>
        [ResponseType(typeof(MusicResultViewModel))]
        public async Task<IHttpActionResult> DeleteMusic(int id)
        {
            try
            {
                var music = await _musics.Find(id);
                if (music == null)
                {
                    throw new KeyNotFoundException();
                }

                await _musics.Delete(music);
                return Ok((MusicResultViewModel)music);
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
            catch (Exception e)
            {
                ModelState.AddModelError(e.GetType().ToString(), e.Message);
            }

            return BadRequest(ModelState);
        }

        protected override void Dispose(bool disposing)
        {
            if (disposing)
            {
                _musics.Dispose();
            }
            base.Dispose(disposing);
        }
    }
}