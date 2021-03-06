﻿'use strict';

angular.module('UheerApp')
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
                    controller: 'DashboardController',
                    resolve: {
                        channel: function ($stateParams, ChannelResource, config) {
                            return ChannelResource
                                .get({ Id: $stateParams.id })
                                .$promise;
                        }
                    }
                });
        }])
