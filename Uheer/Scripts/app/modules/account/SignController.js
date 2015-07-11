'use strict';

UheerApp.controller('SignController', ['$scope', '$http', '$location', 'config', 'Authority', 'Validator',
    function ($scope, $http, $location, config, Authority, Validator) {

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

        $scope.register = function () {
            Authority
                .saveRegistration($scope.registerData)
                .success(function (data, status, headers, config) {
                    $scope.loginData.UserName = $scope.registerData.Email;
                    $scope.loginData.Password = $scope.registerData.Password;

                    toastr.success('Try to sign in now.', 'Success!');

                    $scope.registerData = {};
                })
                .error(function (response) {
                    Validator.
                        take(response).
                        toastErrors().
                        otherwiseToastError();
                });
        }

        $scope.clear = function () {
            $scope.loginData = { UserName: '', Password: '' };
        }

        $scope.clear();
    }]);