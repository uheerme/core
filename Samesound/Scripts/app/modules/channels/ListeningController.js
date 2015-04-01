
samesoundApp
    .controller('ListeningController',
        ['$scope', 'channel', 'MusicLoader', 'config',
        function ($scope, channel, MusicLoader, config) {
            MusicLoader.initialize($scope);

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

            $scope.tryToLoad = MusicLoader.tryToLoad

            var result = true, i = 0;
            while (i < $scope.channel.Musics.length && result) {
                var result = $scope.tryToLoad($scope.channel.Musics[i++]);
            }
        }])

samesoundApp
    .factory('MusicLoader', ['config', function (config) {
        var _$scope,
            maxMusicsLoadedAtOnce = 3,
            downloading = [];

        function initialize($scope) {
            _$scope = $scope;
            return this;
        }

        function tryToLoad(music, closure) {
            if (!shouldLoad(music))
                return false;

            downloading.push(music);
            music.Source = config.apiUrl + 'Musics/' + music.Id + '/Stream';
            _$scope.streaming.push(music);
        }

        // Defines the policy about sound loadings.
        function shouldLoad(music) {
            return maxMusicsLoadedAtOnce > downloading.length;
        }

        return {
            initialize: initialize,
            tryToLoad: tryToLoad,
            shouldLoad: shouldLoad
        };
    }])
