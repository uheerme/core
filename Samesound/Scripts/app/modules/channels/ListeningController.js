
samesoundApp
    .controller('ListeningController',
        ['$scope', 'channel', 'MusicPlayer', 'config',
        function ($scope, channel, MusicPlayer, config) {

            $scope.toogleMute = function () {
                $scope.mute = !$scope.mute;
                MusicPlayer
                    .mute($scope.mute);
            }

            $scope.player = MusicPlayer
                .take($scope.channel = channel)
                .start();
        }])

samesoundApp
    .factory('MusicPlayer', ['SynchronyProvider', 'MusicStreamProvider', function (SynchronyProvider, MusicStreamProvider) {
        var player = undefined;
        var playing = false;

        return {
            take: function (channel) {
                player = this;
                this.channel = channel;
                return this;
            },
            mute: function (shouldBeMuted) {
                var audio = MusicStreamProvider.getAudio(this.channel.CurrentId);
                audio.muted = shouldBeMuted;
            },
            start: function (strategy) {
                if (!this.channel.CurrentId) {
                    console.log('Channel is currently stalled.');
                    playing = false;
                    return;
                }

                if (playing && strategy !== 'force-start') {
                    console.log('MusicPlayer is already playing.');
                    return;
                }

                MusicStreamProvider
                    .initialize();

                var currentMusic = SynchronyProvider
                    .sync()
                    .take(this.channel)
                    .translateTimeline()
                    .currentMusic();

                this
                    .play(currentMusic.Id)
                    .loadNextTwoMusics(currentMusic.Id);

                playing = true;
                return this;
            },
            play: function (musicId) {
                var audio = MusicStreamProvider
                    .load(this.channel.CurrentId);

                audio.addEventListener('timeupdate', function () {
                    var progress = Math.floor((audio.currentTime / audio.duration) * 100);
                    $('#player-progress-bar').width(progress + '%');
                }, false);

                // only if channel is flagged as 'Loop'
                audio.addEventListener('ended', function () {
                    var next = player.nextMusic();
                    player.play(next);
                }, false);

                audio.play();
                return this;
            },
            nextMusic: function () {
                var indexOfCurrentMusic = SynchronyProvider.indexOfCurrentMusic();
                var next = this.channel.Musics[(indexOfCurrentMusic + 1) % this.channel.Musics.length];

                this.channel.CurrentId = next.Id;
                return next;
            },
            loadNextTwoMusics: function (musicId) {
                var currentIndex = SynchronyProvider.indexOfMusic(musicId);

                // Load the next two musics.
                for (var i = 1; i < 3; i++) {
                    var indexToLoad = (currentIndex + i) % this.channel.Musics.length;
                    var musicToLoad = this.channel.Musics[indexToLoad];
                    MusicStreamProvider.load(musicToLoad.Id);
                }
            }
        };
    }])

samesoundApp
    .factory('SynchronyProvider', ['StatusResource', function (Status) {
        return {
            take: function (channel) {
                this.channel = channel;
                return this;
            },
            sync: function () {
                var timeframe = new Date();

                Status.now().$promise.then(function (response) {
                    this.localTime = new Date();

                    timeframe = (localTime - timeframe);
                    delay = timeframe / 2;

                    this.serverTime = new Date(response.Now)
                    this.serverTime.setMilliseconds(this.serverTime.getMilliseconds() + delay);
                });

                return this;
            },
            translateTimeline: function () {
                return this;
            },
            indexOfCurrentMusic: function () {
                return this.indexOfMusic(this.channel.CurrentId);
            },
            indexOfMusic: function (musicId) {
                var musics = this.channel.Musics;

                for (var i = 0; i < musics.length; i++)
                    if (musics[i].Id == musicId)
                        return i;
                return -1;
            },
            currentMusic: function () {
                var index = this.indexOfCurrentMusic();
                
                return index > -1
                    ? this.channel.Musics[index]
                    : null;
            }
        };
    }]);

samesoundApp
    .factory('MusicStreamProvider', [
        '$document', 'config',
        function ($document, config) {
            var localTime,
                serverTime,
                maxMusicsLoadedAtOnce = 3,
                audios = {};

            return {
                initialize: function (strategy) {
                    audios = {};
                    return this;
                },
                dispose: function (strategy) {
                    for (audioId in audios) {
                        var audio = audios[audioId];

                        audio.preload = 'none';
                        audio.pause();
                    }

                    audios = {};
                },

                getAudio: function (musicId) {
                    return audios[musicId.toString()];
                },

                // Defines the policy about sound loadings.
                shouldLoad: function (musicId) {
                    return maxMusicsLoadedAtOnce > Object.keys(audios).length;
                },

                // Streams the music considering the loading policy.
                // Return false, if failed. Otherwise, returns a reference to the streaming music.
                tryToLoad: function (musicId) {
                    if (!this.shouldLoad(musicId))
                        return false;

                    return this.load(musicId);
                },

                // Streams the music regardless the loading policy.
                load: function (musicId) {
                    var musicAlreadyStreaming = audios[musicId.toString()];
                    if (musicAlreadyStreaming) return musicAlreadyStreaming;

                    var audio = $document[0].createElement('audio');
                    audio.src = config.apiUrl + 'Musics/' + musicId + '/Stream';
                    audio.preload = 'auto';

                    return audios[musicId.toString()] = audio;
                }
            };
        }])
    .run(['$rootScope', 'MusicStreamProvider', function ($rootScope, MusicStreamProvider) {
        $rootScope.$on("$stateChangeStart", function (event, toState, toParams, fromState, fromParams) {
            if (fromState.name == 'listen/:id') {
                MusicStreamProvider.dispose();
            }
        });
    }]);
