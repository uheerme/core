'use strict';

samesoundApp
    .controller('ListenController',
        ['$scope', 'channel', 'MusicPlayer', 'config',
        function ($scope, channel, MusicPlayer, config) {
            $scope.currentMusicCurrentTime = 0;
            $scope.fetched = 0;
            $scope.channel = channel;

            $scope.toogleMute = function () {
                if (!$scope.channel.CurrentId) {
                    toastr.warning('Cannot mute a channel which is not playing anything.', 'Ops!');
                    return false;
                }

                MusicPlayer.mute($scope.mute = !$scope.mute);
            }

            $scope.player = MusicPlayer
                .take($scope)
                .fetchAll(function () {
                    if ($scope.fetched >= $scope.channel.Musics.length) {
                        $scope.player.start();
                    }
                });
        }]);
