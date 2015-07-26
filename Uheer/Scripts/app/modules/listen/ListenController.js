'use strict';

function ListenerController($scope, $stateParams, channels, MusicPlayer, EventListener, config) {
    function resync() {
        $scope.currentMusic = null;
        $scope.currentMusicCurrentTime = 0;

        channels
            .get({ id: $stateParams.id })
            .$promise.then(function (channel) {
                $scope.channel = channel;

                $scope.channel.CurrentStartTime = new Date(Date.parse($scope.channel.CurrentStartTime + 'Z'));

                MusicPlayer
                        .take($scope)
                        .start();
            });
    }

    function stop() {
        MusicPlayer.stopAll();
        $scope.currentMusic = null;
        $scope.currentMusicCurrentTime = 0;
    }

    function toogleMute() {
        if (!$scope.channel.CurrentId) {
            toastr.warning('Cannot mute a channel which is not playing anything.', 'Ops!');
            return false;
        }

        MusicPlayer.mute($scope.mute = !$scope.mute);
    }
    function toogleLoops() { $scope.channel.Loops = !$scope.channel.Loops; }

    $scope.toogleMute = toogleMute;
    $scope.resync = resync;

    $scope.resync();

    EventListener
        //.match('toogle-loop', toogleLoops)
        //.match('toogle-mute', toogleMute)
        .match('stop', stop)
        .match('play', resync)
        .start($stateParams.id);
}

angular
    .module('UheerApp')
    .controller('ListenController', ['$scope', '$stateParams', 'ChannelResource', 'MusicPlayer', 'EventListener', 'config', ListenerController]);