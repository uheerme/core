'use strict';

angular.module('samesoundApp')
    .factory('ChannelResource',
        [
            '$resource', 'config',
            function ($resource, config) {
                return $resource(config.apiUrl + 'Channels/:Id/', null,
                {
                    'update': { method: 'PUT' }
                });
            }
        ]
    );
