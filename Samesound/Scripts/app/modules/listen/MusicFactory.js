'use strict';

samesoundApp
    .factory('MusicPlayer', ['SynchronyProvider', 'MusicStreamProvider', function (SynchronyProvider, MusicStreamProvider) {
        var playing = false;

        return {
            /// Take a channel.
            /// Considerations:
            ///     The MusicStreamProvider will be initialized: previous instances will be disposed, removing existing streamings.
            take: function ($scope) {
                this.$scope = $scope;
                MusicStreamProvider.initialize();

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
            ///     The client will re-sync with the server.
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

                var currentMusic = SynchronyProvider
                    .take(this.$scope)
                    .sync()
                    .currentMusicOrDefault();

                return this.play(currentMusic);
            },

            /// Play a music with Id=musicId from the this.channel.Musics list.
            /// Considerations:
            ///     If musicId were not provided, it assumes this.channel.CurrentId as replacement.
            ///     Defines a callback to play the next music (constrained by some Channel definitions).
            play: function (musicId) {
                var musicId = musicId || this.$scope.channel.CurrentId;

                // Two musics should never play at once.
                this.stopAll();

                //TODO: use this.stream
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

            /// Asks MusicStreamProvider for the stream of all musics.
            streamAll: function () {
                var channel = this.$scope.channel;

                for (var i in channel.Musics) {
                    var music = channel.Musics[i];
                    this.stream(music);
                }

                return this;
            },

            /// Asks MusicStreamProvider for the stream of the music.
            stream: function (music) {
                var player = this;

                return this;
            },

            fetchAll: function (notify) {
                var channel = this.$scope.channel;

                for (var i in channel.Musics) {
                    var music = channel.Musics[i];
                    this.fetch(music, notify);
                }

                return this;
            },

            fetch: function (music, notify) {
                var player = this;

                // If music was previously loaded, this already happened.
                if (!MusicStreamProvider.wasAlreadyLoaded(music.Id)) {
                    var audio = MusicStreamProvider.fetch(music.Id);

                    // Fetch music's length.
                    audio.addEventListener('loadedmetadata', function () {
                        var duration = audio.duration;
                        player.$scope.$apply(function () {
                            music.LengthInSeconds = duration;
                            player.$scope.fetched++;
                        });
                        MusicStreamProvider.remove(music.Id);
                        if (player.$scope.fetched == 23) MusicStreamProvider.dump();
                        if (notify) notify();
                    }, false);
                }
            }
        };
    }])

samesoundApp
    .factory('SynchronyProvider', ['StatusResource', 'MusicStreamProvider', function (Status, MusicStreamProvider) {
        return {
            take: function ($scope) {
                this.$scope = $scope;
                this._synchronized = false;

                return this;
            },

            sync: function (async) {
                var channel = this.$scope.channel;

                var provider = this;
                var timeframe = new Date();

                Status.now().$promise.then(function (response) {
                    provider.localTime = new Date();

                    // Cristian's algorithm.
                    timeframe = (provider.localTime - timeframe);
                    var delay = timeframe / 2;

                    provider.serverTime = new Date(Date.parse(response.Now));
                    provider.serverTime.setMilliseconds(provider.serverTime.getMilliseconds() + delay);

                    // Define actual current music, given the time elapsed.
                    var channel = provider.$scope.channel;

                    channel.CurrentStartAt = channel.CurrentWait = undefined;

                    var serverTime = provider.serverTime;
                    var startTime = new Date(Date.parse(channel.CurrentStartTime));

                    timeframe = serverTime - startTime;

                    if (timeframe <= 0) {
                        console.log('Music will begin in ' + Math.abs(timeframe) + ' milliseconds.');
                        channel.CurrentWait = Math.abs(timeframe);
                    }
                    else {
                        var spinlock = true;

                        var audio = MusicStreamProvider.audioFromMusicId(channel.CurrentId);
                        audio.addEventListener('loadedmetadata', function () {

                            timeframe -= audio.duration;
                            provider.next();
                            spinlock = false;
                        }, false);

                        while (spinlock);

                        while (timeframe >= channel.Current.LengthInSeconds) {
                            var spinlock = true;




                            while (spinlock);
                        }

                        channel.CurrentStartAt = timeframe;
                    }

                    provider._synchronized = true;
                });

                // If value 'non-blocking' wasn't passed, wait until synchronizing is complete.
                //if (async !== 'non-blocking')
                //    while (this._synchronized == false);

                return this;
            },

            /// Update this.channel.CurrentId to match the next music in the order given by this.channel.Musics list.
            next: function () {
                var musics = this.$scope.channel.Musics;

                var nextIndex = (this.indexOfCurrentMusic() + 1) % musics.length;
                var nextMusic = musics[nextIndex];

                // updates channel's current music propagating change.
                this.channel.Current = nextMusic;
                this.channel.CurrentId = nextMusic.Id;

                return this;
            },

            indexOfCurrentMusic: function () {
                var channel = this.$scope.channel;

                return channel.CurrentId
                    ? this.indexOfMusic(channel.CurrentId)
                    : -1;
            },

            indexOfMusic: function (musicId) {
                var musics = this.$scope.channel.Musics;

                for (var i = 0; i < musics.length; i++)
                    if (musics[i].Id == musicId)
                        return i;
                return -1;
            },

            currentMusicOrDefault: function () {
                var musics = this.$scope.channel.Musics;
                var current = this.currentMusic();

                if (current)
                    return current;

                if (musics.length)
                    return musics[0];

                return null;
            },

            currentMusic: function () {
                var index = this.indexOfCurrentMusic();

                return index > -1
                    ? this.$scope.channel.Musics[index]
                    : null;
            }
        };
    }]);

samesoundApp
    .factory('MusicStreamProvider', [
        '$document', 'config',
        function ($document, config) {
            var audios = {};

            return {
                initialize: function () {
                    return this.dispose();
                },

                dispose: function () {
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
                    return !!audios[musicId.toString()];
                },

                load: function (musicId) {
                    var musicAlreadyStreaming = audios[musicId.toString()];
                    if (musicAlreadyStreaming) {
                        musicAlreadyStreaming.preload = 'auto';
                        return musicAlreadyStreaming;
                    }

                    var audio = $document[0].createElement('audio');

                    audio.src = config.apiUrl + 'Musics/' + musicId + '/Stream';
                    audio.preload = 'auto';

                    return audios[musicId.toString()] = audio;
                },

                fetch: function (musicId) {
                    var musicAlreadyStreaming = audios[musicId.toString()];
                    if (musicAlreadyStreaming) return musicAlreadyStreaming;

                    var audio = $document[0].createElement('audio');

                    audio.src = config.apiUrl + 'Musics/' + musicId + '/Stream';
                    audio.preload = 'metadata';

                    return audios[musicId.toString()] = audio;
                },

                remove: function (musicId) {
                    var audio = audios[musicId.toString()];
                    if (audio) {
                        audio.preload = 'none';
                        audio.url = '';
                        audio.load();

                        delete audios[musicId.toString()];
                    }

                    return true;
                },

                dump: function () {
                    console.log(audios);
                    return this;
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
