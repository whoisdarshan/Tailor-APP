const express = require('express');
const Router = express.Router();
const adminCtrl = require('../controller/admin_controller');
const config = require('../config/common.config');
const routesMiddlewares = require('../routes/routesMiddlewares');
const ResponseFormatter = require('../utils/response.formatter');
const formatter = new ResponseFormatter();
const fs = require('fs')
const { adminVerifyToken } = require('../helper/verifyToken');
const adminValidations = require('../validations/admin.validations');
const multer = require('multer');
const { format } = require('path');


//Configuration for Multer
const multerStorage = multer.diskStorage({
    destination: function (req, file, cb) {

        if (file.filename == 'document') {
            if (fs.existsSync('public/document')) {
                fs.mkdirSync('public/document');
            }

            cb(null, 'public/document')
        } else {
            if (!fs.existsSync('public/document')) {
                fs.mkdirSync('public/document')
            }
            cb(null, 'public/profile')
        }
    },
    filename: (req, file, cb) => {
        let ext = file.mimetype.split('/')[1];
        cb(null, `${Date.now()}.${ext}`)
    }
})


const upload = multer({ storage: multerStorage });



Router.post('/login',
    upload.none(),
    routesMiddlewares.validateRequest(adminValidations.loginSchema),
    function (req, res, next) {
        adminCtrl.login(req)
            .then(function (resultObj) {    
                var finalRes = formatter.formatResponse(resultObj, 1, config.messages['login_success'], true)
                res.send(finalRes)
            }, function (errorCode) {
                var finalRes = formatter.formatResponse({}, 0, errorCode, false)
                res.send(finalRes);
            })
    }
)


Router.post('/forgetPassword',
    upload.none(),
    routesMiddlewares.validateRequest(adminValidations.forgetPasswordSchema),
    function (req, res, next) {
        adminCtrl.forgetPassword(req)
            .then(function (resultObj) {
                var finalRes = formatter.formatResponse(resultObj, 1, config.messages['send_otp_success'], true)
                res.send(finalRes)
            }, function (errorCode) {
                var finalRes = formatter.formatResponse({}, 0, errorCode, false)
                res.send(finalRes);
            })
    }
)


Router.post('/resetPassword',
    upload.none(), adminVerifyToken,
    // routesMiddlewares.validateRequest(adminValidations.resetPasswordSchema),
    function (req, res) {
        adminCtrl.resetPassword(req, res)
            .then((resultObj) => {
                var finalRes = formatter.formatResponse(resultObj, 1, config.messages['reset_password_success'], true);
                res.send(finalRes)
            }, function (errorCode) {
                var finalRes = formatter.formatResponse({}, 0, errorCode, false)
                res.send(finalRes);
            })
    }
)
Router.post('/verifyOtp', upload.any(),
    routesMiddlewares.validateRequest(adminValidations.verifyOTPSchema),
    function (req, res, next) {
        adminCtrl.verifyOtp(req, res)
            .then(function (resultObj) {
                var finalRes = formatter.formatResponse(resultObj, 1, config.messages['otp_verified'], true)
                res.send(finalRes)
            }, function (errorCode) {
                var finalRes = formatter.formatResponse({}, 0, errorCode, false)
                res.send(finalRes)
            })
    }
);

Router.post('/pendingRequest',
    upload.any(),
    // routesMiddlewares.validateRequest(adminValidations.pendingRequestSchema),
    function (req, res) {
        adminCtrl.pendingRequest(req, res)
            .then((resultObj) => {
                var finalRes = formatter.formatResponse(resultObj, 1, config.messages['show_pending_req_success'], true);
                res.send(finalRes)
            }, function (errorCode) {
                var finalRes = formatter.formatResponse({}, 0, errorCode, false)
                res.send(finalRes);
            })
    }
);
Router.post('/accORdec',
    upload.none(),
    routesMiddlewares.validateRequest(adminValidations.accORdecSchema),
    function (req, res) {
        adminCtrl.accORdec(req, res)
            .then((resultObj) => {
                let is_status = resultObj.is_status;
                if (is_status == 'accepted') {
                    let finalRes = formatter.formatResponse(resultObj, 1, config.messages['request_accepted'], true);
                    res.send(finalRes)
                } else if (is_status == 'declined') {
                    let finalResponse = formatter.formatResponse(resultObj, 1, config.messages['request_decline'], true);
                    res.send(finalResponse)
                }
            }, function (errorCode) {
                var finalRes = formatter.formatResponse({}, 0, errorCode, false)
                res.send(finalRes);
            })
    }
);



Router.post('/showTailorDetails',
    upload.any(),
    routesMiddlewares.validateRequest(adminValidations.showTailorDetailsSchema),
    function (req, res) {
        adminCtrl.showTailorDetails(req)
            .then((resultObj) => {
                // console.log(resultObj)
                var finalRes = formatter.formatResponse(resultObj, 1, config.messages['tailor_detail_success'], true);
                res.send(finalRes)
            }, function (errorCode) {
                var finalRes = formatter.formatResponse({}, 0, errorCode, false);
                res.send(finalRes)
            })
    }
);

