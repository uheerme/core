
samesoundApp
    .controller('ChannelsController',
        ['$http', '$scope', '$resource', 'config', 'Validator',
        function ($http, $scope, $resource, config, Validator) {

            var Channel = $resource(config.apiUrl + 'channels/:Id');

            $scope.channels = Channel.query();

            $scope.create = function () {
                Channel
                    .save($scope.channel,
                    function (createdChannel) {
                        $scope.channels.push(createdChannel)
                        toastr.success(createdChannel.Name + ' successfully created!')
                    },
                    function (response) {
                        Validator.
                            take(response.data, response.status).
                            toastErrors().
                            otherwiseToastError();
                    })
                $scope.clear();
            }

            $scope.deactivate = function (channel) {
                $http
                    .post(config.apiUrl + 'channels/' + channel.Id +  '/deactivate')
                    .success(function (deactivatedChannel) {
                        var channelIndex = $scope.channels.indexOf(channel)
                        $scope.channels[channelIndex] = deactivatedChannel
                        toastr.success(deactivatedChannel.Name + ' successfully deactivated!');
                    })
                    .error(function (data) {
                        Validator.
                            take(response.data, response.status).
                            toastErrors().
                            otherwiseToastError();
                    });
            }

            $scope.clear = function () {
                $scope.channel = { Name: '', Owner: '' }
            }

            $scope.clear()
        }])