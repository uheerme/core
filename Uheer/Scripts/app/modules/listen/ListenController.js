'use strict';

UheerApp
    .controller('ListenController',
        ['$scope', '$stateParams', 'ChannelResource', 'MusicPlayer', 'config',
        function ($scope, $stateParams, channels, MusicPlayer, config) {
            $scope.toogleMute = function () {
                if (!$scope.channel.CurrentId) {
                    toastr.warning('Cannot mute a channel which is not playing anything.', 'Ops!');
                    return false;
                }

                MusicPlayer.mute($scope.mute = !$scope.mute);
            }

            $scope.resync = function () {
                $scope.currentMusic = null;
                $scope.currentMusicCurrentTime = 0;

                channels
                    .get({ id: $stateParams.id })
                    .$promise.then(function (channel) {
                        $scope.channel = channel;

                        //Exemplo de conexao aos eventos. Colocar um if para cada evento dentro da funcao, por exemplo Stop, Play e Update.
                        //Note que agora podemos assíncronamente atualizar informacoes da pagina com os dados recebidos no evento.
                        var source = new EventSource("api/Channels/2/Events");
                        source.onmessage = function (event) {
                            toastr.success(event.data,'Mensagem de stream recebida');
                        };

                        $scope.channel.CurrentStartTime = new Date(Date.parse($scope.channel.CurrentStartTime + 'Z'));

                        MusicPlayer
                                .take($scope)
                                .start();
                    });
            }

            $scope.resync();
        }]);