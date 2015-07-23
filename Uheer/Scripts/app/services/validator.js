// Validator
// Takes <param>data<param>, a object that represents the outcome of a HTTP requisition an tries to interpret its ModelState property.
'use strict';

angular
    .module('UheerApp')
    .factory('Validator', function () {
        return {
            _data: {},
            _statusCode: null,
            take: function (data, statusCode) {
                this._data = data || {};
                this._statusCode = statusCode;

                return this;
            },
            errors: function () {
                var result = [];

                if (this._data.ModelState) {
                    var modelState = this._data.ModelState;
                    for (var err in modelState) {
                        result = result.concat(modelState[err]);
                    }
                }

                if (this._data.Message)           result.push(this._data.Message);
                if (this._data.error_description) result.push(this._data.error_description);

                return result;
            },
            _toast: function(whichToastr) {
                var errors = this.errors();
                for (var i = 0; i < errors.length; i++) {
                    whichToastr(errors[i], 'Warning!');
                }

                return this;
            },
            toastWarnings: function () {
                return this._toast(toastr.warning)
            },
            toastErrors: function () {
                return this._toast(toastr.error)
            },
            toastDefaultError: function (message, title) {
                message = message || 'Sorry, something went terribly wrong!';
                title = title || 'Error!';
                toastr.error(message, title);
                return this;
            }
        };
    });
