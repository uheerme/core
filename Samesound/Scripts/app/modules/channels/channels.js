'use strict';

angular.module('samesoundApp')
    .config(['$stateProvider', '$urlRouterProvider',
        function ($stateProvider, $urlRouterProvider) {
            $stateProvider
                .state('channels', {
                    url: '/channels',
                    templateUrl: 'Scripts/app/modules/channels/channels.html',
                    controller: 'ChannelsController'
                });

            $urlRouterProvider.otherwise('/')
        }])