Router.post('/showAllTailors', upload.any(),
    // routesMiddlewares.validateRequest(adminValidations.showAllTailorsSchema),
    function (req, res, next) {
        adminCtrl.showAllTailors(req)
            .then(function (resultObj) {
                var finalRes = formatter.formatResponse(resultObj, 1, config.messages['show_all_tailor'], true);
                res.send(finalRes)
            }, function (errorCode) {
                var finalRes = formatter.formatResponse({}, 0, errorCode, false)
                res.send(finalRes);
            })
    }
);


Router.post('/showAllUsers', upload.any(),
    function (req, res, next) {
        adminCtrl.showAllUsers(req)
            .then(function (resultObj) {
                var finalRes = formatter.formatResponse(resultObj, 1, config.messages['show_all_user'], true);
                res.send(finalRes)
            }, function (errorCode) {
                var finalRes = formatter.formatResponse({}, 0, errorCode, false)
                res.send(finalRes);
            })
    }
);


Router.post('/showUserDetails',
    upload.none(),
    routesMiddlewares.validateRequest(adminValidations.showUserDetailsSchema),
    function (req, res) {
        adminCtrl.showUserDetails(req, res)
            .then((resultObj) => {
                var finalRes = formatter.formatResponse(resultObj, 1, config.messages['show_details'],true);
                res.send(finalRes)
            }, function (errorCode) {
                var finalRes = formatter.formatResponse({}, 0, errorCode, false)
                res.send(finalRes);
            })
    }
)

Router.post('/deleteUser', upload.any(),
    routesMiddlewares.validateRequest(adminValidations.deleteUserSchema),
    function (req, res, next) {
        adminCtrl.deleteUser(req)
            .then(function (resultObj) {
                var finalRes = formatter.formatResponse(resultObj, 1, config.messages['delete_user_success'], true);
                res.send(finalRes)
            }, function (errorCode) {
                var finalRes = formatter.formatResponse({}, 0, errorCode, false)
                res.send(finalRes);
            })
    }
);


Router.post('/addCategory', upload.single('img'),
    routesMiddlewares.validateRequest(adminValidations.addCategorySchema),
    function (req, res, next) {
        adminCtrl.addCategory(req)
            .then(function (resultObj) {
                var finalRes = formatter.formatResponse(resultObj, 1, config.messages['add_category_success'], true);
                res.send(finalRes)
            }, function (errorCode) {
                var finalRes = formatter.formatResponse({}, 0, errorCode, false)
                res.send(finalRes);
            })
    }
)

Router.post('/updateCategory', upload.any(),
    routesMiddlewares.validateRequest(adminValidations.updateCategorySchema),
    function (req, res, next) {
        adminCtrl.updateCategory(req, res)
            .then(function (resultObj) {
                var finalRes = formatter.formatResponse(resultObj, 1, config.messages['update_category_success'], true);
                res.send(finalRes)
            }, function (errorCode) {
                var finalRes = formatter.formatResponse({}, 0, errorCode, false)
                res.send(finalRes);
            })
    }
)


Router.post('/deleteCategory', upload.any(),
    routesMiddlewares.validateRequest(adminValidations.deleteCategorySchema),
    function (req, res, next) {
        adminCtrl.deleteCategory(req)
            .then(function (resultObj) {
                var finalRes = formatter.formatResponse(resultObj, 1, config.messages['delete_categroy_success'], true);
                res.send(finalRes)
            }, function (errorCode) {
                var finalRes = formatter.formatResponse({}, 0, errorCode, false)
                res.send(finalRes);
            })
    }
)

Router.post('/listOfCategory', upload.any(),
    function (req, res, next) {
        adminCtrl.listOfCategory(req)
            .then(function (resultObj) {
                // console.log(resultObj);
                var finalRes = formatter.formatResponse(resultObj, 1, config.messages['list_success'], true);
                // console.log('************',resultObj)
                res.send(finalRes)
            }, function (errorCode) {
                var finalRes = formatter.formatResponse({}, 0, errorCode, false)
                res.send(finalRes);
            })
    }
)


Router.post('/logOut',
    upload.none(),adminVerifyToken,
    // routesMiddlewares.validateRequest(adminValidations.logOutSchema),
    function (req, res) {
        adminCtrl.logOut(req, res)
            .then((resultObj) => {
                var finalRes = formatter.formatResponse(resultObj, 1, config.messages['logout_success'], true);
                res.send(finalRes)
            }, function (errorCode) {
                var finalRes = formatter.formatResponse({}, 0, errorCode, false)
                res.send(finalRes);
            })
    }
)



module.exports = Router;


