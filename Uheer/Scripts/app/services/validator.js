// Validator
// Takes <param>data<param>, a object that represents the outcome of a HTTP requisition an tries to interpret its ModelState property.
angular
    .module('UheerApp')
    .factory('Validator', function () {
        return {
            _data: null,
            _statusCode: null,
            canReadErrors: function () {
                return this.hasErrorMessage() || this.hasValidationErrors()
            },
            hasErrorMessage: function () {
                return this._data && this._data.Message;
            },
            hasValidationErrors: function () {
                return this._data && this._data.ModelState;
            },
            take: function (data, statusCode) {
                this._data = data;
                this._statusCode = statusCode

                return this;
            },
            errors: function () {
                var result = [];

                if (this.hasValidationErrors()) {
                    var modelState = this._data.ModelState;
                    for (var err in modelState) {
                        // Merge current set of errors to result.
                        result = result.concat(modelState[err]);
                    }
                } else if (this.hasErrorMessage()) {
                    var message = this._data.Message;
                    result.push(message);
                }

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
            otherwiseToastError: function (message, title) {
                if (!this.canReadErrors()) {
                    message = message || 'Sorry, something went terribly wrong!';
                    title = title || 'Error!';
                    toastr.error(message, title);
                }
                return this;
            }
        };
    });
