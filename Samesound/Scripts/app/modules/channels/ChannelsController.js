
samesoundApp
    .controller('ChannelsController',
        ['$http', '$scope', '$resource', 'config',
        function ($http, $scope, $resource, config) {

            var Channel = $resource(config.apiUrl + 'channels/:Id');

            $scope.channels = Channel.query()

            $scope.create = function () {
                Channel
                    .save($scope.channel,
                    function (createdChannel) {
                        $scope.channels.push(createdChannel)
                        toastr.success($scope.channel.Name + ' successfully created!')
                    },
                    function (data) {
                        console.log(data);
                        toastr.error('Opps! Something went wrong!')
                    })
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
                        console.log(data);
                        toastr.error('Opps! Something went wrong!');
                    });
            }

            $scope.clear = function () {
                $scope.channel = { Name: '', Owner: '', NetworkIdentifier: '' }
            }

            $scope.clear()
        }])