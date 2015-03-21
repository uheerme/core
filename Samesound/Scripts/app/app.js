﻿// Samesound Angular Application.
// Defines the main module of the application.

'use strict';

var samesoundApp = angular
    .module('samesoundApp', ['ngResource', 'ngRoute', 'ui.router', 'ngAnimate'])
    .config(['$locationProvider', function ($locationProvider) {
        //$locationProvider.html5Mode(true);
        //$locationProvider.hashPrefix('#');
    }])
    .constant('config', {
        apiUrl: 'http://localhost:1330/api/'
    });
