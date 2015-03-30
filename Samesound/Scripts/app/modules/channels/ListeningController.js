
samesoundApp
    .controller('ListeningController',
        ['$scope', 'channel', 'MusicLoadingPolicy', 'config',
        function ($scope, channel, MusicLoadingPolicy, config) {
            $scope.playing = false;
            $scope.streaming = [];
            $scope.channel = channel;

            $scope.play = function (audio) {
                if (!audio) return false;
                $scope.playing = true;
                audio.play();
            }

            $scope.pause = function (audio) {
                if (!audio) return false;
                $scope.playing = false;
                audio.pause();
            }

            $scope.toogle = function () {
                var music = $scope.streaming[0];
                if (!music) return false;

                var audioTag = document.getElementById('music-' + music.Id);
                if (!audioTag) return false;

                if (!$scope.playing)
                    return $scope.play(audioTag);
                else
                    return $scope.pause(audioTag);
            }

            $scope.load = function (music) {
                if (MusicLoadingPolicy.shouldLoad(music)) {
                    music.Source = config.apiUrl + 'Musics/' + music.Id + '/Stream';
                    $scope.streaming.push(music);
                    MusicLoadingPolicy.load(music);
                }
            }

            for (var i = 0; i < $scope.channel.Musics.length; i++) {
                $scope.load($scope.channel.Musics[i]);
            }
        }])

samesoundApp
    .factory('MusicLoadingPolicy', function () {
        var maxMusicsLoadedAtOnce = 3,
            downloading = [];

        function load(music) {
            downloading.push(music);
        }

        function shouldLoad(music) {
            return maxMusicsLoadedAtOnce > downloading.length;
        }

        return {
            load: load,
            shouldLoad: shouldLoad
        };
    })
