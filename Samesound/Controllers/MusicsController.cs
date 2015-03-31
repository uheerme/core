using Samesound.Core;
using Samesound.Services;
using Samesound.Services.Providers;
using Samesound.ViewModels;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading.Tasks;
using System.Web.Http;
using System.Web.Http.Description;

namespace Samesound.Controllers
{
    /// <summary>
    /// The Music resource's controller.
    /// </summary>
    public class MusicsController : ApiController
    {
        private MusicService _musics;
        
        /// <summary>
        /// Constructor for Music resource's controller.
        /// </summary>
        /// <param name="musics">The music service which will be injected.</param>
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
        /// <returns>A response with the created Music, if succeeded. A BadRequest response, otherwise.</returns>
        [ResponseType(typeof(MusicResultViewModel))]
        public async Task<IHttpActionResult> PostMusic()
        {
            MultipartFormDataStreamProvider provider = null;
            MultipartFileData file = null;

            try
            {
                if (!Request.Content.IsMimeMultipartContent())
                {
                    throw new UnsupportedMediaTypeException("Did you forget to attach the song file?", Request.Content.Headers.ContentType);
                }

                // Temporarily saves all uploaded songs.
                provider = await MusicUploadProvider.SaveFilesTemporarily(Request.Content);

                try
                {
                    // Let's ignore all files except the first.
                    var files = provider.FileData;
                    file = files.First();
                }
                catch (SystemException)
                {
                    throw new ApplicationException("Did you forget to attach the song file?");
                }

                // Get the song's name and channel.
                var model       = new MusicCreateViewModel();
                model.Name      = provider.FormData.GetValues("Name").First();
                model.ChannelId = int.Parse(provider.FormData.GetValues("ChannelId").First());

                var fileInfo      = new FileInfo(file.LocalFileName);
                model.SizeInBytes = (int)fileInfo.Length;
                
                // Check if all form information makes sense.
                Validate(model);
                if (!ModelState.IsValid)
                {
                    throw new ValidationException();
                }

                var music = await _musics.Add((Music)model);

                // No exceptions were thrown, the music is in the database! Let's make it official.
                MusicUploadProvider.FinishUpload(file.LocalFileName, music);

                return Ok((MusicResultViewModel)music);
            }
            catch (ValidationException) { }
            catch (Exception e) { ModelState.AddModelError(e.GetType().ToString(), e.Message); }
            finally
            {
                if (provider != null)
                {
                    MusicUploadProvider.TryToRemoveTemporaries(provider.FileData);
                }
            }

            return BadRequest(ModelState);
        }

        /// <summary>
        /// Request for the stream of a specific Music's file.
        /// </summary>
        /// <returns></returns>
        [Route("api/Musics/{Id}/Stream")]
        public async Task<HttpResponseMessage> GetMusicStream([FromUri] MusicDownloadViewModel model)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    throw new ValidationException();
                }

                var music = await _musics.Find(model.Id);
                var provider = new MusicStreamProvider(music);
                var fileInfo = MusicStreamProvider.GetFileInfo(music);
                var length = fileInfo.Length;

                var rangeHeader = Request.Headers.Range;
                var response = new HttpResponseMessage();

                response.Headers.AcceptRanges.Add("bytes");

                // The request will be treated as normal request if there is no Range header.
                if (rangeHeader == null || !rangeHeader.Ranges.Any())
                {
                    response.Content = provider.StreamFileEntirely();
                    response.StatusCode = HttpStatusCode.OK;
                }
                else
                {
                    long start = 0, end = 0;

                    // 1. If the unit is not 'bytes'.
                    // 2. If there are multiple ranges in header value.
                    // 3. If start or end position is greater than file length.
                    if (rangeHeader.Unit != "bytes" || rangeHeader.Ranges.Count > 1 ||
                        !MusicStreamProvider.TryReadRangeItem(rangeHeader.Ranges.First(), fileInfo.Length, out start, out end))
                    {
                        response.StatusCode = HttpStatusCode.RequestedRangeNotSatisfiable;
                        response.Content = new StreamContent(Stream.Null);  // No content for this status.
                        response.Content.Headers.ContentRange = new ContentRangeHeaderValue(fileInfo.Length);
                        response.Content.Headers.ContentType = MusicStreamProvider.GetMimeNameFromExtension(fileInfo.Extension);

                        return response;
                    }

                    // We are now ready to produce partial content.
                    response.Content = provider.StreamFilePartially(start, end);
                    response.Content.Headers.ContentRange = new ContentRangeHeaderValue(start, end, fileInfo.Length);
                    response.StatusCode = HttpStatusCode.PartialContent;

                    length = end - start + 1;
                }

                response.Content.Headers.ContentLength = length;
                return response;
            }
            catch (ValidationException)
            {
                //
            }
            catch (Exception e)
            {
                ModelState.AddModelError(e.GetType().ToString(), e.Message);
            }

            return Request.CreateResponse(HttpStatusCode.BadRequest, ModelState);
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