'use strict';

angular.module('UheerApp')
    .config(['$stateProvider', '$urlRouterProvider',
        function ($stateProvider, $urlRouterProvider) {
            $stateProvider
                .state('home', {
                    url: '/',
                    templateUrl: 'Scripts/app/modules/home/home.html',
                    controller: 'HomeController'
                });

            $urlRouterProvider.otherwise('/')
        }])
