'use strict';

samesoundApp
    .factory('MusicPlayer', ['Synchronizer', 'MusicStreamProvider', 'PlaysetIterator',
    function (Synchronizer, MusicStreamProvider, PlaysetIterator) {
        return {
            /// Take a $scope.
            /// Considerations:
            ///     The MusicStreamProvider will be initialized: previous instances will be disposed, removing existing streamings.
            take: function ($scope) {
                this.$scope = $scope;

                PlaysetIterator.take($scope.channel);
                MusicStreamProvider.initialize();

                return this;
            },

            /// Mutes the current music acording with the value of shouldBeMuted.
            mute: function (shouldBeMuted) {
                var currentId = this.$scope.channel.CurrentId;

                if (currentId) {
                    var audio = MusicStreamProvider.audioById(currentId);
                    if (audio) audio.muted = shouldBeMuted;
                }

                return this;
            },

            /// Start the player.
            /// Considerations:
            ///     The client will re-sync with the server.
            ///     The music with Id=this.channel.CurrentId will be played.
            start: function () {
                if (!this.$scope.channel.CurrentId) {
                    console.log('Cannot play a channel that is currently stalled.');
                    return this;
                }

                var _this = this;
                this.fetchAll(function () {
                    if (_this.$scope.fetched == _this.$scope.channel.Musics.length) {
                        // Update playset with its default current.
                        PlaysetIterator.updateCurrent();

                        Synchronizer
                            .take(_this.$scope)
                            .sync(function (timeFrame) {
                                _this.play(timeFrame);
                            });
                    }
                });

                return this;
            },

            /// Play a music with Id=musicId from the this.channel.Musics list.
            /// Considerations:
            ///     If musicId were not provided, it assumes this.channel.CurrentId as replacement.
            ///     Defines a callback to play the next music (constrained by some Channel definitions).
            play: function (startAt) {
                var music = this.$scope.channel.Current;
                if (!music) {
                    console.log('Channel #' + this.$scope.channel.Id + ' doesn\'t have any music on play.');
                    return;
                } else {
                    console.log('Channel #' + this.$scope.channel.Id + ' is playing "' + music.Name + '".');
                }

                // Two musics should never play at once.
                this.stopAll();

                // Start streaming it, if it hasn't been done yet.
                var audio = MusicStreamProvider.stream(music.Id);

                startAt = startAt || 0;
                audio.currentTime = startAt.toFixed(4);
                audio.play();
                this.playing = true;

                // Modifies progress-bar as music progresses.
                var _this = this;
                audio.addEventListener('timeupdate', function () {
                    _this.$scope.$apply(function () {
                        _this.$scope.currentMusicCurrentTime = Math.trunc(audio.currentTime);
                    });
                }, false);

                audio.addEventListener('ended', function () {
                    PlaysetIterator.next();
                    _this.play();
                }, false);

                this.streamFollowingMusics(music, 2);

                return this;
            },

            /// Stop all playing audios.
            stopAll: function () {
                for (var index in this.$scope.channel.Musics) {
                    var music = this.$scope.channel.Musics[index];
                    this.stop(music);
                }

                this.playing = false;
                return this;
            },

            /// Stop the audio that makes reference to the music with Id=music.Id.
            stop: function (music) {
                music = music || PlaysetIterator.current();
                if (music) {
                    var audio = MusicStreamProvider.audioById(music.Id);
                    if (audio) audio.pause();

                    if (music.Id == this.$scope.channel.CurrentId)
                        this.playing = false;
                }

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
                var _this = this;

                // If music was previously loaded, this already happened.
                if (!MusicStreamProvider.exists(music.Id)) {
                    var audio = MusicStreamProvider.fetch(music.Id);

                    // Fetch music's length.
                    audio.addEventListener('loadedmetadata', function () {
                        var duration = audio.duration;
                        _this.$scope.$apply(function () {
                            music.LengthInSeconds = duration;
                            _this.$scope.fetched++;
                        });
                        MusicStreamProvider.remove(music.Id);
                        if (notify) notify();
                    }, false);
                }
            },

            streamFollowingMusics: function (music, count) {
                var next = music;
                for (var i = 0; i < count && next; i++) {
                    var next = PlaysetIterator.nextOf(next.Id);
                    if (next) MusicStreamProvider.stream(next.Id);
                }

                return this;
            }
        };
    }]);

