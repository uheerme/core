'use strict';

samesoundApp
    .factory('MusicPlayer', ['SynchronyProvider', 'MusicStreamProvider', function (SynchronyProvider, MusicStreamProvider) {
        var playing = false;

        return {
            /// Take a channel and start streaming it.
            /// Considerations:
            ///     The MusicStreamProvider will be initialized: previous instances will be disposed, removing existing streamings.
            ///     The client will re-sync with the server.
            take: function ($scope) {
                this.$scope = $scope;
                
                MusicStreamProvider.initialize();

                var currentMusic = SynchronyProvider
                    .take(this.$scope.channel)
                    .sync()
                    .currentMusicOrDefault();

                // There is at least one music in the Channel.
                if (currentMusic) {
                    this.load(currentMusic);
                    this.loadNextMusics(currentMusic, 2);
                }

                return this;
            },
            
            /// Mutes the current music acording with the value of shouldBeMuted.
            mute: function (shouldBeMuted) {
                var currentId = this.$scope.channel.CurrentId;

                if (currentId)
                    MusicStreamProvider.audioFromMusicId(currentId).muted = shouldBeMuted;

                return this;
            },

            /// Start the player, in case it hasn't been started yet (or force start with startegy = 'force-start').
            /// Considerations:
            ///     The music with Id=this.channel.CurrentId will be played.
            start: function (strategy) {
                if (!this.$scope.channel.CurrentId) {
                    console.log('Channel is currently stalled.');
                    playing = false;
                    return this;
                }

                if (playing && strategy !== 'force-start') {
                    console.log('MusicPlayer is already playing.');
                    return this;
                }

                return this.playCurrent();
            },

            playCurrent: function () {
                return this.play(this.$scope.channel.CurrentId);
            },

            /// Play a music with Id=musicId from the this.channel.Musics list.
            /// Considerations:
            ///     If musicId were not provided, it assumes this.channel.CurrentId as replacement.
            ///     Defines a callback to play the next music (constrained by some Channel definitions).
            play: function (musicId) {
                var musicId = musicId || this.$scope.channel.CurrentId;

                // Two musics should never play at once.
                this.stopAll();

                // Start streaming it, if it hasn't been done yet.
                var audio = MusicStreamProvider
                    .load(musicId);

                // Modifies progress-bar as music progresses.
                var player = this;
                audio.addEventListener('timeupdate', function () {
                    player.$scope.$apply(function () {
                        player.$scope.currentMusicCurrentTime = Math.trunc(audio.currentTime);
                    });
                }, false);

                audio.addEventListener('ended', function () {
                    // If the channels allows looping or the current music was not the last of the track.
                    if (player.$scope.channel.Loops
                        || SynchronyProvider.indexOfCurrentMusic() < player.$scope.channel.Musics.length - 1) {

                        player.next().play();
                    }
                }, false);

                audio.play();
                playing = true;
                this.$scope.channel.Current = SynchronyProvider.currentMusic();
                return this;
            },

            /// Stop all playing audios.
            stopAll: function () {
                for (var index in this.$scope.channel.Musics) {
                    var music = this.$scope.channel.Musics[index];
                    this.stop(music.Id);
                }

                playing = false;
                return this;
            },

            /// Stop the audio that makes reference to the music with Id=musicId.
            stop: function (musicId) {
                var audio = MusicStreamProvider.audioFromMusicId(musicId);
                if (audio) audio.pause();

                playing = 'unknown';
                return this;
            },

            /// Update this.channel.CurrentId to match the next music in the order given by this.channel.Musics list.
            next: function () {
                var channel = this.$scope.channel;

                var nextIndex = (SynchronyProvider.indexOfCurrentMusic() + 1) % channel.Musics.length;
                var nextMusic = channel.Musics[nextIndex];

                // updates channel's current music propagating change.
                this.$scope.$apply(function () {
                    channel.CurrentId = nextMusic.Id;
                });

                return this;
            },

            load: function (music) {
                var player = this;

                var wasAlreadyLoaded = MusicStreamProvider.wasAlreadyLoaded(music.Id);
                var audio = MusicStreamProvider.load(music.Id);

                if (!wasAlreadyLoaded) {
                    audio.addEventListener('loadedmetadata', function () {
                        player.$scope.$apply(function () {
                            music.LengthInSeconds = Math.trunc(audio.duration);
                        });
                    }, false);

                    audio.addEventListener('onloadeddata', function () {
                        player.loadNextMusics(music);
                    }, false);
                }

                return this;
            },

            /// Asks MusicStreamProvider for the stream of the following musics.
            loadNextMusics: function (music, count) {
                var channel = this.$scope.channel;
                var musicId = music.Id;
                count = count || 2;

                var baseIndex = SynchronyProvider.indexOfMusic(musicId);

                // Load the next N musics.
                for (var i = 1; i < count +1; i++) {
                    var indexToLoad = (baseIndex + i) % channel.Musics.length;
                    var musicToLoad = channel.Musics[indexToLoad];
                    this.load(musicToLoad);
                }

                return this;
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
                var provider = this;
                var timeframe = new Date();

                Status.now().$promise.then(function (response) {
                    provider.localTime = new Date();

                    timeframe = (provider.localTime - timeframe);
                    var delay = timeframe / 2;

                    provider.serverTime = new Date(response.Now)
                    provider.serverTime.setMilliseconds(provider.serverTime.getMilliseconds() + delay);
                });

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

            currentMusicOrDefault: function () {
                return this.currentMusic() || this.channel.Musics[0];
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
                    return this.dispose();
                },

                dispose: function (strategy) {
                    // Stop streaming and pause all audios.
                    for (var audioId in audios) {
                        var audio = audios[audioId];

                        audio.preload = 'none';
                        audio.pause();
                    }

                    // effectively remove all audios.
                    audios = {};

                    return this;
                },

                audioFromMusicId: function (musicId) {
                    return audios[musicId.toString()];
                },

                wasAlreadyLoaded: function (musicId) {
                    return ~~audios[musicId.toString()];
                },

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
            // Asserts behavior: player will stop if user move to another page.
            if (fromState.name == 'listen/:id') {
                MusicStreamProvider.dispose();
            }
        });
    }]);
