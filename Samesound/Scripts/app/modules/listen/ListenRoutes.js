'use strict';

angular.module('samesoundApp')
    .config(['$stateProvider', '$urlRouterProvider',
        function ($stateProvider, $urlRouterProvider) {
            $stateProvider
                .state('listen/:id', {
                    url: '/listen/:id',
                    templateUrl: 'Scripts/app/modules/listen/listen.html',
                    controller: 'ListenController',
                    resolve: {
                        channel: function ($stateParams, ChannelResource, config) {
                            return ChannelResource
                                .get({ Id: $stateParams.id })
                                .$promise;
                        }
                    }
                });
        }]);
