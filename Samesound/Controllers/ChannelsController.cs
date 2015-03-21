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
    [RoutePrefix("api/Channels")]
    public class ChannelsController : ApiController
    {
        private ChannelService _channels;

        public ChannelsController(ChannelService channels)
        {   
            _channels = channels;
        }

        /// <summary>
        /// Get a list with <paramref name="take"/> channels, ignoring the first <paramref name="skip"/> entries.
        /// </summary>
        /// <param name="skip">The number of channels to ignore.</param>
        /// <param name="take">The maximum number of channels in the returned list.</param>
        /// <returns>ICollection<ChannelResultViewModel></returns>
        public async Task<ICollection<ChannelResultViewModel>> GetChannels(int skip = 0, int take = 100)
        {
            return (await _channels.Paginate(skip, take))
                .Select(p => (ChannelResultViewModel)p)
                .ToList();
        }

        /// <summary>
        /// Retrieve a ChannelResultViewModel with <paramref name="id"/>.
        /// </summary>
        /// <param name="id">The id of the Channel that will be retrieved.</param>
        /// <returns>ChannelResultViewModel</returns>
        [ResponseType(typeof(ChannelResultViewModel))]
        public async Task<IHttpActionResult> GetChannel(int id)
        {
            try
            {
                var channel = await _channels.Find(id);
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
        /// Updates a Channel with id model.Id.
        /// </summary>
        /// <param name="model">The view model for the Channel to be updated.</param>
        /// <returns>A empty response with HTTP code 200.</returns>
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
        /// Delete a Channel <paramref name="id"/>.
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