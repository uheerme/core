
UheerApp.controller(
    'ChannelDashboardController',
    ['$http', '$scope', '$upload', '$document', 'config', 'channel', 'Validator',
        function ($http, $scope, $upload, $document, config, channel, Validator) {

            $scope.channel = channel;

            $scope.toogleLoop = function () {
                $scope.channel.Loops = !$scope.channel.Loops;
                $scope.channel.$update(
                    function (updatedChannel) {
                        toastr.success(
                            updatedChannel.Name + ' will now ' +
                            (updatedChannel.Loops ? 'loop at the end of the track' : 'stop at the end of the track.'),
                            'Saved!'
                        )
                    },
                    function (error) {
                        console.log(error);
                        Validator.
                            take(error).
                            toastErrors().
                            otherwiseToastError();
                    }
                );
            }

            $scope.play = function (musicId) {
                if (!$scope.channel.Musics.length) {
                    toastr.warning('You can\'t start a empty playlist. Add some musics first.', 'Ops!');
                    return;
                }

                musicId = musicId || $scope.channel.Musics[0].Id;

                $http
                    .post(config.apiUrl + 'Channels/' + $scope.channel.Id + '/Play/' + musicId)
                    .success(function (data) {
                        $scope.channel.CurrentId = data.CurrentId;
                        $scope.channel.CurrentStartTime = data.CurrentStartTime;
                    })
                    .error(function (error) {
                        console.log(error);
                        Validator.
                            take(error).
                            toastErrors().
                            otherwiseToastError();
                    })
            }

            $scope.removeFromUploadList = function (file) {
                var indexOf = $scope.files.indexOf(file);
                $scope.files.splice(indexOf, 1);
            }

            $scope.cancel = function (file) {
                if (file.uploading) {
                    console.log('Cannot cancel a file that is not being uploaded.');
                    return false;
                }

                file.uploadReference.abort();
                file.upload = false;
                return true;
            }

            $scope.uploadAll = function () {
                for (var index in $scope.files) {
                    $scope.upload($scope.files[index]);
                }
            }

            $scope.upload = function (file) {
                if (!file) {
                    console.log('Cannot upload invalid file.');
                    return false;
                }
                if (file.uploading) {
                    console.log('Cannot upload same file twice.');
                    return false;
                }

                console.log('Preparing to upload {' + file.uploadName + '}');

                var newMusic = {
                    'Name': file.uploadName,
                    'ChannelId': channel.Id,
                    'LengthInMilliseconds': 0
                }

                // Load the file in order to retrieve its duration.
                var audio = $document[0].createElement('audio');
                audio.src = URL.createObjectURL(file);

                // Wait for audio metadata to load.
                audio.addEventListener('loadedmetadata', function () {
                    console.log('Metadata loaded for {' + file.uploadName + '}');

                    newMusic.LengthInMilliseconds = (audio.duration * 1000).toFixed(0);

                    file.uploading = true;

                    file.uploadReference = $upload.upload({
                        url: config.apiUrl + 'Musics',
                        file: file,
                        fields: newMusic

                    }).progress(function (evt) {
                        file.progress = parseInt(100.0 * evt.loaded / evt.total);
                    }).success(function (music, status) {
                        toastr.success(music.Name + ' uploaded!');
                        $scope.channel.Musics.push(music);
                        $scope.removeFromUploadList(file);

                    }).error(function (data, status, headers, config) {
                        console.log(data);
                        Validator.
                            take(data).
                            toastErrors().
                            otherwiseToastError();

                    }).finally(function () {
                        file.uploading = false;
                        file.progress = 0;
                    });
                }, false);

                return true;
            }
        }]);
