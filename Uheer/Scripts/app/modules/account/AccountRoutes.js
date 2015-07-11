'use strict';

angular.module('UheerApp')
    .config(['$stateProvider', '$urlRouterProvider',
        function ($stateProvider, $urlRouterProvider) {
            $stateProvider
                .state('sign', {
                    url: '/sign',
                    templateUrl: 'Scripts/app/modules/account/sign.html',
                    controller: 'SignController'
                });
        }])
