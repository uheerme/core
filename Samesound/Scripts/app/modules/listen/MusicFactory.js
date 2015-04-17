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

            /// Start the player, in case it hasn't been started yet (or force start with startegy = 'force-start').
            /// Considerations:
            ///     The client will re-sync with the server.
            ///     The music with Id=this.channel.CurrentId will be played.
            start: function (strategy) {
                if (!this.$scope.channel.CurrentId) {
                    console.log('Channel is currently stalled.');
                    return this;
                }

                if (this.started && strategy !== 'force-start') {
                    console.log('MusicPlayer has already started.');
                    return this;
                }

                var _this = this;
                this.fetchAll(function () {
                    if (_this.$scope.fetched == _this.$scope.channel.Musics.length) {
                        Synchronizer
                            .take(_this.$scope)
                            .sync(function (timeFrame) {
                                _this.play(null, timeFrame);
                            });
                    }
                });

                this.started = true;
                return this;
            },

            /// Play a music with Id=musicId from the this.channel.Musics list.
            /// Considerations:
            ///     If musicId were not provided, it assumes this.channel.CurrentId as replacement.
            ///     Defines a callback to play the next music (constrained by some Channel definitions).
            play: function (music, startAt) {
                var music = music || PlaysetIterator.current();
                if (!music) {
                    console.log('Channel #' + this.$scope.channel.Id + ' doesn\'t have any music on play.');
                    return;
                }

                console.log('Ok! We are about to play ' + music.Id + ': ' + music.Name);

                // Two musics should never play at once.
                this.stopAll();

                // Start streaming it, if it hasn't been done yet.
                var audio = MusicStreamProvider
                    .stream(music.Id);

                // Modifies progress-bar as music progresses.
                var _this = this;
                audio.addEventListener('timeupdate', function () {
                    _this.$scope.$apply(function () {
                        _this.$scope.currentMusicCurrentTime = Math.trunc(audio.currentTime);
                    });
                }, false);

                audio.addEventListener('ended', function () {
                    var next = PlaysetIterator.next()
                    if (next) _this.play(next, 0);
                }, false);

                audio.currentTime = startAt.toFixed(4);
                audio.play();
                _this.playing = true;
                _this.$scope.channel.CurrentId = music.Id;
                _this.$scope.channel.Current = music;

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
                var _this = this;

                MusicStreamProvider.stream(music.Id);

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
        };
    }])

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

                var current = PlaysetIterator.current();

                while (this.timeFrame > current.LengthInSeconds) {
                    this.timeFrame -= current.LengthInSeconds

                    var next = PlaysetIterator.next()
                    if (!next) {
                        channel.CurrentId = null;
                        return this._callback(this.timeFrame);
                    }

                    channel.CurrentId = next.Id
                    current = next

                    // Necessary, as PlaysetIterator.next calls indexOf() which is O(n).
                    var itTimeFrame = new Date() - this.localTime
                    this.localTime.setMilliseconds(this.localTime.getMilliseconds() + itTimeFrame);
                    this.serverTime.setMilliseconds(this.serverTime.getMilliseconds() + itTimeFrame);
                    this.timeFrame -= itTimeFrame / 1000
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
            },

            /// Retrieves the index of the music that is currently being played. If none, returns -1.
            indexOfCurrent: function () {
                var channel = this.channel;

                return channel.CurrentId
                    ? this.indexOf(channel.CurrentId)
                    : -1;
            },

            /// Retrieves the index of the music with Id=musicId. If none, returns -1.
            indexOf: function (musicId) {
                var musics = this.channel.Musics;

                for (var i = 0; i < musics.length; i++)
                    if (musics[i].Id == musicId)
                        return i;
                return -1;
            },

            /// Retrieves the current, if one was defined. Otherwise, returns the first music from channel.Musics playset.
            /// If the playset is empty, returns null.
            currentOrDefault: function () {
                var musics = this.channel.Musics;
                var music = this.current();

                if (music) return music;
                if (musics.length) return musics[0];

                return null;
            },

            /// Retrieves the current music from channel.Musics playset. If none is being played, returns null.
            current: function () {
                var index = this.indexOfCurrent();

                return index > -1
                    ? this.channel.Musics[index]
                    : null;
            },

            /// Checks if the music with Id=musicId is the last in the playset.
            isLastOnList: function (musicId) {
                return this.indexOf(musicId) == this.channel.Musics.length - 1;
            },

            /// Retrieves the next music in the playset.
            /// Consider the next music as the one that follows the current in the channel.Musics list,
            /// or the first one, case the current is also the last in the list.
            next: function () {
                var currentIndex = this.indexOfCurrent();
                if (currentIndex == this.channel.Musics.length - 1 && !this.channel.Loops)
                    return null;

                var nextIndex = (currentIndex + 1) % this.channel.Musics.length;
                return this.channel.Musics[nextIndex];
            }
        }
    });