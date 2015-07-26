﻿
UheerApp.controller(
    'DashboardController',
    ['$http', '$scope', 'config', 'channel', 'Validator', 'MusicUploader',
        function ($http, $scope, config, channel, Validator, MusicUploader) {

            function updateChannel() {
                $scope.channel.$update(
                    function (updatedChannel) { toastr.success('Saved!'); },
                    function (error) { Validator.take(error).toastErrors(); }
                );
            }

            MusicUploader.take($scope);

            $scope.channel = channel;

            // Parsing dates.
            channel.CurrentStartTime = new Date(channel.CurrentStartTime);
            for (var i in channel.Musics) {
                var music = channel.Musics[i];
                music.DateCreated = new Date(music.DateCreated);
            }

            $scope.toogleLoop = function () {
                $scope.channel.Loops = !$scope.channel.Loops;
                updateChannel();
            }

            $scope.stop = function () {
                $scope.channel.CurrentId = $scope.channel.CurrentStartTime = null;
                updateChannel();
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
                        $scope.channel.CurrentStartTime = new Date(data.CurrentStartTime);
                    })
                    .error(function (error) {
                        console.log(error);
                        Validator.
                            take(error).
                            toastErrors();
                    })
            }

            $scope.remove = function (file) { return MusicUploader.remove(file); };
            $scope.cancel = function (file) { return MusicUploader.cancel(file); };
            $scope.upload = function (file) { return MusicUploader.upload(file); }
            $scope.uploadMany = function (files) { return MusicUploader.uploadMany(files); };
        }]);
