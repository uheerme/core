'use strict';

function EventListener(config) {
    var source = null;
    var rules = {};

    return {
        status: function () {
            return source != null;
        },
        match: function (rule, action) {
            if (!rule || !action) {
                throw new Error('EventListener cannot match {' + rule + '} -> {' + action + '}.');
            }

            rules[rule] = action;
            return this;
        },
        start: function (channelId) {
            if (!source) {
                console.log('Event listener connected to channel ' + channelId + '.');

                source = new EventSource(config.apiUrl + "Events/" + channelId);
                source.onmessage = function (event) {
                    console.log('Command received: ' + event.data);

                    // Execute action, if data matches with any of the rules.
                    var action = rules[event.data]
                    if (action) action(event);
                };
            }

            return this;
        }
    }
}

angular
    .module('UheerApp')
    .factory('EventListener', ['config', EventListener])
