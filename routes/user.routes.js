const express = require('express');
const Router = express.Router();
const userCtrl = require('../controller/user_controller')
const config = require('../config/common.config');
const fs = require('fs');
const userValidation = require('../validations/user.validation');
const routesMiddlewares = require('../routes/routesMiddlewares');
const ResponseFormatter = require('../utils/response.formatter');
const formatter = new ResponseFormatter();
const publicPath = basedir + '/public/';
const multer = require('multer');
const { userVerifyToken } = require('../helper/verifyToken');
const { format } = require('path');
const { func } = require('joi');

//Configuration for multer

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


Router.post('/sendOtpForSignUp',
    upload.single('profile'),
    routesMiddlewares.validateRequest(userValidation.sendOtpForSignUpSchema),
    function (req, res) {
        userCtrl.sendOtpForSignUp(req)
            .then((resultObj) => {
                var finalRes = formatter.formatResponse(resultObj, 1, config.messages['send_otp_success'], true);
                res.send(finalRes)
            }, function (errorCode) {
                var finalRes = formatter.formatResponse({}, 0, errorCode, false);
                res.send(finalRes)
            })
    }
)



Router.post('/signUp',
    upload.single('profile'),
    routesMiddlewares.validateRequest(userValidation.signup),
    function (req, res, next) {
        userCtrl.signUp(req)
            .then((resultObj) => {
                var finalRes = formatter.formatResponse(resultObj, 1, config.messages['register_complete'], true);
                res.send(finalRes)
            }, function (erroCode) {

                // remove file if error
                if (req.file && req.file.profile) {
                    fs.unlink(publicPath + 'public/' + req.file.profile.filename, (err) => {
                        if (err) {
                            console.log(err)
                        }
                        console.log('file removed');
                    })
                }
                // remove file over

                var finalRes = formatter.formatResponse({}, 0, erroCode, false)
                return res.send(finalRes)
            })
    }
);

Router.post('/login',
    upload.any(),
    routesMiddlewares.validateRequest(userValidation.loginSchema),
    function (req, res) {
        userCtrl.login(req)
            .then(function (resultObj) {
                // console.log('0000000000000000000000',resultObj)
                var finalRes = formatter.formatResponse(resultObj, 1, config.messages['login_success'], true);
                res.send(finalRes)
            }, function (errorCode) {
                var finalRes = formatter.formatResponse({}, 0, errorCode, false);
                res.send(finalRes)
            })
    }
)

Router.post('/updateProfile',
    upload.any(),
    routesMiddlewares.validateRequest(userValidation.updateProfileSchema),
    function (req, res) {
        userCtrl.updateProfile(req, res)
            .then((resultObj) => {
                var finalRes = formatter.formatResponse(resultObj, 1, config.messages['profile_update'], true);
                res.send(finalRes)
            }, function (errorCode) {
                var finalRes = formatter.formatResponse({}, 0, errorCode, false);
                res.send(finalRes)
            })
    }
);


Router.post('/changePassword',
    upload.any(),
    routesMiddlewares.validateRequest(userValidation.changePasswordSchema),
    function (req, res) {
        userCtrl.changePassword(req)
            .then((resultObj) => {
                var finalRes = formatter.formatResponse(resultObj, 1, config.messages['password_change_success'], true);
                res.send(finalRes)
            }, function (errorCode) {
                var finalRes = formatter.formatResponse({}, 0, errorCode, false);
                res.send(finalRes)
            })
    }
)

Router.post('/forgetPassword',
    upload.any(),
    routesMiddlewares.validateRequest(userValidation.forgetPasswordSchema),
    function (req, res) {
        userCtrl.forgetPassword(req)
            .then((resultObj) => {
                var finalRes = formatter.formatResponse(resultObj, 1, config.messages['forget_password'], true);
                res.send(finalRes)
            }, function (errorCode) {
                var finalRes = formatter.formatResponse({}, 0, errorCode, false);
                res.send(finalRes)
            })
    }
);

Router.post('/verifyOtp',
    upload.any(),
    routesMiddlewares.validateRequest(userValidation.verifyOtpSchema),
    function (req, res) {
        userCtrl.verfiyOtp(req, res)
            .then((resultObj) => {
                // console.log('😃😃',resultObj)
                var finalRes = formatter.formatResponse(resultObj, 1, config.messages['otp_verified'], true);
                res.send(finalRes)
            }, function (errorCode) {
                var finalRes = formatter.formatResponse({}, 0, errorCode, false);
                res.send(finalRes)
            })
    }
);

