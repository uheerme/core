
samesoundApp
    .controller('MusicsController',
        ['$http', '$scope', '$resource', '$stateParams', 'config',
        function ($http, $scope, $resource, $stateParams, config) {
            
            var Music = $resource(config.apiUrl + 'Channels/:ChannelId/Musics/:Id', {
                ChannelId: $stateParams.channelId
            });

            $scope.musics = Music.query()

            $scope.create = function () {
                Music.save($scope.music,
                    function (createdMusic) {
                        $scope.musics.push(createdMusic)
                        toastr.success($scope.music.Name + ' successfully created!')
                    },
                    function (data) {
                        console.log(data);
                        toastr.error('Opps! Something went wrong!')
                    }
                );
            }

            $scope.clear = function () {
                $scope.music = { Name: '' }
            }

            $scope.clear()
        }])