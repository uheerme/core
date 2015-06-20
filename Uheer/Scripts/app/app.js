// Uheer Angular Application.
// Defines the main module of the application.

'use strict';

var UheerApp = angular
    .module('UheerApp', ['ngResource', 'ngRoute', 'ui.router', 'ngAnimate', 'angularFileUpload', 'UheerApp.services'])
    .config(['$locationProvider', function ($locationProvider) {
        // $locationProvider.html5Mode(true);
        // $locationProvider.hashPrefix('#');
    }])
    .constant('config', {
        apiUrl: '/api/'
    })
    .run(function () {
        // Toastr configuration.
        toastr.options.progressBar = true;
    });
