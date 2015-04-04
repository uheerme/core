'use strict';

angular.module('samesoundApp')
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
