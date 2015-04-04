
samesoundApp.controller(
    'ChannelDashboardController',
    ['$http', '$scope', '$upload', 'config', 'channel', 'Validator',
        function ($http, $scope, $upload, config, channel, Validator) {         

            $scope.channel = channel;
            $scope.numberOfFilesBeingUploaded = 0;

            $scope.cancel = function (file) {
                //
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

            $scope.upload = function () {
                if (!$scope.files || !$scope.files.length) {
                    return;
                }

                for (var i = 0; i < $scope.files.length; i++) {
                    $scope.numberOfFilesBeingUploaded++;
                    var file = $scope.files[i];

                    $upload.upload({
                        url: config.apiUrl + 'Musics',
                        file: file,
                        fields: {
                            'Name': file.uploadName,
                            'ChannelId': channel.Id
                        }

                    }).progress(function (evt) {
                        file.progressPercentage = parseInt(100.0 * evt.loaded / evt.total);

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
                        $scope.removeFromUploadQueue(file);
                        $scope.numberOfFilesBeingUploaded--;
                    });
                }
            };
        }])
