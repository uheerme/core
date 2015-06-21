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

            /// Stop all songs tags and unbind our re-sync service.
            dispose: function () {
                this.stopResyncTask();
                this.stopAll();

                return this;
            },

            /// Mutes the current music acording with the value of shouldBeMuted.
            mute: function (shouldBeMuted) {
                this._muted = shouldBeMuted;

                if (this.$scope.channel.Current) {
                    var audio = MusicStreamProvider.audioById(this.$scope.channel.Current.Id);
                    if (audio) audio.muted = shouldBeMuted;
                }

                return this;
            },

            /// Start the player.
            /// Considerations:
            ///     The client will re-sync with the server.
            ///     The music with Id=this.channel.CurrentId will be played.
            start: function () {
                this.dispose();

                if (!this.$scope.channel.CurrentId) {
                    console.log('MusicPlayer: cannot play a channel that is currently stalled.');
                    return this;
                }

                console.log('MusicPlayer: Let\'s hear the playset in channel ' + this.$scope.channel.Name + '!');

                this.$scope.loading = true;

                var _this = this;
                var initialMusic = this.$scope.channel.Current;
                if (!initialMusic) {
                    console.log('MusicPlayer: the music {' + this.$scope.channel.currentId + '} could not be found.'
                                + ' There is a issue with this channel.');
                    return this;
                }

                this.$scope.loading = false;

                // Synchronize with server and then play.
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
                var _this = this;
                var music = this.$scope.channel.Current;
                if (!music) {
                    console.log('MusicPlayer: channel #' + this.$scope.channel.Id + ' doesn\'t have any music on play.');
                    return;
                }

                console.log('MusicPlayer: channel #' + this.$scope.channel.Id
                           + ' will play "' + music.Name
                           + '", starting at ' + (startAt || 0) + '.');

                this.$scope.isPlaying = true;
                this.$scope.currentMusic = music;

                // Two musics should never play at once.
                this.stopAll();

                // Start streaming it, if it hasn't been done yet.
                var audio = this.audioOnPlay = MusicStreamProvider.stream(music.Id);

                try {
                    audio.currentTime = (startAt).toFixed(4);
                    audio.muted = this._muted;
                    audio.play();
                    this.playing = true;
                    console.log('MusicPlayer: the music has started synchronously!');
                } catch (e) {
                    var play_handler;
                    var preparationFrame = new Date();
                    audio.addEventListener('canplay', play_handler = function () {
                        preparationFrame = (new Date() - preparationFrame) / 1000;

                        console.log('MusicPlayer: the music has started asynchronously! The preparation frame was ' + preparationFrame + 's');

                        audio.currentTime = (startAt + preparationFrame).toFixed(4);
                        audio.muted = this._muted;
                        audio.play();
                        this.playing = true;

                        audio.removeEventListener('canplay', play_handler)
                    });
                }


                // Modifies progress-bar as music progresses.
                audio.ontimeupdate = null;

                var update_handler;
                audio.addEventListener('timeupdate', update_handler = function () {
                    if (_this.audioOnPlay) {
                        _this.$scope.$apply(function () {
                            _this.$scope.currentTime = ~~_this.audioOnPlay.currentTime;
                            _this.$scope.progressPercentage
                                = ~~(100000 * _this.audioOnPlay.currentTime / _this.$scope.channel.Current.LengthInMilliseconds) + '%';
                        });
                    }
                }, false);

                var remove_handler;
                audio.addEventListener('ended', remove_handler = function () {
                    console.log('MusicPlayer: ' + music.Name + ' ended.');
                    _this.stopResyncTask();

                    _this.$scope.isPlaying = false;
                    _this.audioOnPlay = null;

                    audio.removeEventListener('timeupdate', update_handler);
                    audio.removeEventListener('ended', remove_handler);

                    Synchronizer.translatePlayset();
                }, false);

                this.startResyncTask();

                return this.streamFollowingMusics(music, 2);
            },

            /// Stop all playing audios.
            stopAll: function () {
                for (var index in this.$scope.channel.Musics) {
                    var music = this.$scope.channel.Musics[index];
                    this.stop(music);
                }

                this.playing = false;

                // Unbind continuous synchronization service.

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

            maxTolerableDelayInMilliseconds: 80,
            resyncPeriodInSeconds: 10,
            startResyncTask: function () {
                // Start synchronization service, if it hasn't yet.
                var _this = this;
                if (!this._resyncTaskHandler)
                    this._resyncTaskHandler = setInterval(
                        function () { _this.resyncTask(); },
                        _this.resyncPeriodInSeconds * 1000);
            },
            stopResyncTask: function () {
                if (this._resyncTaskHandler) {
                    clearInterval(this._resyncTaskHandler);
                    this._resyncTaskHandler = null;
                }
            },
            resyncTask: function () {
                var channel = this.$scope.channel;
                var current = channel.Current;

                try {
                    var expectedPosition = Synchronizer.remoteTime() - channel.CurrentStartTime;
                    var actualPosition = this.audioOnPlay.currentTime * 1000;
                    var delay = ~~(expectedPosition - actualPosition);

                    console.log('MusicPlayer: estimated sync offset is ' + delay + 'ms')

                    if (Math.abs(delay) < this.maxTolerableDelayInMilliseconds) {
                        console.log('MusicPlayer: re-synchronization canceled.');
                        return;
                    }

                    this.audioOnPlay.currentTime = expectedPosition / 1000;

                    console.log('MusicPlayer: re-synchronization finished. Position time set to ' + ~~this.audioOnPlay.currentTime + 's');
                } catch (e) {
                    console.error(e);
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
            take: function ($scope) {
                this.$scope = $scope;
                return this;
            },

            /// Define a function to be called when 
            /// the synchronization procedure has finished.
            onSynchronized: function (callback) {
                this._callback = callback;
                return this;
            },

            sync: function () {
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
                    console.log('Synchronizer: Cristian\'s time-frame was ' + timeframe + 'ms');
                    _this.differenceBetweenRemoteAndLocal = remoteTime - localTime;
                    _this.translatePlayset();
                });

                return this;
            },

            remoteTime: function () {
                var _remoteTime = new Date()
                _remoteTime.setMilliseconds(_remoteTime.getMilliseconds() + this.differenceBetweenRemoteAndLocal);

                return _remoteTime;
            },

            /// Translates all the time-frame gotten from the server and moves 
            /// the stack to the music that is currently being played.
            translatePlayset: function () {
                console.log('Synchronizer: playset translation procedure has started');

                var channel = this.$scope.channel;

                var remoteTime = new Date();
                remoteTime.setMilliseconds(remoteTime.getMilliseconds() + this.differenceBetweenRemoteAndLocal);

                var timeline = remoteTime - channel.CurrentStartTime;

                if (timeline > this._channelsLength && !channel.Loops) {
                    PlaysetIterator.kill();
                    return
                }

                // The channel may have looped already and the cycle would put us in the exact same spot.
                // We don't need to iterate throughout the entire list to check this. Instead, let's just consider the last one.
                if (this._channelsLength) {
                    var loopsCount = ~~(timeline / this._channelsLength);
                    channel.CurrentStartTime.setMilliseconds(channel.CurrentStartTime.getMilliseconds() + this._channelsLength * loopsCount);
                    timeline %= this._channelsLength;
                }

                while (timeline > channel.Current.LengthInMilliseconds) {
                    timeline -= channel.Current.LengthInMilliseconds;

                    PlaysetIterator.next();
                    if (!channel.Current) {
                        PlaysetIterator.kill();
                        return
                    }
                }

                console.log('Synchronizer: ' + channel.Current.Name + ' is the current music');

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

                    this._streams = {};
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

                    console.log('MusicStreamProvider: streaming music #' + musicId);

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
                    console.log('PlaysetIterator: end of ' + this._channel.Name + ' \'s playlist reached.');
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
    .factory('MusicUploader',
        ['$upload', '$document', 'config', 'Validator',
        function ($upload, $document, config, Validator) {
            return {
                _uploads: [],
                _waiting: [],

                maxConcomitantUploads: 3,
                formatsAllowed: ['mp3', 'wav', 'ogg', 'oga'],

                isUploadingQueueFull: function () {
                    return this._uploads.length >= this.maxConcomitantUploads;
                },
                isFileFormatAllowed: function (format) {
                    return this.formatsAllowed.indexOf(format) > -1;
                },
                canFileBeUploaded: function (file) {
                    var format = file.type.split('/')[1];

                    return file && file.status != 'preparing' && file.status != 'uploading' && file.status != 'uploaded'
                        && this.isFileFormatAllowed(format);
                },

                take: function ($scope) {
                    this.$scope = $scope;
                },

                cancel: function (file) {
                    if (file.status != 'uploading') {
                        toastr.warning('Cannot cancel a file that is not being uploaded.');
                        return false;
                    }

                    file.uploadReference.abort();
                    file.status = 'canceled';

                    var indexOf = this._uploads.indexOf(file);
                    if (indexOf > -1) this._uploads.splice(indexOf, 1);

                    return true;
                },
                remove: function (file) {
                    if (file.status == 'preparing' || file.status == 'uploading') {
                        toastr.warning('Cancel this upload before removing it from the list.');
                        return false;
                    }

                    var removed = false;
                    var indexOf = this._waiting.indexOf(file);
                    if (indexOf > -1) {
                        this._waiting.splice(indexOf, 1);
                        removed = true;
                    }

                    indexOf = this.$scope.filesToBeUploaded.indexOf(file);
                    if (indexOf > -1) {
                        this.$scope.filesToBeUploaded.splice(indexOf, 1);
                        removed = true;
                    }

                    return removed;
                },
                uploadMany: function (files) {
                    for (var index in files) {
                        this.upload(files[index]);
                    }
                },
                upload: function (file) {
                    if (!this.canFileBeUploaded(file)) {
                        console.log('MusicUploader: invalid attempt to upload file.');
                        return false;
                    }

                    if (this.isUploadingQueueFull()) {
                        file.status = 'waiting';
                        var indexOf = this._waiting.indexOf(file);
                        if (indexOf == -1) this._waiting.push(file);
                        return false;
                    }

                    console.log('MusicUploader: preparing to upload ' + file.uploadName);

                    file.status = 'preparing';

                    var newMusic = {
                        'Name': file.uploadName,
                        'ChannelId': this.$scope.channel.Id,
                        'LengthInMilliseconds': 0
                    }

                    // Load the file in order to retrieve its duration.
                    var audio = $document[0].createElement('audio');
                    audio.src = URL.createObjectURL(file);

                    this._uploads.push(file);

                    // Wait for audio metadata to load.
                    var _this = this;
                    audio.addEventListener('loadedmetadata', function () {
                        console.log('MusicUploader: ' + file.uploadName + ' metadata loaded');

                        file.status = 'uploading';
                        newMusic.LengthInMilliseconds = (audio.duration * 1000).toFixed(0);

                        file.uploadReference = $upload.upload({
                            url: config.apiUrl + 'Musics',
                            file: file,
                            fields: newMusic

                        }).progress(function (evt) {
                            file.progress = parseInt(100.0 * evt.loaded / evt.total);

                        }).success(function (music, status) {
                            file.status = 'uploaded';

                            _this.$scope.channel.Musics.push(music);
                            toastr.success(music.Name + ' uploaded!');

                        }).error(function (data, status, headers, config) {
                            file.status = 'failed';

                            console.log(data);
                            Validator.
                                take(data).
                                toastErrors().
                                otherwiseToastError();

                        }).finally(function () {
                            _this.remove(file);

                            var indexOf = _this._uploads.indexOf(file);
                            if (indexOf > -1) _this._uploads.splice(file, 1);


                            if (_this._waiting.length > 0) {
                                file = _this._waiting.shift();
                                _this.upload(file);
                            }
                        });
                    }, false);

                    return true;
                }
            };
        }]);

UheerApp
    .run(['$rootScope', 'MusicStreamProvider', 'MusicPlayer', function ($rootScope, MusicStreamProvider, MusicPlayer) {
        $rootScope.$on("$stateChangeStart", function (event, toState, toParams, fromState, fromParams) {
            // Asserts behavior: player will stop if user move to another page.
            if (fromState.name == 'listen/:id') {
                MusicPlayer.dispose();
                MusicStreamProvider.dispose();
            }
        });
    }]);
