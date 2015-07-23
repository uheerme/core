'use strict';

function NavbarController($scope, Authority) {
    $scope.a = Authority.authentication;
}

UheerApp.controller('NavbarController', ['$scope', 'Authority', NavbarController]);
