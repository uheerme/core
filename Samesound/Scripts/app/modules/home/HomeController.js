
samesoundApp.controller('HomeController', ['$scope', '$resource', 'config',
    function ($scope, $resource, config) {
        var Channel = $resource(config.apiUrl + 'Channels/:Id/Active');

        $scope.channels = Channel.query();

        $scope.clear = function () {
            //
        }

        $scope.clear();
    }])
