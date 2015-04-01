
samesoundApp.controller(
    'ChannelDashboardController',
    ['$http', '$scope', '$resource', '$upload', 'config', 'channel', 'Validator',
        function ($http, $scope, $resource, $upload, config, channel, Validator) {
            $scope.channel = channel;
            $scope.numberOfFilesBeingUploaded = 0;
            $scope.cancel = function (file) {
                //
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