Router.post('/resetPassword',
    upload.none(), userVerifyToken,
    routesMiddlewares.validateRequest(userValidation.resetPasswordSchema),
    function (req, res) {
        userCtrl.resetPassword(req, res)
            .then((resultObj) => {
                var finalRes = formatter.formatResponse(resultObj, 1, config.messages['reset_password_success'], true);
                res.send(finalRes)
            }, function (errorCode) {
                var finalRes = formatter.formatResponse({}, 0, errorCode, false)
                res.send(finalRes);
            })
    }
)

Router.post('/changeLanguage',
    upload.any(),
    routesMiddlewares.validateRequest(userValidation.changeLanguageSchema),
    function (req, res) {
        userCtrl.changeLanguage(req, res)
            .then((resultObj) => {
                var finalRes = formatter.formatResponse(resultObj, 1, config.messages['language_change_success'], true);
                res.send(finalRes)
            }, function (errorCode) {
                var finalRes = formatter.formatResponse({}, 0, errorCode, false);
                res.send(finalRes)
            })
    }
);



Router.post('/contactUS',
    upload.any(),
    routesMiddlewares.validateRequest(userValidation.contactUsSchema),
    function (req, res) {
        userCtrl.contactUs(req, res)
            .then((resultObj) => {
                var finalRes = formatter.formatResponse(resultObj, 1, config.messages['contact_us_msg'], true);
                res.send(finalRes)
            }, function (errorCode) {
                var finalRes = formatter.formatResponse({}, 0, errorCode, false);
                res.send(finalRes)
            })
    }
);

Router.post('/logOut',
    upload.any(), routesMiddlewares.validateRequest(userValidation.logOutSchema),
    function (req, res) {
        userCtrl.logOut(req)
            .then((resultObj) => {
                // console.log(resultObj)
                var finalRes = formatter.formatResponse(resultObj, 1, config.messages['logout_success'], true);
                res.send(finalRes)
            }, function (errorCode) {
                var finalRes = formatter.formatResponse({}, 0, errorCode, false);
                res.send(finalRes)
            })
    }

)

Router.post('/deleteAccount',
    upload.any(), routesMiddlewares.validateRequest(userValidation.deleteAccountSchema),
    function (req, res) {
        userCtrl.deleteAccount(req)
            .then((resultObj) => {
                // console.log(resultObj)
                var finalRes = formatter.formatResponse(resultObj, 1, config.messages['delete_success'], true);
                res.send(finalRes)
            }, function (errorCode) {
                var finalRes = formatter.formatResponse({}, 0, errorCode, false);
                res.send(finalRes)
            })
    }

);

Router.post('/home',
    upload.none(),
    function (req, res) {
        userCtrl.home(req)
            .then((resultObj) => {
                var finalRes = formatter.formatResponse(resultObj, 1, config.messages['showAllSkills_success'], true);
                res.send(finalRes)
            }, function (errorCode) {
                var finalRes = formatter.formatResponse({}, 0, errorCode, false);
                res.send(finalRes)
            })
    }
);


Router.post('/listOfTailors',
    upload.none(), userVerifyToken,
    routesMiddlewares.validateRequest(userValidation.listOfTailorsSchema),
    function (req, res) {
        userCtrl.listOfTailors(req)
            .then((resultObj) => {
                var finalRes = formatter.formatResponse(resultObj, 1, config.messages['show_all_tailor'], true);
                res.send(finalRes)
            }, function (errorCode) {
                var finalRes = formatter.formatResponse({}, 0, errorCode, false);
                res.send(finalRes)
            })
    }
);



Router.post('/addFavourite',
    upload.none(),
    routesMiddlewares.validateRequest(userValidation.addFavouriteSchema),
    function (req, res) {
        userCtrl.addFavourite(req)
            .then((resultObj) => {
                var finalRes = formatter.formatResponse(resultObj, 1, config.messages['add_favourite_success'], true);
                res.send(finalRes)
            }, function (errorCode) {
                var finalRes = formatter.formatResponse({}, 0, errorCode, false);
                res.send(finalRes)
            })
    }
)

Router.post('/showAllFavourites',
    routesMiddlewares.validateRequest(userValidation.showAllFavouritesSchema),
    upload.none(),
    function (req, res) {
        userCtrl.showAllFavourites(req)
            .then((resultObj) => {
                var finalRes = formatter.formatResponse(resultObj, 1, config.messages['show_all_favourite'], true);
                res.send(finalRes)
            }, function (errorCode) {
                var finalRes = formatter.formatResponse({}, 0, errorCode, false);
                res.send(finalRes)
            })
    }
)

