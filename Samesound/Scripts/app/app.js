﻿// Samesound Angular Application.
// Defines the main module of the application.

'use strict';

var samesoundApp = angular
    .module('samesoundApp', [
        'ngRoute',
        'ui.router',
        'ngAnimate'
    ])
    .constant('config', {
        url: 'http://localhost:1330/'
    });