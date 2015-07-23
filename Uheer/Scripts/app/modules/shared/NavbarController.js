'use strict';

function NavbarController($scope, $location, Authority) {
    $scope.a = Authority.authentication;
    $scope.exit = function () {
        Authority.logOut();
        $location.path('/');
    }
}

UheerApp.controller('NavbarController', ['$scope', '$location', 'Authority', NavbarController]);
