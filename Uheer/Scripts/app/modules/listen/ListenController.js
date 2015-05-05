'use strict';

UheerApp
    .controller('ListenController',
        ['$scope', '$stateParams', 'ChannelResource', 'MusicPlayer', 'config',
        function ($scope, $stateParams, channels, MusicPlayer, config) {
            $scope.toogleMute = function () {
                if (!$scope.channel.CurrentId) {
                    toastr.warning('Cannot mute a channel which is not playing anything.', 'Ops!');
                    return false;
                }

                MusicPlayer.mute($scope.mute = !$scope.mute);
            }

            $scope.resync = function () {
                $scope.currentMusic = null;
                $scope.currentMusicCurrentTime = 0;

                channels
                    .get({ id: $stateParams.id })
                    .$promise.then(function (channel) {
                        $scope.channel = channel;

                        MusicPlayer
                                .take($scope)
                                .start();
                    });
            }

            $scope.resync();
        }]);
