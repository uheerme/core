'use strict';

angular.module('samesoundApp')
    .config(['$stateProvider', '$urlRouterProvider',
        function ($stateProvider, $urlRouterProvider) {
            $stateProvider
                .state('musics', {
                    url: '/channels/:channelId/musics',
                    templateUrl: 'Scripts/app/modules/musics/musics.html',
                    controller: 'MusicsController'
                });
        }])
