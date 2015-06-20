
UheerApp.controller(
    'ChannelDashboardController',
    ['$http', '$scope', 'config', 'channel', 'Validator', 'MusicUploader',
        function ($http, $scope, config, channel, Validator, MusicUploader) {

            MusicUploader.take($scope);

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

            $scope.remove = function (file) { return MusicUploader.remove(file); };
            $scope.cancel = function (file) { return MusicUploader.cancel(file); };
            $scope.upload = function (file) { return MusicUploader.upload(file); }
            $scope.uploadMany = function (files) { return MusicUploader.uploadMany(files); };
        }]);
