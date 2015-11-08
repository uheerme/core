'use strict';

angular.module('UheerApp')
    .config(['$stateProvider', '$urlRouterProvider',
        function ($stateProvider, $urlRouterProvider) {
            $stateProvider
                .state('home', {
                    url: '/',
                    templateUrl: 'Scripts/app/modules/home/home.html',
                    controller: 'HomeController'
                })
                .state('about', {
                    url: '/about',
                    'templateUrl': 'Scripts/app/modules/home/about.html',
                    controller: 'HomeController'
                });

            $urlRouterProvider.otherwise('/');
        }]);
