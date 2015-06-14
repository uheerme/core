'use strict';

UheerApp
    .factory('MusicPlayer', ['Synchronizer', 'MusicStreamProvider', 'PlaysetIterator',
    function (Synchronizer, MusicStreamProvider, PlaysetIterator) {
        return {
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
                var initialMusic = this.$scope.channel.Current;
                if (!initialMusic) {
                    console.log('The music {' + this.$scope.channel.currentId + '} could not be found. There is a issue with this channel.');
                }

                this.$scope.loading = false;

                Synchronizer
                    .take(this.$scope)
                    .onSynchronized(function (timeFrame) {
                        _this.play(timeFrame);
                    })
                    .sync();

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
                }

                console.log('Channel #' + this.$scope.channel.Id + ' will play "' + music.Name + '", starting at ' + (startAt || 0) + '.');
                this.$scope.isPlaying = true;

                this.$scope.currentMusic = music;

                // Two musics should never play at once.
                this.stopAll();

                // Start streaming it, if it hasn't been done yet.
                var audio = this.audioOnPlay = MusicStreamProvider.stream(music.Id);

                var play_handler;
                audio.addEventListener('canplay', play_handler = function () {
                    audio.currentTime = startAt.toFixed(4);
                    audio.muted = this._muted;
                    audio.play();
                    this.playing = true;

                    audio.removeEventListener('canplay', play_handler)
                });

                var _this = this;

                //if (this._continuousSyncHandler)
                //    clearInterval(this._continuousSyncHandler);
                //this._continuousSyncHandler = setInterval(function () {
                //    _this.continuousSync();
                //}, 5 * 1000);

                // Modifies progress-bar as music progresses.
                audio.ontimeupdate = null;

                var update_handler;
                audio.addEventListener('timeupdate', update_handler = function () {
                    if (_this.audioOnPlay) {
                        _this.$scope.$apply(function () {
                            _this.$scope.currentMusicCurrentTime = Math.trunc(_this.audioOnPlay.currentTime);
                        });
                    }
                }, false);

                var remove_handler;
                audio.addEventListener('ended', remove_handler = function () {
                    _this.$scope.isPlaying = false;
                    _this.audioOnPlay = null;

                    audio.removeEventListener('timeupdate', update_handler);
                    audio.removeEventListener('ended', remove_handler);

                    Synchronizer.translatePlayset();
                }, false);

                return this.streamFollowingMusics(music, 2);
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
                var channel = this.$scope.channel;

                music = music || channel.Current;
                if (music) {
                    var audio = MusicStreamProvider.audioById(music.Id);
                    if (audio) {
                        audio.pause();
                        audio.oncanplay = audio.ontimeupdate = audio.onended = null;
                    }

                    if (music == channel.Current)
                        this.playing = false;
                }

                return this;
            },

            continuousSync: function () {
                console.log('Synchronization attempt...');
                console.log(this.audioOnPlay);

                if (this.audioOnPlay) {
                    //
                }
            },

            streamFollowingMusics: function (music, count) {
                var next = music;
                for (var i = 0; i < count && next; i++) {
                    var next = PlaysetIterator.peak(1);
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
            onSynchronized: function (callback) {
                this._callback = callback;
                return this;
            },

            take: function ($scope) {
                this.$scope = $scope;
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
                    var localTime = new Date();

                    // Cristian's algorithm.
                    timeframe = localTime - timeframe;
                    var delay = timeframe / 2;

                    var remoteTime = new Date(Date.parse(response.Now));
                    remoteTime.setMilliseconds(remoteTime.getMilliseconds() + delay);

                    console.log('The synchronization time-frame was ' + timeframe + '.');
                    _this.differenceBetweenRemoteAndLocal = remoteTime - localTime;
                    _this.translatePlayset();
                });

                return this;
            },

            /// Translates all the time-frame gotten from the server and moves 
            /// the stack to the music that is currently being played.
            translatePlayset: function () {
                console.log('Playset translation procedure has started.');

                var channel = this.$scope.channel;

                var currentStartTime = channel.CurrentStartTime;
                var remoteTime = new Date();
                remoteTime.setMilliseconds(remoteTime.getMilliseconds() + this.differenceBetweenRemoteAndLocal);

                var timeline = remoteTime - channel.CurrentStartTime;

                if (timeline > this._channelsLength && !channel.Loops) {
                    PlaysetIterator.kill();
                    return
                }

                // The channel may have looped already and the cycle would put us in the exact same spot.
                // We don't need to iterate throughout the entire list to check this. Instead, let's just consider the last one.
                if (this._channelsLength) timeline %= this._channelsLength;

                while (timeline > channel.Current.LengthInMilliseconds) {
                    timeline -= channel.Current.LengthInMilliseconds;

                    PlaysetIterator.next();
                    if (!channel.Current) {
                        PlaysetIterator.kill();
                        return
                    }
                }

                console.log('Translation procedure found ' + channel.Current.Name + '(' + channel.Current.Id + ') as current music.');

                this.$scope.synchronized = true;

                // If there is a callback, invoke it passing the timeline in seconds, which represents the current position of the song's playment.
                if (this._callback) return this._callback(timeline / 1000);
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
        }]);

