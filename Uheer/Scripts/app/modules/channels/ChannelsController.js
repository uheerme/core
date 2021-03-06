﻿
UheerApp
    .controller('ChannelsController',
        ['$http', '$scope', '$resource', 'config', 'Validator',
        function ($http, $scope, $resource, config, Validator) {

            var Channel = $resource(config.apiUrl + 'channels/:Id');

            $scope.channels = Channel.query();

            $scope.create = function () {
                if (!$scope.channel.Name) return;

                Channel
                    .save($scope.channel,
                    function (createdChannel) {
                        $scope.channels.unshift(createdChannel)
                        toastr.success(createdChannel.Name + ' successfully created!')
                        $scope.clear();
                    },
                    function (response) {
                        Validator.
                            take(response.data, response.status).
                            toastErrors();
                    });
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
                            toastErrors();
                    });
            }

            $scope.clear = function () {
                $scope.channel = { Name: '' }
            }

            $scope.clear()
        }])