'use strict';

function EventListener(config) {

    function onMessage(event) {
        //Exemplo de conexao aos eventos. Colocar um if para cada evento dentro da funcao, por exemplo Stop, Play e Update.
        //Note que agora podemos assíncronamente atualizar informacoes da pagina com os dados recebidos no evento.
        console.log(event);
        toastr.success(event.data, 'Mensagem de stream recebida');
    }

    return {
        _source: null,
        status: function () {
            return this._source != null;
        },
        start: function (channelId) {
            if (!this._source) {
                console.log('Event listener connected to channel ' + channelId + '.');

                this._source = new EventSource(config.apiUrl + "Channels/" + channelId + "/Events");
                this._source.onmessage = onMessage;
            }

            return this;
        }
    }
}

angular
    .module('UheerApp')
    .factory('EventListener', ['config', EventListener])