UheerApp
    .factory('PlaysetIterator', function () {
        return {
            take: function (channel) {
                this._channel = channel;

                // No music is currently being played.
                if (!this._channel.CurrentId) {
                    this._channel.Current = null;
                    this._channel.CurrentIndex = -1;
                    return this;
                }

                // Find the current music.
                this._channel.CurrentIndex = this.indexOf(this._channel.CurrentId);
                this._channel.Current = this._channel.Musics[this._channel.CurrentIndex];

                return this;
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

            /// Set the next music as the current of the playset.
            /// Consider the next music as the one that follows the current in the channel.Musics list,
            /// or the first one, case the current is also the last in the list.
            next: function () {
                // There isn't a next if there is not a current.
                if (this._channel.CurrentIndex == -1) {
                    return this;
                }

                if (this._channel.CurrentIndex == this._channel.Musics.length - 1 && !this._channel.Loops) {
                    console.log('Iterator has reached end of ' + this._channel.Name + ' \'s playlist.');
                    this._channel.Current = null;
                    return this;
                }

                var nextIndex = (this._channel.CurrentIndex + 1) % this._channel.Musics.length;
                var nextMusic = this._channel.Musics[nextIndex];

                this._channel.CurrentStartTime.setMilliseconds(
                    this._channel.CurrentStartTime.getMilliseconds() + this._channel.Current.LengthInMilliseconds)

                this._channel.CurrentIndex = nextIndex;
                this._channel.Current = nextMusic;

                return this;
            },

            /// Peak the next music of the channel.
            /// Take the music that's currently being played as starting point.
            /// @param count: the count(th) music, from the current, to be peaked. If no argument was passed, assume 0.
            peak: function (count) {
                // There isn't a next if there is not a current or if we've reached the end of the list.
                if (this._channel.CurrentIndex == -1
                    || this._channel.CurrentIndex == this._channel.Musics.length - 1 && !this._channel.Loops) {
                    return null;
                }

                return this._channel.Musics[(this._channel.CurrentIndex + (count || 0)) % this._channel.Musics.length];
            },

            /// Set current music to null, forcing the channel to stop.
            kill: function () {
                this._current = null;
                this._currentIndex = -1;
            }
        }
    });

UheerApp
    .run(['$rootScope', 'MusicStreamProvider', 'MusicPlayer', function ($rootScope, MusicStreamProvider, MusicPlayer) {
        $rootScope.$on("$stateChangeStart", function (event, toState, toParams, fromState, fromParams) {
            // Asserts behavior: player will stop if user move to another page.
            if (fromState.name == 'listen/:id') {
                MusicPlayer.stopAll();
                MusicStreamProvider.dispose();
            }
        });
    }]);
