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
                .state('channels/:id', {
                    url: '/channels/:id',
                    templateUrl: 'Scripts/app/modules/channels/dashboard.html',
                    controller: 'ChannelDashboardController',
                    resolve: {
                        channel: function ($stateParams, $resource, config) {
                            return $resource(config.apiUrl + 'channels/:Id')
                                .get({ Id: $stateParams.id })
                                .$promise;
                        }
                    }
                })
                .state('listen/:id', {
                    url: '/listen/:id',
                    templateUrl: 'Scripts/app/modules/channels/listening.html',
                    controller: 'ListeningController',
                    resolve: {
                        channel: function ($stateParams, $resource, config) {
                            return $resource(config.apiUrl + 'channels/:Id')
                                .get({ Id: $stateParams.id })
                                .$promise;
                        }
                    }
                });
        }])
