'use strict';

UheerApp.factory('Authority',
    ['$http', '$q', 'localStorageService', 'config',
    function ($http, $q, localStorageService, config) {

        var AuthorityContainer = {};

        var _authentication = {
            isAuth: false,
            UserName: ""
        };

        var _saveRegistration = function (registration) {
            _logOut();

            return $http.post(config.apiUrl + 'Account/Register', registration);
        };

        var _login = function (loginData) {
            var data = "grant_type=password&UserName=" + loginData.UserName + "&Password=" + loginData.Password;

            var deferred = $q.defer();

            $http.
                post(config.baseUrl + 'Token', data, {
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
                }).
                success(function (response) {
                    localStorageService.set('authorizationData', { token: response.access_token, UserName: loginData.UserName });

                    _authentication.isAuth = true;
                    _authentication.UserName = loginData.UserName;

                    deferred.resolve(response);
                }).
                error(function (error, status) {
                    console.log(error);

                    _logOut();
                    deferred.reject(error);
                });

            return deferred.promise;
        };

        var _logOut = function () {
            localStorageService.remove('authorizationData');

            _authentication.isAuth = false;
            _authentication.UserName = "";
        };

        var _fillAuthData = function () {
            var authData = localStorageService.get('authorizationData');
            if (authData) {
                _authentication.isAuth = true;
                _authentication.UserName = authData.UserName;
            }
        }

        AuthorityContainer.saveRegistration = _saveRegistration;
        AuthorityContainer.login = _login;
        AuthorityContainer.logOut = _logOut;
        AuthorityContainer.fillAuthData = _fillAuthData;
        AuthorityContainer.authentication = _authentication;

        return AuthorityContainer;
    }]);

UheerApp.factory('authInterceptorService',
    ['$q', '$location', 'localStorageService',
    function ($q, $location, localStorageService) {

        var authInterceptorServiceFactory = {};

        var _request = function (config) {

            config.headers = config.headers || {};

            var authData = localStorageService.get('authorizationData');
            if (authData) {
                config.headers.Authorization = 'Bearer ' + authData.token;
            }

            return config;
        }

        var _responseError = function (rejection) {
            if (rejection.status === 401) {
                $location.path('/sign');
            }
            return $q.reject(rejection);
        }

        authInterceptorServiceFactory.request = _request;
        authInterceptorServiceFactory.responseError = _responseError;

        return authInterceptorServiceFactory;
    }]);

UheerApp.config(function ($httpProvider) {
    $httpProvider.interceptors.push('authInterceptorService');
});

UheerApp.run(['Authority', function (Authority) {
    Authority.fillAuthData();
}]);