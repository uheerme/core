using FizzWare.NBuilder;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Moq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using System.Web.Http;
using System.Web.Http.Results;
using Uheer.Controllers;
using Uheer.Core;
using Uheer.Services;
using Uheer.ViewModels;

namespace Uheer.Tests.Controllers
{
    [TestClass]
    public class ChannelsControllerTest
    {
        private static Mock<ChannelService> channels;
        private static Mock<MusicService> musics;

        private static ICollection<Channel> data_channels;
        private static ICollection<Music> data_musics;
        
        private ChannelsController controller;

        [ClassInitialize]
        public static void SetUpClass(TestContext context)
        {
            var seq = new SequentialGenerator<int> { Direction = GeneratorDirection.Ascending };
            var gen = new RandomGenerator();

            data_musics = Builder<Music>
                .CreateListOfSize(50)
                .All()
                    .With(m => m.Id = seq.Generate())
                    .And(m => m.LengthInMilliseconds = gen.Int())
                    .And(m => m.SizeInBytes = gen.Int())
                    .And(m => m.DateCreated = gen.DateTime())
                    .And(m => m.DateUpdated = m.DateCreated + new TimeSpan(3, 0, 0))
                .Build();

            data_channels = Builder<Channel>
                .CreateListOfSize(20)
                .All()
                    .With(m => m.Id = seq.Generate())
                    .And(x => x.Name = gen.Phrase(15))
                    .And(x => x.Owner = gen.Phrase(10))
                    .And(x => x.Loops = gen.Boolean())
                    .And(x => x.Musics = data_musics)
                    .And(x => x.DateCreated = gen.DateTime())
                    .And(x => x.DateUpdated = x.DateCreated + new TimeSpan(3, 0, 0))
                .Random(10)
                    .With(x => x.DateDeactivated = x.DateUpdated + new TimeSpan(3, 0, 0))
                .Build();

            channels = new Mock<ChannelService>(null);
            musics = new Mock<MusicService>(null);

            channels
                .Setup(x => x.All())
                .ReturnsAsync(data_channels);

            channels
                .Setup(x => x.Paginate(0, 10))
                .ReturnsAsync(data_channels.Take(10).ToList());

            channels
                .Setup(x => x.Find(It.IsAny<int>()))
                .ReturnsAsync(data_channels.FirstOrDefault());

            channels
                .Setup(x => x.FindWithMusics(It.IsAny<int>()))
                .ReturnsAsync(data_channels.FirstOrDefault());

            channels
                .Setup(x => x.ActiveChannels(0, 4))
                .ReturnsAsync(data_channels.Take(4).ToList());

            channels
                .Setup(c => c.Deactivate(It.IsAny<Channel>()))
                .ReturnsAsync(1);

            channels
                .Setup(c => c.Add(It.IsAny<Channel>()))
                .ReturnsAsync(data_channels.First());

            channels
                .Setup(c => c.Update(It.IsAny<Channel>()))
                .ReturnsAsync(1);

            channels
                .Setup(x => x.FindOrFail(It.IsAny<object[]>()))
                .ReturnsAsync(data_channels.First());

            musics
                .Setup(x => x.FindOrFail(It.IsAny<object[]>()))
                .ReturnsAsync(data_musics.First());

            musics
                .Setup(x => x.OfChannel(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<int>()))
                .ReturnsAsync(data_musics.Take(10).ToList());
        }

        [TestInitialize]
        public void Setup()
        {
            controller = new ChannelsController(channels.Object, musics.Object);
            controller.Request = new HttpRequestMessage();
            controller.Request.SetConfiguration(new HttpConfiguration());
        }

        [TestMethod]
        public async Task TestGetChannels()
        {
            var result = await controller.GetChannels(0, 10);

            Assert.AreEqual(10, result.Count);
        }

        [TestMethod]
        public async Task TestGetActiveChannels()
        {
            var result = await controller.GetActiveChannels(0, 4);

            Assert.AreEqual(4, result.Count);
        }

        [TestMethod]
        public async Task TestGetChannel()
        {
            var result = (OkNegotiatedContentResult<ChannelResultViewModel>)await controller.GetChannel(10);

            Assert.IsNotNull(result);
            Assert.IsNotNull(result.Content);
            Assert.IsTrue(result.Content.Id > 0);
        }

        [TestMethod]
        public async Task TestPostChannel()
        {
            var gen = new RandomGenerator();
            
            var model = new ChannelCreateViewModel
            {
                Name = gen.Phrase(10),
                Owner = gen.Phrase(10),
                HostIpAddress = "127.0.0.1",
                HostMacAddress = "23:3c:30:e4"
            };

            var result = (CreatedAtRouteNegotiatedContentResult<ChannelResultViewModel>)await controller.PostChannel(model);

            Assert.IsNotNull(result);
            Assert.IsNotNull(result.Content);
            Assert.IsTrue(result.Content.Id > 0);
        }

        [TestMethod]
        public async Task TestPutChannel()
        {
            var gen = new RandomGenerator();
            var anyChannel = data_channels.First();

            var model = new ChannelUpdateViewModel
            {
                Id = anyChannel.Id,
                Name = gen.Phrase(10),
                Loops = gen.Boolean(),
            };

            var result = await controller.PutChannel(model);
            var response = await result.ExecuteAsync(CancellationToken.None);

            Assert.AreEqual(HttpStatusCode.OK, response.StatusCode);
        }

        [TestMethod]
        public async Task TestPostPlay()
        {
            var anyChannel = data_channels.First();
            var anyMusic = anyChannel.Musics.First();

            var result = await (await controller.PostPlay(anyChannel.Id, anyMusic.Id)).ExecuteAsync(CancellationToken.None);

            Assert.IsNotNull(result);
            Assert.IsNotNull(result.Content);
            Assert.AreEqual(HttpStatusCode.OK, result.StatusCode);
        }

        [TestMethod]
        public async Task TestDeactivateChannel()
        {
            var anyChannel = data_channels.First();

            var result = await controller.PostDeactivateChannel(anyChannel.Id);
            var response = await result.ExecuteAsync(CancellationToken.None);

            Assert.IsNotNull(result);
            Assert.IsNotNull(response.Content);
            Assert.AreEqual(HttpStatusCode.OK, response.StatusCode);
        }

        [TestMethod]
        public async Task TestGetMusicsOfChannel()
        {
            var anyChannel = data_channels.First();

            var result = await controller.GetMusicsOfChannel(anyChannel.Id);
            
            Assert.IsNotNull(result);
        }

        [TestMethod]
        public async Task TestDeleteChannel()
        {
            var anyChannel = data_channels.First();

            var result = await controller.DeleteChannel(anyChannel.Id);
            var response = await result.ExecuteAsync(CancellationToken.None);

            Assert.IsNotNull(result);
            Assert.IsNotNull(response.Content);
            Assert.AreEqual(HttpStatusCode.OK, response.StatusCode);
        }
    }
}