Router.post('/Review',
    upload.none(),
    routesMiddlewares.validateRequest(userValidation.ReviewSchema),
    function (req, res) {
        userCtrl.Review(req)
            .then((resultObj) => {
                var finalRes = formatter.formatResponse(resultObj, 1, config.messages['add_review'], true);
                res.send(finalRes)
            }, function (errorCode) {
                var finalRes = formatter.formatResponse({}, 0, errorCode, false);
                res.send(finalRes)
            })
    }
)

///////////////////////        TAILOR ROUTES          ///////////////////////


Router.post('/addMultiplePhotos',
    upload.any(),
    routesMiddlewares.validateRequest(userValidation.addMultiplePhotos),
    function (req, res) {
        userCtrl.addMultiplePhotos(req)
            .then((resultObj) => {
                var finalRes = formatter.formatResponse(resultObj, 1, config.messages['multiple_photo_success'], true);
                res.send(finalRes)
            }, function (errorCode) {
                var finalRes = formatter.formatResponse({}, 0, errorCode, false);
                res.send(finalRes)
            })
    }
);




Router.post('/setSkills',
    upload.any(),
    routesMiddlewares.validateRequest(userValidation.setSkillsSchema),
    function (req, res) {
        userCtrl.setSkills(req)
            .then((resultObj) => {
                // console.log(resultObj)
                var finalRes = formatter.formatResponse(resultObj, 1, config.messages['skills_added_success'], true);
                res.send(finalRes)
            }, function (errorCode) {
                var finalRes = formatter.formatResponse({}, 0, errorCode, false);
                res.send(finalRes)
            })
    }
);



Router.post('/updateSkills',
    upload.any(),
    routesMiddlewares.validateRequest(userValidation.updateSkillsSchema),
    function (req, res) {
        userCtrl.updateSkills(req)
            .then((resultObj) => {
                // console.log(resultObj)
                var finalRes = formatter.formatResponse(resultObj, 1, config.messages['skills_update_success'], true);
                res.send(finalRes)
            }, function (errorCode) {
                var finalRes = formatter.formatResponse({}, 0, errorCode, false);
                res.send(finalRes)
            })
    }
);

