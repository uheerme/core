
samesoundApp.controller(
    'ChannelDashboardController',
    ['$http', '$scope', '$upload', 'config', 'channel', 'Validator',
        function ($http, $scope, $upload, config, channel, Validator) {

            $scope.channel = channel;

            $scope.toogleLoop = function () {
                $scope.channel.Loops = !$scope.channel.Loops;
                $scope.channel.$update(
                    function (updatedChannel) {
                        toastr.success(
                            updatedChannel.Name + ' will now '
                                + updatedChannel.Loops
                                ? 'loop at the end of the track'
                                : 'stop at the end of the track.',
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

            $scope.removeFromUploadQueue = function (file) {
                var indexOf = $scope.files.indexOf(file);
                $scope.files.splice(indexOf, 1);
            }

            $scope.isUploading = false;
            $scope.uploadFirst = function () {
                if (!$scope.files || !$scope.files.length) {
                    $scope.isUploading = false;
                    return false;
                }

                var file = $scope.files[0];
                return $scope.upload(file);
            }
            $scope.upload = function (file) {
                if (!file) {
                    console.log('Cannot upload invalid file.');
                    return false;
                }
                if ($scope.isUploading) {
                    console.log('Cannot upload two files at once!');
                    return false;
                }

                $scope.isUploading = true;
                $scope.removeFromUploadQueue(file);

                $scope.currentUpload = $upload.upload({
                    url: config.apiUrl + 'Musics',
                    file: file,
                    fields: {
                        'Name': file.uploadName,
                        'ChannelId': channel.Id,
                    }
                }).progress(function (evt) {
                    file.progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
                    console.log(file.progressPercentage);
                }).success(function (music, status) {
                    toastr.success(music.Name + ' uploaded!');
                    $scope.channel.Musics.push(music);

                }).error(function (data, status, headers, config) {
                    console.log(data);
                    Validator.
                        take(data).
                        toastErrors().
                        otherwiseToastError();

                }).finally(function () {
                    $scope.currentUpload = null;
                    $scope.isUploading = false;
                });

                return true;
            }
            $scope.cancel = function (file) {
                if ($scope.currentUpload) {
                    $scope.currentUpload.abort();
                    $scope.currentUpload = null;
                    $scope.isUploading = false;
                }
            }
        }]);
