
samesoundApp.controller(
    'ChannelDashboardController',
    ['$http', '$scope', '$resource', '$upload', 'config', 'channel',
        function ($http, $scope, $resource, $upload, config, channel) {
        $scope.channel = channel;
        $scope.toastr = toastr

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

                }).success(function (data, status, headers, config) {
                    toastr.success(config.file.uploadName + ' uploaded!');

                    $scope.removeFromUploadQueue(file);
                    $scope.channel.Musics.concat(data);

                }).error(function (data, status, headers, config) {
                    console.log(data);
                });
            }
        };
    }])
