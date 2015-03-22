using Samesound.Core;
using Samesound.Services;
using Samesound.ViewModels;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Threading.Tasks;
using System.Web.Http;
using System.Web.Http.Description;
using System.Linq;

namespace Samesound.Controllers
{
    [Route("api/Channels/{channelId}/Musics")]
    public class MusicsController : ApiController
    {
        private MusicService _musics;

        public MusicsController(MusicService musics)
        {   
            _musics = musics;
        }

        /// <summary>
        /// Get a list with <paramref name="take"/> musics, ignoring the first <paramref name="skip"/> entries.
        /// </summary>
        /// <param name="skip">The number of musics to ignore.</param>
        /// <param name="take">The maximum number of music in the returned list.</param>
        /// <returns>ICollection<MusicResultViewModel></returns>
        public async Task<ICollection<MusicResultViewModel>> GetMusics(int skip = 0, int take = 100)
        {
            return (await _musics.Paginate(skip, take))
                .Select(p => (MusicResultViewModel)p)
                .ToList();
        }

        /// <summary>
        /// Retrieve a MusicResultViewModel with <paramref name="id"/>.
        /// </summary>
        /// <param name="id">The id of the Music that will be retrieved.</param>
        /// <returns>MusicResultViewModel</returns>
        [Route("api/Channels/{channelId}/Musics/{id}")]
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
        /// Updates a Music with id model.Id.
        /// </summary>
        /// <param name="model">The view model for the Music to be updated.</param>
        /// <returns>A empty response with HTTP code 200.</returns>
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
        public async Task<IHttpActionResult> PostMusic(MusicCreateViewModel model)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    throw new ValidationException();
                }

                var music = await _musics.Add((Music)model, model.Stream);
                return CreatedAtRoute("DefaultApi", new { id = music.Id }, (MusicResultViewModel)music);
            }
            catch (ValidationException)
            {
                // All validations errors are already in ModelState.
            }
            catch (Exception e)
            {
                ModelState.AddModelError(e.GetType().ToString(), e.Message);
            }

            return BadRequest(ModelState);
        }

        /// <summary>
        /// Delete a Music <paramref name="id"/>.
        /// </summary>
        /// <param name="id">The id of the Music to be deleted.</param>
        /// <returns>The Music deleted.</returns>
        [Route("api/Channels/{channelId}/Musics/{id}")]
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