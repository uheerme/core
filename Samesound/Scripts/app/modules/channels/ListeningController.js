'use strict';

samesoundApp
    .controller('ListeningController',
        ['$scope', 'channel', 'MusicPlayer', 'config',
        function ($scope, channel, MusicPlayer, config) {
            $scope.currentMusicCurrentTime = 0;
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
                .start();
        }]);
