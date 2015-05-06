'use strict';

angular.module('UheerApp')
    .config(['$stateProvider', '$urlRouterProvider',
        function ($stateProvider, $urlRouterProvider) {
            $stateProvider
                .state('listen/:id', {
                    url: '/listen/:id',
                    templateUrl: 'Scripts/app/modules/listen/listen.html',
                    controller: 'ListenController'
                });
        }]);
