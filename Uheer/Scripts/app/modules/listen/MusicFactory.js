'use strict';

UheerApp
    .factory('MusicPlayer', ['Synchronizer', 'MusicStreamProvider', 'PlaysetIterator',
    function (Synchronizer, MusicStreamProvider, PlaysetIterator) {
        return {
            _resyncClock: 1 * 10 * 1000,    //  1 minute.
            _acceptableSyncDifference: 100, // 100 milliseconds.

            /// Take a $scope.
            /// Considerations: The MusicStreamProvider will be initialized and previous instances will be disposed, removing existing streamings.
            take: function ($scope) {
                this._muted = false;

                this.$scope = $scope;

                PlaysetIterator.take($scope.channel);
                MusicStreamProvider.initialize();

                return this;
            },

            /// Mutes the current music acording with the value of shouldBeMuted.
            mute: function (shouldBeMuted) {
                this._muted = shouldBeMuted;

                var current = PlaysetIterator.current();
                if (current) {
                    var audio = MusicStreamProvider.audioById(current.Id);
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

                console.log('Let\'s hear the playset in channel ' + this.$scope.channel.Name + '!');

                this.$scope.loading = true;

                var _this = this;
                var initialMusic = PlaysetIterator.restoreOriginalCurrent().current();
                if (!initialMusic) {
                    console.log('The music {' + this.$scope.channel.currentId + '} could not be found. There is a issue with this channel.');
                }

                this.$scope.loading = false;

                Synchronizer
                    .take(this.$scope)
                    .onSynced(function (timeFrame) { _this.play(timeFrame); })
                    .sync();

                return this;
            },

            /// Play a music with Id=musicId from the this.channel.Musics list.
            /// Considerations:
            ///     If musicId were not provided, it assumes this.channel.CurrentId as replacement.
            ///     Defines a callback to play the next music (constrained by some Channel definitions).
            play: function (startAt) {
                var music = PlaysetIterator.current();
                if (!music) {
                    console.log('Channel #' + this.$scope.channel.Id + ' doesn\'t have any music on play.');
                    return;
                }

                console.log('Channel #' + this.$scope.channel.Id + ' will play "' + music.Name + '", starting at ' + (startAt || 0) + '.');
                this.$scope.isPlaying = true;

                this.$scope.currentMusic = music;

                // Two musics should never play at once.
                this.stopAll();

                // Start streaming it, if it hasn't been done yet.
                var audio = MusicStreamProvider.stream(music.Id);

                startAt = startAt || 0;
                audio.currentTime = startAt.toFixed(4);
                audio.muted = this._muted;
                audio.play();
                this.playing = true;

                /// Start continuous syncing.
                var _this = this;
                this._resync = setInterval(function () {
                    console.log('Resyncing...');
                    PlaysetIterator.restoreOriginalCurrent();
                    Synchronizer
                        .translatePlayset(function (timeframe) {
                            var difference = 1000 * Math.abs(audio.currentTime - timeframe);

                            console.log('Audio\'s current position differs from sync suggestion by '
                                        + difference + 'ms. Acceptable range is '
                                        + _this._acceptableSyncDifference + 'ms.');

                            if (difference > _this._acceptableSyncDifference) {
                                console.log('Hold on, re-synchronization is about to happen...');
                                _this.play(timeframe);
                            } else {
                                console.log('Re-synchronization cancelled.');
                            }
                        });
                }, this._resyncClock);

                // Modifies progress-bar as music progresses.
                audio.addEventListener('timeupdate', function () {
                    _this.$scope.$apply(function () {
                        _this.$scope.currentMusicCurrentTime = Math.trunc(audio.currentTime);
                    });
                }, false);

                audio.addEventListener('loadedmetadata', function () {
                    /// Interrupts continuous syncing.
                    clearInterval(_this._resync);
                    _this._resync = null;

                    PlaysetIterator.restoreOriginalCurrent();
                    Synchronizer.translatePlayset();
                }, false);

                audio.addEventListener('ended', function () {
                    _this.$scope.isPlaying = false;

                    PlaysetIterator.restoreOriginalCurrent();
                    Synchronizer.translatePlayset();
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
                var current = PlaysetIterator.current();

                music = music || current;
                if (music) {
                    var audio = MusicStreamProvider.audioById(music.Id);
                    if (audio)
                        audio.pause();

                    if (music == current) {
                        clearInterval(this._resync);
                        this._resync = null;

                        this.playing = false;
                    }
                }

                return this;
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

UheerApp
    .factory('Synchronizer', ['StatusResource', 'PlaysetIterator',
    function (Status, PlaysetIterator) {
        return {
            synchronized: function () {
                return this.$scope.synchronized;
            },

            take: function ($scope) {
                this.$scope = $scope;

                return this;
            },

            updateSynchronizedTime: function () {
                var now = new Date();
                var timeframe = now - this.localTime;

                this.localTime = now;
                this.serverTime.setMilliseconds(this.serverTime.getMilliseconds() + timeframe);

                return this;
            },

            onSynced: function (callback) {
                this._callback = callback;
                return this;
            },

            sync: function () {
                console.log('Synchronization procedure method has started.');
                this.$scope.synchronized = false;

                var channel = this.$scope.channel;

                // Let's find the channel's length. This information will help us optimizing the
                // sync operation performance when the channel has been on for many hours.
                this._channelsLength = 0;
                for (var i in channel.Musics) this._channelsLength += channel.Musics[i].LengthInMilliseconds;

                var _this = this;
                var timeframe = new Date();

                Status.now().$promise.then(function (response) {
                    _this.localTime = new Date();

                    // Cristian's algorithm.
                    timeframe = (_this.localTime - timeframe);
                    var delay = timeframe / 2;

                    _this.serverTime = new Date(Date.parse(response.Now));
                    _this.serverTime.setMilliseconds(_this.serverTime.getMilliseconds() + delay);

                    console.log('The synchronization time-frame was ' + timeframe + 'ms.');
                    _this.timeframe = timeframe;

                    _this.translatePlayset();
                });

                return this;
            },

            /// Translates all the time-frame gotten from the server and moves 
            /// the stack to the music that is currently being played.
            translatePlayset: function (callback) {
                var channel = this.$scope.channel;

                this.$scope.synchronized = false;

                this.updateSynchronizedTime();

                var startTime = new Date(Date.parse(channel.CurrentStartTime));
                var timeline = (this.serverTime - startTime);
                console.log('The timeline that will be translated is ' + timeline + 'ms.');

                if (timeline > this._channelsLength && !channel.Loops) {
                    PlaysetIterator.kill();
                    return this._callback(timeline);
                }

                // The channel may have looped already and the cycle would put us in the exact same spot.
                // We don't need to iterate throughout the entire list to check this. Instead, let's just consider the last one.
                if (this._channelsLength)
                    timeline %= this._channelsLength;

                var current = PlaysetIterator.current();

                while (timeline > current.LengthInMilliseconds) {
                    timeline -= current.LengthInMilliseconds;

                    var current = PlaysetIterator.next().current();
                    if (!current) {
                        return this._callback(timeline);
                    }
                }

                this.$scope.synchronized = true;

                // If there is a callback, invoke it passing the timeline in seconds, which represents the current position of the song's playment.
                if (callback)
                    callback(timeline / 1000);
                else if (this._callback)
                    this._callback(timeline / 1000);

                return this;
            }
        };
    }]);

UheerApp
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

                    this._streams = {
                    };
                    return this;
                },

                audioById: function (musicId) {
                    return this._streams[musicId.toString()];
                },

                exists: function (musicId) {
                    return this.audioById(musicId) != null;
                },

                /// Creates or retrieves a audio element that streams the music with Id=musicId.
                stream: function (musicId) {
                    var musicAlreadyStreaming = this._streams[musicId.toString()];
                    if (musicAlreadyStreaming) return musicAlreadyStreaming;

                    console.log('Starting to stream music #' + musicId + '.');

                    var audio = $document[0].createElement('audio');
                    audio.src = config.apiUrl + 'Musics/' + musicId + '/Stream';
                    audio.preload = 'auto';

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
    .run(['$rootScope', 'MusicPlayer', 'MusicStreamProvider', function ($rootScope, MusicPlayer, MusicStreamProvider) {
        $rootScope.$on("$stateChangeStart", function (event, toState, toParams, fromState, fromParams) {
            // Asserts behavior: player will stop if user move to another page.
            if (fromState.name == 'listen/:id') {
                MusicPlayer.stopAll();
                MusicStreamProvider.dispose();
            }
        });
    }]);

UheerApp
    .factory('PlaysetIterator', function () {
        return {
            take: function (channel) {
                this._channel = channel;
                this._originalCurrentIndex = -1;

                if (this._channel.CurrentId) {
                    for (var i in this._channel.Musics) {
                        if (this._channel.Musics[i].Id == this._channel.CurrentId) {
                            this._originalCurrentIndex = i;
                            break;
                        }
                    }
                }

                return this.restoreOriginalCurrent();
            },

            /// Retrieves the index of the music with Id=musicId. If none, returns -1.
            /// Please avoid using this method, considering it iterates through the entire list.
            indexOf: function (musicId) {
                var musics = this._channel.Musics;

                for (var i = 0; i < musics.length; i++)
                    if (musics[i].Id == musicId)
                        return i;

                return -1;
            },

            /// Retrieves the next music that follows the one with Id=musicId.
            /// Please avoid using this method, considering it iterates through the entire list.
            nextOf: function (musicId) {
                var musicIndex = this.indexOf(musicId);
                if (musicIndex == this._channel.Musics.length - 1 && !this._channel.Loops)
                    return null;

                return this._channel.Musics[(musicIndex + 1) % this._channel.Musics.length];
            },

            /// Define which music is the current based on Channel.CurrentId.
            restoreOriginalCurrent: function () {
                this._currentIndex = this._originalCurrentIndex;

                return this;
            },

            /// Retrieve current music.
            current: function () {
                return this._currentIndex > -1
                       ? this._channel.Musics[this._currentIndex]
                       : null
                ;
            },

            /// Set the next music as the current of the playset.
            /// Consider the next music as the one that follows the current in the channel.Musics list,
            /// or the first one, case the current is also the last in the list.
            next: function () {
                if (this._currentIndex > -1) {
                    if (this._currentIndex < this._channel.Musics.length - 1 || this._channel.Loops) {
                        /// Go to next music.
                        this._currentIndex = (this._currentIndex + 1) % this._channel.Musics.length;
                    }
                    else {
                        console.log('Iterator has reached end of list.');
                        this._currentIndex = -1;
                    }
                }

                return this;
            },

            /// Set current music to null, forcing the channel to stop.
            kill: function () {
                this._current = null;
                this._currentIndex = -1;
            }
        }
    });