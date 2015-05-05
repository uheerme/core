'use strict';

angular.module('UheerApp')
    .factory('StatusResource',
        [
            '$resource', 'config',
            function ($resource, config) {
                return $resource(config.apiUrl + 'Status/',
                    null,
                    {
                        now: { method: 'GET', url: config.apiUrl + 'Status/Now' }
                    });
            }
        ]
    );
