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

namespace Uheer.Tests.Controllers
{
    [TestClass]
    public class ChannelsControllerTest
    {
        private static Mock<ChannelService> channels;
        private static Mock<MusicService> musics;

        private static ICollection<Channel> data_channels;
        private static ICollection<Music> data_musics;

        [ClassInitialize]
        public static void SetUpClass(TestContext context)
        {
            var seq = new SequentialGenerator<int> { Direction = GeneratorDirection.Ascending };
            var gen = new RandomGenerator();

            data_channels = Builder<Channel>
                .CreateListOfSize(100)
                .All()
                    .With(m => m.Id = seq.Generate())
                    .And(x => x.Name = gen.Phrase(15))
                    .And(x => x.Owner = gen.Phrase(10))
                    .And(x => x.Loops = gen.Boolean())
                    .And(x => x.DateCreated = gen.DateTime())
                    .And(x => x.DateUpdated = x.DateCreated + new TimeSpan(3, 0, 0))
                .Random(30)
                    .With(x => x.DateDeactivated = x.DateUpdated + new TimeSpan(3, 0, 0))
                .Build();

            data_musics = Builder<Music>
                .CreateListOfSize(200)
                .All()
                    .With(m => m.Id = seq.Generate())
                    .And(m => m.LengthInMilliseconds = gen.Int())
                    .And(m => m.SizeInBytes = gen.Int())
                    .And(m => m.DateCreated = gen.DateTime())
                    .And(m => m.DateUpdated = m.DateCreated + new TimeSpan(3, 0, 0))
                .Build();

            channels = new Mock<ChannelService>(null);
            musics = new Mock<MusicService>(null);
        }

        [TestInitialize]
        public void SetUp()
        {
            channels
                .Setup(x => x.All())
                .ReturnsAsync(data_channels);

            channels
                .Setup(x => x.Paginate(40, 40))
                .ReturnsAsync(data_channels.Skip(40).Take(40).ToList());

            channels
                .Setup(c => c.Deactivate(It.IsAny<Channel>()))
                .ReturnsAsync(1);
        }

        [TestMethod]
        public async Task TestGetChannels()
        {
            var controller = new ChannelsController(channels.Object, musics.Object);

            var result = await controller.GetChannels(40, 40);

            Assert.IsTrue(result.Count == 40);
        }
    }
}
