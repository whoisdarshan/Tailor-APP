const config = require("../config/common.config");
const ResponseFormatter = function () {
    /**
     * Format response to send unique response and message
     *
     * @param success
     * @param message
     * @param result
     * @returns {{success: *, message: *, result: *}}
     */
    this.formatResponse = function (data, code, messageCode, result) {
        // console.log('++++++++++++++++++++++++++++++++++++++',result);
        var errorMsg = config.messages[messageCode];
        if (!errorMsg) {
            errorMsg = messageCode;
        }

        var response = {
            data: data,
            ResponseCode: code,
            ResponseMsg: errorMsg,
            Result: result
        };
        return response;
    };
};
module.exports = ResponseFormatter;