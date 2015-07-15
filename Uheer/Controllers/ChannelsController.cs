using Microsoft.IdentityModel.Claims;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Security.Permissions;
using System.Threading.Tasks;
using System.Web.Http;
using System.Web.Http.Description;
using Thinktecture.IdentityModel.Authorization.WebApi;
using Uheer.Core;
using Uheer.Extensions;
using Uheer.Services;
using Uheer.ViewModels;

namespace Uheer.Controllers
{
    /// <summary>
    /// The Channel's resource controller.
    /// </summary>
    [Authorize]
    [RoutePrefix("api/Channels")]
    public class ChannelsController : ApiController
    {
        private ChannelService _channels;
        private MusicService   _musics;

        /// <summary>
        /// Default ChannelsController constructor.
        /// </summary>
        /// <param name="channels">The ChannelService automaticly injected.</param>
        /// <param name="musics">The MusicService automaticly injected.</param>
        public ChannelsController(ChannelService channels, MusicService musics)
        {   
            _channels = channels;
            _musics   = musics;
        }

        /// <summary>
        /// Get a list of channels.
        /// </summary>
        /// <param name="skip">The number of channels to ignore.</param>
        /// <param name="take">The maximum number of channels in the returned list.</param>
        /// <returns>The collection of channels.</returns>
        [AllowAnonymous]
        public async Task<ICollection<ChannelListResultViewModel>> GetChannels(int skip = 0, int take = 100)
        {
            return (await _channels.Paginate(skip, take))
                .Select(c => (ChannelListResultViewModel)c)
                .ToList();
        }

        /// <summary>
        /// Get a list of active channels, descendingly ordered by their Id.
        /// </summary>
        /// <param name="skip">The number of channels to ignore.</param>
        /// <param name="take">The maximum number of channels in the returned list.</param>
        /// <returns>The collection of active channels.</returns>
        [AllowAnonymous]
        [Route("Active")]
        public async Task<ICollection<ChannelListResultViewModel>> GetActiveChannels(int skip = 0, int take = 100)
        {
            return (await _channels.ActiveChannels(skip, take))
                .Select(c => (ChannelListResultViewModel)c)
                .ToList();
        }

        /// <summary>
        /// Retrieve a Music collection associated with a Channel.
        /// </summary>
        /// <param name="id">The Id of the channel that contains the music collection.</param>
        /// <param name="skip">The number of musics to ignore.</param>
        /// <param name="take">The maximum length of the collection retrieved.</param>
        /// <returns>A list of Musics associated with a Channel.</returns>
        [AllowAnonymous]
        [Route("{id}/Musics")]
        public async Task<ICollection<MusicResultViewModel>> GetMusicsOfChannel(int id, int skip = 0, int take = 100)
        {
            return (await _musics.OfChannel(id, skip, take))
                .Select(m => (MusicResultViewModel)m)
                .ToList();
        }

        /// <summary>
        /// Retrieve a channel with a given Id.
        /// </summary>
        /// <param name="id">The id of the Channel that will be retrieved.</param>
        /// <returns>ChannelResultViewModel</returns>
        [AllowAnonymous]
        [ResponseType(typeof(ChannelResultViewModel))]
        public async Task<IHttpActionResult> GetChannel(int id)
        {
            try
            {
                var channel = await _channels.FindWithMusics(id);
                if (channel == null)
                {
                    throw new KeyNotFoundException();
                }

                return Ok((ChannelResultViewModel)channel);
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
        }

        /// <summary>
        /// Updates a Channel with a given Id.
        /// </summary>
        /// <param name="model">The view model for the Channel to be updated.</param>
        /// <returns>A response with a status code equals to 200.</returns>
        [ResponseType(typeof(void))]
        public async Task<IHttpActionResult> PutChannel(ChannelUpdateViewModel model)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    throw new ValidationException();
                }

                var channel = await _channels.Find(model.Id);
                if (channel == null)
                {
                    throw new KeyNotFoundException();
                }

                model.Update(channel);
                await _channels.Update(channel);
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
        /// Create a new Channel.
        /// </summary>
        /// <param name="model">The view model for the Channel to be created.</param>
        /// <returns>A response with the created Channel, if succeeded. A BadRequest response, otherwise.</returns>
        [ResponseType(typeof(ChannelResultViewModel))]
        public async Task<IHttpActionResult> PostChannel(ChannelCreateViewModel model)
        {
            try
            {
                model.HostIpAddress = Request.GetClientIpAddress();

                if (!ModelState.IsValid)
                {
                    throw new ValidationException();
                }

                var channel = await _channels.Add((Channel)model);
                return CreatedAtRoute("DefaultApi", new { id = channel.Id }, (ChannelResultViewModel)channel);
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
        /// Play a determined music.
        /// </summary>
        /// <param name="channelId">The Id of the Channel.</param>
        /// <param name="musicId">The Id of the Music that should start playing.</param>
        /// <returns>The Channel with the reference of the playing music.</returns>
        [Route("{channelId}/Play/{musicId}")]
        [ResponseType(typeof(ChannelCurrentResultViewModel))]
        public async Task<IHttpActionResult> PostPlay([FromUri]int channelId, [FromUri]int musicId)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    throw new ValidationException();
                }

                var channel = await _channels.FindOrFail(channelId);
                var music   = await _musics.FindOrFail(musicId);

                await _channels.Play(channel, music);

                return Ok((ChannelCurrentResultViewModel)channel);
            }
            catch (ValidationException)
            {
                //
            }
            catch (Exception e)
            {
                ModelState.AddModelError(e.GetType().ToString(), e.Message);
            }

            return BadRequest(ModelState);
        }

        /// <summary>
        /// Deactivate a channel with given Id.
        /// </summary>
        /// <param name="id">The Id of the channel to be deactivated.</param>
        /// <returns>The deactivated channel.</returns>
        [Route("{id}/deactivate")]
        [ResponseType(typeof(ChannelResultViewModel))]
        public async Task<IHttpActionResult> PostDeactivateChannel(int id)
        {
            try
            {
                var channel = await _channels.FindOrFail(id);
            
                await _channels.Deactivate(channel);
                return Ok((ChannelResultViewModel)channel);
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
            catch (Exception e)
            {
                ModelState.AddModelError(e.ToString(), e.Message);
            }

            return BadRequest(ModelState);
        }

        /// <summary>
        /// Delete a Channel with given Id.
        /// </summary>
        /// <param name="id">The id of the Channel to be deleted.</param>
        /// <returns>The Channel deleted.</returns>
        [ResponseType(typeof(ChannelResultViewModel))]
        public async Task<IHttpActionResult> DeleteChannel(int id)
        {
            try
            {
                var channel = await _channels.Find(id);
                if (channel == null)
                {
                    throw new KeyNotFoundException();
                }

                await _channels.Delete(channel);
                return Ok((ChannelResultViewModel)channel);
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
                _channels.Dispose();
            }
            base.Dispose(disposing);
        }
    }
}