Router.post('/showTailorDetails',
    upload.any(),
    routesMiddlewares.validateRequest(userValidation.showTailorDetailsSchema),
    function (req, res) {
        userCtrl.showTailorDetails(req)
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

Router.post('/bookAppoinment',
    upload.any(),
    routesMiddlewares.validateRequest(userValidation.bookAppoinmentSchema),
    function (req, res) {
        userCtrl.bookAppoinment(req)
            .then((resultObj) => {
                var finalRes = formatter.formatResponse(resultObj, 1, config.messages['book_appoinment_success'], true)
                res.send(finalRes)
            }, function (errorCode) {
                var finalRes = formatter.formatResponse({}, 0, errorCode, false)
                res.send(finalRes)
            })
    }
);

Router.post('/showALLNotification',
    upload.none(),
    routesMiddlewares.validateRequest(userValidation.showALLNotificationSchema),
    function (req, res) {
        userCtrl.showALLNotification(req)
            .then((resultObj) => {
                var finalRes = formatter.formatResponse(resultObj, 1, config.messages['show_notificaiton_success'], true)
                res.send(finalRes)
            }, function (errorCode) {
                var finalRes = formatter.formatResponse({}, 0, errorCode, false)
                res.send(finalRes)
            })
    }
)



Router.post('/setBusinessHours',
    routesMiddlewares.validateRequest(userValidation.setBusinessHoursSchema),
    function (req, res) {
        userCtrl.setBusinessHours(req)
            .then((resultObj) => {
                // console.log(resultObj)
                var finalRes = formatter.formatResponse(resultObj, 1, config.messages['set_businessHours_success'], true);
                res.send(finalRes)
            }, function (errorCode) {
                var finalRes = formatter.formatResponse({}, 0, errorCode, false);
                res.send(finalRes)
            })
    }
)

Router.post('/updateBusinessHours',
    routesMiddlewares.validateRequest(userValidation.updateBusinessHoursSchema),
    function (req, res) {
        userCtrl.updateBusinessHours(req)
            .then((resultObj) => {
                // console.log(resultObj)
                var finalRes = formatter.formatResponse(resultObj, 1, config.messages['update_businessHours_success'], true);
                res.send(finalRes)
            }, function (errorCode) {
                var finalRes = formatter.formatResponse({}, 0, errorCode, false);
                res.send(finalRes)
            })
    }
)

Router.post('/pendingRequest',
    upload.none(),
    routesMiddlewares.validateRequest(userValidation.pendingRequestSchema),
    function (req, res) {
        userCtrl.pendingRequest(req, res)
            .then((resultObj) => {
                var finalRes = formatter.formatResponse(resultObj, 1, config.messages['show_pending_req_success'], true);
                res.send(finalRes)
            }, function (errorCode) {
                console.log('😃😃😃😃',errorCode)
                var finalRes = formatter.formatResponse({}, 0, errorCode, false);
                res.send(finalRes)
            })
    }
)

Router.post('/completedRequest',
    upload.none(),
    routesMiddlewares.validateRequest(userValidation.completedRequestSchema),
    function (req, res) {
        userCtrl.completedRequest(req, res)
            .then((resultObj) => {
                var finalRes = formatter.formatResponse(resultObj, 1, config.messages['show_completed_req_success'], true);
                res.send(finalRes)
            }, function (errorCode) {
                var finalRes = formatter.formatResponse({}, 0, errorCode, false);
                res.send(finalRes)
            })
    }
)
Router.post('/completeBookAppoinment',
    upload.none(),
    routesMiddlewares.validateRequest(userValidation.completeBookAppoinmentSchema),
    function (req, res) {

        userCtrl.completeBookAppoinment(req, res)
            .then((resultObj) => {
                var finalRes = formatter.formatResponse(resultObj, 1, config.messages['complete_bookApp_success'], true);
                res.send(finalRes)
            }, function (errorCode) {
                var finalRes = formatter.formatResponse({}, 0, errorCode, false);
                res.send(finalRes)
            })
    }
);

Router.post('/showALLReviews',
    upload.none(),
    routesMiddlewares.validateRequest(userValidation.showALLReviewsSchema),
    function (req, res) {
        userCtrl.showALLReviews(req, res)
            .then((resultObj) => {
                var finalRes = formatter.formatResponse(resultObj, 1, config.messages['show_review_success'], true)
                res.send(finalRes);
            }, function (errorCode) {
                var finalRes = formatter.formatResponse({}, 0, errorCode, false)
                res.send(finalRes);
            })
    }
)



Router.post('/notificationAccORDec',
    upload.any(),
    routesMiddlewares.validateRequest(userValidation.notificationAccORDecSchema),
    function (req, res) {
        userCtrl.notificationAccORDec(req, res)
            .then((resultObj) => {
                const { is_status } = req.body;
                if (is_status === 'accepted') {
                    var finalRes = formatter.formatResponse(resultObj, 1, config.messages['notification_accepted'], true);
                    res.send(finalRes)
                } else if (is_status === 'declined') {
                    var finalRes = formatter.formatResponse(resultObj, 1, config.messages['notification_decline'], true);
                    res.send(finalRes);
                } else {
                    res.send({ message: "Sorry we have not found any notification" });
                }
            }, function (errorCode) {
                var finalRes = formatter.formatResponse({}, 0, errorCode, false);
                res.send(finalRes)
            })
    }
);


Router.post('/clearAllNotifications',
    upload.none(),
    routesMiddlewares.validateRequest(userValidation.clearAllNotificationsSchema),
    function (req, res) {
        userCtrl.clearAllNotifications(req, res)
            .then((resultObj) => {
                var finalRes = formatter.formatResponse(resultObj, 1, config.messages['delete_notificaitons_success'], true);
                res.send(finalRes)
            }, function (errorCode) {
                var finalRes = formatter.formatResponse({}, 0, errorCode, false);
                res.send(finalRes)
            })
    }
)

Router.post('/userPending',
    upload.none(),
    routesMiddlewares.validateRequest(userValidation.userPendingSchema),
    function (req, res) {
        userCtrl.userPending(req, res)
            .then((resultObj) => {
                var finalRes = formatter.formatResponse(resultObj, 1, config.messages['show_pending_req_success'], true);
                res.send(finalRes)
            }, function (errorCode) {
                var finalRes = formatter.formatResponse({}, 0, errorCode, false);
                res.send(finalRes)
            })
    }
)

Router.post('/userCompleted',
    upload.none(),
    routesMiddlewares.validateRequest(userValidation.userCompletedSchema),
    function (req, res) {
        userCtrl.userCompleted(req, res)
            .then((resultObj) => {
                var finalRes = formatter.formatResponse(resultObj, 1, config.messages['show_completed_req_success'], true);
                res.send(finalRes)
            }, function (errorCode) {
                var finalRes = formatter.formatResponse({}, 0, errorCode, false);
                res.send(finalRes)
            })
    }
)






module.exports = Router;
