using System;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Uheer.Controllers;
using Moq;
using Uheer.Services;
using Uheer.Core;
using FizzWare.NBuilder;
using System.Linq;
using System.Collections.Generic;
using System.Threading.Tasks;
using Uheer.ViewModels;
using System.Collections;

namespace Uheer.Tests.Controllers
{
    [TestClass]
    public class ChannelsControllerTest
    {
        private static Mock<ChannelService> channels;
        private static Mock<MusicService> musics;

        private static ICollection<Channel> data_channels;
        private static ICollection<Music> data_musics;
        private static ICollection<User> data_users;

        [ClassInitialize]
        public static void SetUpClass(TestContext context)
        {
            var seq = new SequentialGenerator<int> { Direction = GeneratorDirection.Ascending };
            var gen = new RandomGenerator();

            data_users = Builder<User>
                .CreateListOfSize(10)
                .All()
                    .With(u => u.DisplayName = gen.Phrase(15))
                    .Build();

            data_channels = Builder<Channel>
                .CreateListOfSize(20)
                .All()
                    .With(m => m.Id = seq.Generate())
                    .And(x => x.Name = gen.Phrase(15))
                    .And(x => x.AuthorId = gen.Phrase(10))
                    .And(x => x.Author = data_users.First())
                    .And(x => x.Loops = gen.Boolean())
                    .And(x => x.DateCreated = gen.DateTime())
                    .And(x => x.DateUpdated = x.DateCreated + new TimeSpan(3, 0, 0))
                .Random(10)
                    .With(x => x.DateDeactivated = x.DateUpdated + new TimeSpan(3, 0, 0))
                .Build();

            data_musics = Builder<Music>
                .CreateListOfSize(50)
                .All()
                    .With(m => m.Id = seq.Generate())
                    .And(m => m.LengthInMilliseconds = gen.Int())
                    .And(m => m.SizeInBytes = gen.Int())
                    .And(m => m.DateCreated = gen.DateTime())
                    .And(m => m.DateUpdated = m.DateCreated + new TimeSpan(3, 0, 0))
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
                .Setup(x => x.ActiveChannels(0, 4))
                .ReturnsAsync(data_channels.Take(4).ToList());

            channels
                .Setup(c => c.Deactivate(It.IsAny<Channel>()))
                .ReturnsAsync(1);
        }

        [TestMethod]
        public async Task TestGetChannels()
        {
            var controller = new ChannelsController(channels.Object, musics.Object);

            var result = await controller.GetChannels(0, 10);

            Assert.AreEqual(10, result.Count);
        }

        [TestMethod]
        public async Task TestGetActiveChannels()
        {
            var controller = new ChannelsController(channels.Object, musics.Object);

            var result = await controller.GetActiveChannels(0, 4);

            Assert.AreEqual(4, result.Count);
        }

        [TestMethod]
        public async Task TestGetChannel()
        {
            var controller = new ChannelsController(channels.Object, musics.Object);

            var result = await controller.GetChannel(10);

            Assert.IsNotNull(result);
        }

        [TestMethod]
        public void TestPostChannel()
        {
            Assert.Fail();
        }

        [TestMethod]
        public void TestPutChannel()
        {
            Assert.Fail();
        }

        [TestMethod]
        public void TestPostPlay()
        {
            Assert.Fail();
        }

        [TestMethod]
        public void TestDeactivateChannel()
        {
            Assert.Fail();
        }

        [TestMethod]
        public void TestGetMusicsOfChannel()
        {
            Assert.Fail();
        }

        [TestMethod]
        public void TestDeleteChannel()
        {
            Assert.Fail();
        }
    }
}
