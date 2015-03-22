'use strict';

angular.module('samesoundApp')
    .config(['$stateProvider', '$urlRouterProvider',
        function ($stateProvider, $urlRouterProvider) {
            $stateProvider
                .state('channels', {
                    url: '/channels',
                    templateUrl: 'Scripts/app/modules/channels/channels.html',
                    controller: 'ChannelsController'
                })
                .state('channels/:id/dashboard', {
                    url: '/channels/:id/dashboard',
                    templateUrl: 'Scripts/app/modules/channels/dashboard.html',
                    controller: 'ChannelDashboardController',
                    resolve: {
                        channel: function ($stateParams, $resource, config) {
                            return $resource(config.apiUrl + 'channels/:Id')
                                .get({ Id: $stateParams.id })
                                .$promise;
                        }
                    }
                });
        }])
