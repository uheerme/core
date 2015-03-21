'use strict';

angular.module('samesoundApp')
    .config(function ($stateProvider, $routeProvider) {
        $stateProvider
            .state('home', {
                url: '/',
                templateUrl: 'Scripts/app/modules/home/home.html',
                controller: 'HomeController'
            });
    })