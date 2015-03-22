
samesoundApp
    .controller('ChannelDashboardController',
        ['$http', '$scope', '$resource', '$upload', 'config', 'channel',
        function ($http, $scope, $resource, $upload, config, channel) {
            $scope.channel = channel;

            $scope.cancel = function (file) {
                var indexOf = $scope.files.indexOf(file);
                $scope.files.splice(indexOf, 1);
            }

            $scope.upload = function () {
                if ($scope.files && $scope.files.length) {
                    for (var i = 0; i < $scope.files.length; i++) {
                        var file = $scope.files[i];
                        $upload.upload({
                            url: config.apiUrl + 'Musics',
                            fields: { 'username': $scope.username },
                            file: file
                        }).progress(function (evt) {
                            var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
                            console.log('progress: ' + progressPercentage + '% ' + evt.config.file.name);
                        }).success(function (data, status, headers, config) {
                            toastr.success(config.file.name + ' uploaded!');
                            console.log('file ' + config.file.name + 'uploaded. Response: ' + data);
                        }).error(function (data) {
                            console.log(data);
                        });
                    }
                }
            };
        }])
