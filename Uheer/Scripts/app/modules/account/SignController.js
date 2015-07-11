'use strict';

UheerApp.controller('SignController', ['$scope', '$location', 'Authority', 'Validator',
    function ($scope, $location, Authority, Validator) {

        $scope.login = function () {
            Authority
                .login($scope.loginData)
                .then(
                    function (response) {
                        $location.path('/');
                    },
                    function (response) {
                        Validator.
                             take(response).
                             toastErrors().
                             otherwiseToastError();
                    }
                );
        }

        $scope.clear = function () {
            $scope.loginData = { UserName: '', Password: '' };
        }

        $scope.clear();
    }]);