samesoundApp
    .factory('Synchronizer', ['StatusResource', 'PlaysetIterator',
    function (Status, PlaysetIterator) {
        return {
            synchronized: function () {
                return this._synchronized;
            },

            take: function ($scope) {
                this.$scope = $scope;
                this._synchronized = false;

                return this;
            },

            sync: function (callback) {
                this._callback = callback
                var channel = this.$scope.channel;

                var _this = this;
                var timeframe = new Date();

                Status.now().$promise.then(function (response) {
                    _this.localTime = new Date();

                    // Cristian's algorithm.
                    timeframe = (_this.localTime - timeframe);
                    var delay = timeframe / 2;

                    _this.serverTime = new Date(Date.parse(response.Now));
                    _this.serverTime.setMilliseconds(_this.serverTime.getMilliseconds() + delay);

                    _this._translatePlayset();
                });

                return this;
            },

            /// Translates all the time-frame gotten from the server and moves 
            /// the stack to the music that is currently being played.
            _translatePlayset: function () {
                var channel = this.$scope.channel;

                var startTime = new Date(Date.parse(channel.CurrentStartTime));
                this.timeFrame = (this.serverTime - startTime) / 1000;

                while (this.timeFrame > channel.Current.LengthInSeconds) {
                    this.timeFrame -= channel.Current.LengthInSeconds

                    PlaysetIterator.next()
                    if (!channel.Current) {
                        return this._callback(this.timeFrame);
                    }
                }

                this._synchronized = true;
                if (this._callback) return this._callback(this.timeFrame);
            }
        };
    }]);

samesoundApp
    .factory('MusicStreamProvider', [
        '$document', 'config',
        function ($document, config) {
            return {
                initialize: function () {
                    return this.dispose();
                },

                dispose: function () {
                    // Stop streaming and pause all audios. Finally, remove their references for good.
                    if (this._streams) {
                        var musicIds = Object.keys(this._streams);
                        for (var i in musicIds) {
                            this.remove(musicIds[i]);
                        }
                    }

                    this._streams = {};
                    return this;
                },

                audioById: function (musicId) {
                    return this._streams[musicId.toString()];
                },

                exists: function (musicId) {
                    return this.audioById(musicId) != null;
                },

                stream: function (musicId) {
                    var audio = this._createOrRetrieve(musicId);
                    audio.preload = 'auto';

                    return audio;
                },

                fetch: function (musicId) {
                    var audio = this._createOrRetrieve(musicId);
                    audio.preload = 'metadata';

                    return audio;
                },

                /// Creates or retrieves a audio element that streams the music with Id=musicId.
                _createOrRetrieve: function (musicId) {
                    var musicAlreadyStreaming = this._streams[musicId.toString()];
                    if (musicAlreadyStreaming) return musicAlreadyStreaming;

                    var audio = $document[0].createElement('audio');
                    audio.src = config.apiUrl + 'Musics/' + musicId + '/Stream';

                    return this._streams[musicId.toString()] = audio;
                },

                /// Remove a music from the streaming list.
                remove: function (musicId) {
                    var audio = this._streams[musicId.toString()];
                    if (!audio) return false;

                    audio.pause();
                    audio.preload = 'none';
                    audio.src = '';

                    delete this._streams[musicId.toString()];
                    return true;
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

samesoundApp
    .factory('PlaysetIterator', function () {
        return {
            take: function (channel) {
                this.channel = channel;

                return this;
            },

            /// Retrieves the index of the music with Id=musicId. If none, returns -1.
            indexOf: function (musicId) {
                var musics = this.channel.Musics;

                for (var i = 0; i < musics.length; i++)
                    if (musics[i].Id == musicId)
                        return i;

                return -1;
            },

            /// Retrieves the next music that follows the one with Id=musicId.
            nextOf: function (musicId) {
                var musicIndex = this.indexOf(musicId);
                if (musicIndex == this.channel.Musics.length - 1 && !this.channel.Loops)
                    return null;

                return this.channel.Musics[(musicIndex + 1) % this.channel.Musics.length];
            },

            // Forces the fillment of CurrentIndex and Current attributes in this.channel.
            updateCurrent: function () {
                if (this.channel.CurrentId) {
                    var musicIndex = -1;
                    var music = null;
                    for (var i = 0; i < this.channel.Musics.length; i++) {
                        if (this.channel.Musics[i].Id == this.channel.CurrentId) {
                            musicIndex = i;
                            music = this.channel.Musics[i];
                        }
                    }

                    this.channel.CurrentIndex = musicIndex;
                    this.channel.Current = music;
                }

                return this;
            },

            /// Set the next music as the current of the playset.
            /// Consider the next music as the one that follows the current in the channel.Musics list,
            /// or the first one, case the current is also the last in the list.
            next: function () {
                if (this.channel.CurrentIndex > -1) {
                    if (this.channel.CurrentIndex == this.channel.Musics.length - 1 && !this.channel.Loops) {
                        this.channel.CurrentId = null;
                        this.channel.Current = null;
                    } else {
                        var nextMusicIndex = (this.channel.CurrentIndex + 1) % this.channel.Musics.length;

                        var nextMusic = this.channel.Musics[nextMusicIndex];

                        this.channel.CurrentIndex = nextMusicIndex;
                        this.channel.CurrentId = nextMusic.Id;
                        this.channel.Current = nextMusic;
                    }
                }

                return this;
            }
        }
    });