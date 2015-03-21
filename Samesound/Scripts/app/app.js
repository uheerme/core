// Samesound Angular Application.
// Defines the main module of the application.

'use strict';

var samesoundApp = angular
    .module('samesoundApp', [
        'ngRoute',
        'ui.router',
        'ngAnimate'
    ])
    .config(['$locationProvider', function ($locationProvider) {
        //$locationProvider.html5Mode(true);
        //$locationProvider.hashPrefix('#');
    }])
    .constant('config', {
        url: 'http://localhost:1330/'
    });
