const userMaster = require('../model/user_master');
const fs = require('fs');
const Q = require('q');
const config = require('../config/common.config');
const publicPath = basedir + '/public/';
const jwt = require('jsonwebtoken');
const imageMaster = require('../model/image_master');
const TailorSkillMaster = require('../model/tailor_skills_master')
const moment = require('moment');
const notificationMaster = require('../model/notification_master')
const sendMail = require('../utils/sendMail');
const userController = {};
const OTPMaster = require('../model/OTPMaster');
const { contactUsMail } = require('../utils/contentProvider');
// const moment = require('moment');
const BusinessHoursMaster = require('../model/business_hours_master');
const reviewMaster = require('../model/review_master')
const favouriteMaster = require('../model/favourite_master');
const categoryMaster = require('../model/category_master');
const bookAppoinment = require('../model/book_appoinment')
const SkillMasters = require('../model/category_master');
const mongoose = require('mongoose')
const path = require('path');
const convertLocalTimeToUTC = require('../helper/convert_localToUTC_time');
const baseURL = 'http://localhost:3456/public/';
// const { exist } = require('joi');
// const { off } = require('process');

userController.sendOtpForSignUp = async (req, res) => {
    const deferred = Q.defer();
    const { phone } = req.body;
    try {
        let user = await userMaster.findOne({ phone: phone, default: null });
        if (user) {
            deferred.reject('not_registered');
            return deferred.promise;

        }
        // Generate otp
        let otp_code = makeid(4);
        let new_otp = OTPMaster();
        new_otp.otp_code = otp_code;
        new_otp.phone = phone;
        new_otp.expireAt = new Date();
        new_otp.save();
        deferred.resolve(new_otp.otp_code);
    } catch (errorCode) {
        console.log('adminController.sendOtpForSignUp-', errorCode)
        deferred.reject(errorCode);
    }
    return deferred.promise;
}

userController.signUp = async (req, res) => {
    const deferred = Q.defer();
    const { fname, lname, phone, pastcode, password, language, Bio, otp, user_type, city, street, latitude, longitude } = req.body;

    try {
        // Check OTP validity
        let otpData = await OTPMaster.findOne({ otp_code: otp, phone });
        console.log('😃😃😃😃',otpData)
        if (!otpData) {
            deferred.reject('invalid_otp');
            return deferred.promise;
        }

        if (otpData.otp_code == otp) {
            // Check if user already exists
            let checkUser = await userMaster.findOne({ phone });
            if (checkUser) {
                return deferred.reject('already_register');
            } else {
                let profile = req.file ? (req.file.filename ?? '') : '';

                // Ensure latitude and longitude are defined
                if (!latitude || !longitude) {
                    return deferred.reject('latitude_or_longitude_missing');
                }

                // Prepare the location field
                const location = {
                    type: 'Point',
                    coordinates: [parseFloat(longitude), parseFloat(latitude)] // [longitude, latitude]
                };

                // Create new user
                let user = new userMaster({
                    fname,
                    lname,
                    phone,
                    Bio,
                    language,
                    pastcode,
                    password,
                    user_type,
                    location,
                    city,
                    street,
                    profile
                });

                await user.save();
                await OTPMaster.deleteOne({ _id: otpData._id });

                deferred.resolve(user);
            }
        } else {
            deferred.reject('invalid_otp');
        }
    } catch (error) {
        console.log('userController.signUp - Error:', error);
        deferred.reject(error);
    }

    return deferred.promise;
};

userController.login = async (req) => {
    const deferred = Q.defer();
    const { phone, password } = req.body;
    try {
        let checkUser = await userMaster.findOne({ phone, default: null });
        if (checkUser) {
            if (checkUser.user_type == 'tailor') {
                if (checkUser.is_status == 'accepted') {
                    if (checkUser.password == password) {
                        let payLoad = {
                            userId: checkUser._id
                        };
                        let token = jwt.sign(payLoad, config.jwt.secret, { expiresIn: config.jwt.token_expiry });
                        deferred.resolve(token);
                    } else {
                        deferred.reject('incorrect_password')
                    }
                } else {
                    deferred.reject("You are currently pending. Please wait until you are accepted.");
                }
            } else {
                if (checkUser.password == password) {
                    let payLoad = {
                        userId: checkUser._id
                    };
                    let token = jwt.sign(payLoad, config.jwt.secret, { expiresIn: config.jwt.token_expiry });
                    deferred.resolve(token);
                } else {
                    deferred.reject('incorrect_password')
                }
            }
        } else {
            deferred.reject('invalid_user_id')
        }
    } catch (errorCode) {
        console.log('userController.login-', config.errorCode)
        deferred.reject(errorCode)
    }
    return deferred.promise;
}

userController.forgetPassword = async (req, res) => {
    const deferred = Q.defer();
    const { phone } = req.body;
    try {
        let otp_code = makeid(4);
        let newOtp = OTPMaster();
        newOtp.otp_code = otp_code;
        newOtp.phone = phone;
        newOtp.expireAt = new Date();
        newOtp.save();

        let userResponseObj = await userMaster.findOneAndUpdate({ phone }, { ccode: newOtp }, { new: true });
        deferred.resolve(newOtp.otp_code);


    } catch (errorCode) {
        console.log('userController.forgetPassword-', errorCode)
        deferred.reject(errorCode)
    }
    return deferred.promise;
}

userController.verfiyOtp = async (req, res) => {
    const deferred = Q.defer();
    const { otp, phone } = req.body;
    try {
        console.log('😃', req.body)
        let checkOtp = await OTPMaster.findOne({ otp_code: otp, phone });
        if (checkOtp != null) {
            await OTPMaster.deleteOne({ _id: checkOtp._id })
            deferred.resolve({});
        } else {
            deferred.reject('invalid_otp')
        }
    } catch (errorCode) {
        console.log('userController.verifyOtp-', errorCode)
        deferred.reject(errorCode)
    }
    return deferred.promise;
}

userController.resetPassword = async (req, res) => {
    const deferred = Q.defer();
    const { old_password, new_password } = req.body;
    try {
        let userResponse = req.user
        // console.log('😂',userResponse);
        if (userResponse != null) {
            if (userResponse.password != old_password) {
                deferred.reject("Please check you old password.")
            } else if (userResponse.password == new_password) {
                deferred.reject("Your new password is same as old password. Please use different new password.");
            };

            userResponse = await userMaster.findByIdAndUpdate(userResponse._id, { password: new_password }, { new: true });
            deferred.resolve(userResponse);
        }
    } catch (error) {
        console.log('adminController.resetPassword-', error)
        deferred.reject(error);
    }
    return deferred.promise;
}

userController.changePassword = async (req, res) => {
    const deferred = Q.defer();
    const { old_password, new_password, user_id } = req.body;
    try {
        let userDetail = await userMaster.findOne({ _id: user_id, default: null });
        if (userDetail) {
            if (userDetail.password != old_password) {
                deferred.reject('check_old_password')
            } else if (old_password == new_password) {
                deferred.reject('check_password')
            }
            let userResponseObj = await userMaster.findByIdAndUpdate({ _id: user_id }, { password: new_password }, { new: true });
            deferred.resolve(userResponseObj);
        } else {
            deferred.reject('invalid_user_id');
        }
    } catch (errorCode) {
        console.log('userController.changePassword-', errorCode);
        deferred.reject(errorCode)
    }
    return deferred.promise;
}

userController.updateProfile = async (req, res) => {
    const deferred = Q.defer();
    const { fname, lname, pastcode, Bio, _id, city, street, deleteImages } = req.body;

    try {
        console.log('Request files:', req.files);
        let profile = ''; // For storing profile image
        let imageArray = []; // For storing new images

        // Check if files are present in the request
        if (req.files && req.files.length > 0) {
            for (let file of req.files) {
                if (file.fieldname == 'profile') {
                    profile = file.filename; // Store profile image filename
                    console.log("Uploaded profile image: ", profile);
                } else if (file.fieldname == 'images') {
                    imageArray.push(file.filename); // Store images in the array
                    console.log("Uploaded image: ", file.filename);
                }
            }
        }

        // Find the tailor by _id
        const userDetail = await userMaster.findById(_id);
        if (!userDetail) {
            deferred.reject('We are not able to find this tailor.');
            return deferred.promise;
        }

        // Prepare the data to update
        let updateData = { fname, lname, Bio, pastcode, city, street };

        // Handle profile image update
        if (profile) {
            updateData.profile = profile;

            if (userDetail.profile) {
                // Remove the old profile image
                let oldProfilePath = path.join(publicPath, userDetail.profile);
                fs.unlink(oldProfilePath, (err) => {
                    if (err) {
                        console.log('Error deleting old profile image:', err);
                    }
                });
            }
        }

        // Update the user's profile data
        let updatedUser = await userMaster.findByIdAndUpdate(
            _id,
            updateData,
            { new: true }
        );

        // Handle image deletion if the user is a tailor
        if (userDetail.user_type === 'tailor') {
            if (deleteImages) {
                let imageDoc = await imageMaster.findOne({ tailor_id: _id });
                if (imageDoc) {
                    await imageMaster.findOneAndUpdate(
                        { tailor_id: _id },
                        { $pull: { images: { $in: deleteImages } } },
                        { new: true }
                    );

                    // Delete the image files
                    for (let img of deleteImages) {
                        let oldPath = path.join(publicPath, img);
                        fs.unlink(oldPath, (err) => {
                            if (err) {
                                console.log('Error deleting image:', err);
                            }
                        });
                    }
                } else {
                    deferred.reject("We are not able to find the tailor's images.");
                    return deferred.promise;
                }
            }

            // Handle new images addition
            if (imageArray.length > 0) {
                let imageDoc = await imageMaster.findOne({ tailor_id: _id });
                if (imageDoc) {
                    await imageMaster.findOneAndUpdate(
                        { tailor_id: _id },
                        { $push: { images: { $each: imageArray } } },
                        { new: true }
                    );
                } else {
                    // If image document doesn't exist, create a new one
                    await imageMaster.create({
                        tailor_id: _id,
                        images: imageArray
                    });
                }
            }
        }

        deferred.resolve(updatedUser);

    } catch (errorCode) {
        console.log('userController.updateProfile-', errorCode);
        deferred.reject(errorCode);
    }

    return deferred.promise;
}

userController.changeLanguage = async (req, res) => {
    const deferred = Q.defer();
    const { old_language, new_language, _id } = req.body;
    try {
        let checkUser = await userMaster.findById({ _id, deleted_at: null });
        console.log('😃', checkUser)
        if (checkUser != null) {
            if (checkUser.language != old_language) {
                deferred.reject('check_old_language')
                return deferred.promise;
            } else if (checkUser.language == new_language) {
                deferred.reject('check_language');
                return deferred.promise;
            }
            let user = await userMaster.findByIdAndUpdate(_id, { language: new_language }, { new: true });
            deferred.resolve(user)
        } else {
            deferred.reject('invalid_user_id')
        }
    } catch (errorCode) {
        console.log('usercontroller.changeLanguage-', errorCode);
        deferred.reject(errorCode);
    }
    return deferred.promise;
};

userController.logOut = async (req, res) => {
    const deferred = Q.defer();
    const { _id } = req.body;
    try {
        let userResponseObj = await userMaster.findByIdAndUpdate(_id);
        // console.log(userResponseObj)
        if (userResponseObj) {
            deferred.resolve({})
        } else {
            deferred.reject();
        }
    } catch (errorCode) {
        console.log('usercontroller.logOut-', errorCode);
        deferred.reject(errorCode);
    }
    return deferred.promise;
}

userController.deleteAccount = async (req, res) => {
    const deferred = Q.defer();
    const { _id } = req.body;
    try {
        let userResponseObj = await userMaster.findByIdAndUpdate(_id, { deleted_at: new Date() })
        if (userResponseObj) {
            deferred.resolve({})
        } else {
            deferred.reject();
        }
    } catch (errorCode) {
        console.log('usercontroller.deleteAccount-', errorCode);
        deferred.reject(errorCode);
    }
    return deferred.promise
}

userController.home = async (req, res) => {
    const deferred = Q.defer();
    // const { sub_skill } = req.body;
    try {
        let homePage = await categoryMaster.find({ subCategory: null }, 'category_name img -_id')
        deferred.resolve(homePage)
    } catch (error) {
        console.log('usercontroller.showAllSkills-', errorCode);
        deferred.reject(errorCode);
    }
    return deferred.promise
}

userController.addFavourite = async (req, res) => {
    const deferred = Q.defer()
    const { user_id, tailor_id } = req.body;
    try {
        const existingFavourite = await favouriteMaster.findOne({ user_id: user_id, tailor_id: tailor_id });
        

        if (!existingFavourite) {
            await favouriteMaster.deleteOne({ _id: existingFavourite._id });
            deferred.reject("UnFavourite successfull.");
            // favouriteMaster.save()
        } else {
            const newFavourite = new favouriteMaster({
                user_id: user_id,
                tailor_id: tailor_id
            });
            await newFavourite.save();
            deferred.resolve(newFavourite);
        }
    } catch (error) {
        console.log('usercontroller.favourite-', errorCode);
        deferred.reject(errorCode);
    }
    return deferred.promise;
}

userController.showAllFavourites = async (req, res) => {
    const deferred = Q.defer();
    const { user_id } = req.body;
    try {
        const favourites = await favouriteMaster.findOne({ user_id: user_id });
        console.log(favourites);
        if (!favourites) {
            deferred.reject("We are not able to find any favourite.");
            return deferred.promise;
        };
        const showallfavourite = await favouriteMaster.aggregate([
            {
                $match: { user_id: new mongoose.Types.ObjectId(user_id) }

            },
            {
                $lookup: {
                    from: 'user_masters',
                    localField: 'tailor_id',
                    foreignField: '_id',
                    as: 'tailorDetails'
                }
            },
            {
                $unwind: '$tailorDetails'

            },
            {
                $match: {
                    'tailorDetails.user_type': 'tailor' // Assuming user_type is the field in user_masters
                }
            },
            {
                $lookup: {
                    from: 'review_masters',
                    localField: 'user_id',
                    foreignField: 'user_id',
                    as: 'rating'
                }
            },
            // {
            //     $unwind: { path: '$rating', preserveNullAndEmptyArrays: true }
            // },
            {
                $project: {
                    _id: 1,
                    profile: { $concat: [baseURL, 'profile/', '$tailorDetails.profile'] },
                    fname: '$tailorDetails.fname',
                    lname: '$tailorDetails.lname',
                    street: '$tailorDetails.street',
                    location: '$tailorDetails.location',
                    city: '$tailorDetails.city',
                    Bio: '$tailorDetails.Bio',
                    avgRating: { $avg: '$rating.rating' }
                }
            }

        ]);
        console.log('😂', showallfavourite)
        if (showallfavourite.length > 0) {
            deferred.resolve(showallfavourite)
        } else {
            deferred.reject("We are not able to find any favourite.");
        }
        deferred.resolve(showallfavourite);
    } catch (error) {
        console.log('usercontroller.showAllFavourites-', error);
        deferred.reject(error);
    }
    return deferred.promise;
}

userController.listOfTailors = async (req, res) => {
    const deferred = Q.defer();
    const { category_id, distance, longitude, latitude } = req.body; // assuming distance is passed in request body
    try {
        let user_id = req.user;
        console.log(user_id)
        let checkUser = await userMaster.findById(user_id);
        console.log('👌👌👌', checkUser);
        if (!checkUser) {
            deferred.reject("We are not able to find this user");
            return deferred.promise;
        }
        let pipeline = [
            {
                $match: {
                    is_status: "accepted",
                    user_type: 'tailor' // Always include user_type filter
                }
            },
            {
                $lookup: {
                    from: 'tailor_skill_masters',
                    localField: '_id',
                    foreignField: 'tailor_id',
                    as: 'tailorSkills'
                }
            },
            { $unwind: '$tailorSkills' },
            {
                $lookup: {
                    from: 'category_masters',
                    localField: 'tailorSkills.sub_skill_id',
                    foreignField: '_id',
                    as: 'categories'
                }
            },
            { $unwind: '$categories' },
            { $match: { 'categories.subCategory': { $ne: null } } },
            {
                $lookup: {
                    from: 'review_masters',
                    localField: '_id',
                    foreignField: 'tailor_id',
                    as: 'rating'
                }
            },
            { $unwind: '$rating' },
            {
                $lookup: {
                    from: 'favourite_masters', // Lookup favorites for this tailor
                    localField: '_id', // Match tailor_id
                    foreignField: 'tailor_id', // Foreign field is tailor_id in favourites
                    as: 'favourite',
                    pipeline: [
                        {
                            $match: { user_id: checkUser._id }
                        }
                    ]
                }
            },
            {
                $match: {
                    'tailorSkills.skill_id': new mongoose.Types.ObjectId(category_id)
                }
            },
            // {
            //     $project: {
            //         _id: 0,
            //         profile: 1,
            //         fname: 1,
            //         lname: 1,
            //         Bio: 1,
            //         category_name: '$categories.category_name',

            //         // img: '$categories.img',
            //         rating: '$rating.rating',
            //         favourite: {
            //             $cond: {
            //                 if: { $gt: [{ $size: '$favourite' }, 0] }, // If favourite array has more than 0 entries
            //                 then: 1, // Tailor is marked as favourite
            //                 else: 0  // Tailor is not a favourite
            //             }
            //         }
            //     }
            // }

            {
                $group: {
                    _id: '$_id',
                    profile: { $first: { $concat: [baseURL, 'profile/', '$profile'] } },
                    fname: { $first: '$fname' },
                    lname: { $first: '$lname' },
                    Bio: { $first: '$Bio' },
                    rating: { $avg: '$rating.rating' }, // Average rating
                    categories: { $addToSet: '$categories.category_name' },
                    favouriteCount: { $sum: { $cond: [{ $gt: [{ $size: '$favourite' }, 0] }, 1, 0] } } // Count of favourites
                }
            },
            {
                $project: {
                    _id: 1,
                    profile: 1,
                    fname: 1,
                    lname: 1,
                    Bio: 1,
                    category_name: '$categories',
                    averageRating: "$rating",
                    favourite: { $cond: [{ $gt: ['$favouriteCount', 0] }, 1, 0] },
                }
            }
        ];
        // Optional distance filtering
        if (distance && longitude && latitude) {
            pipeline.unshift({
                $geoNear: {
                    // near: { type: "Point", coordinates: [longitude, latitude] }, // Use provided longitude and latitude
                    near: {
                        type: "Point",
                        coordinates: [parseFloat(longitude), parseFloat(latitude)] // Ensure these are numbers
                    },

                    distanceField: "distance",
                    spherical: true,
                }
            });
        }
        let result = await userMaster.aggregate(pipeline);
        console.log('😂😂😂', result)
        if (result.length === 0) {
            deferred.reject('No tailor details found');
            return deferred.promise;
        }
        deferred.resolve(result);
    } catch (error) {
        console.error('userController.listOfTailors - Error:', error);
        deferred.reject(error);
    }
    return deferred.promise;
};

userController.Review = async (req, res) => {
    const deferred = Q.defer();
    const { user_id, tailor_id, rating, comment } = req.body;
    try {

        let checkBookAPPComp = await bookAppoinment.findOne({ tailor_id: tailor_id, user_id: user_id });
        if (checkBookAPPComp) {
            if (checkBookAPPComp.is_status == 'completed') {
                let checkReview = await reviewMaster.findOne({ tailor_id: tailor_id, user_id: user_id });
                if (!checkReview) {
                    let addReview = new reviewMaster();
                    addReview.user_id = user_id
                    addReview.tailor_id = tailor_id;
                    addReview.rating = rating;
                    addReview.comment = comment;
                    await addReview.save();
                    deferred.resolve(addReview);
                } else {
                    deferred.reject("You already give 1 time review on this tailor.");
                }
            } else {
                deferred.reject("Sorry.Your appoinment is not completed yet.")
            }
        } else {
            deferred.reject("We are not able to find this bookAppoinment.")
        }

        // let checkReview = await reviewMaster.findOne({ user_id: user_id, tailor_id: tailor_id });
        // if (!checkReview) {
        //     let createReview = new reviewMaster({
        //         user_id: user_id,
        //         tailor_id: tailor_id,
        //         rating: rating,
        //         comment: comment
        //     })
        //     await createReview.save();
        //     deferred.resolve(createReview);
        // }
        // else {
        //     await reviewMaster.deleteOne({ _id: checkReview._id });
        //     let updateReview = await reviewMaster.findOneAndUpdate({ user_id, tailor_id }, { rating: rating }, { comment: comment }, { new: true });
        //     deferred.resolve(updateReview);
        // }
    } catch (errorCode) {
        console.log('usercontroller.Review-', errorCode);
        deferred.reject(errorCode);
    }
    return deferred.promise;
}

// userController.bookAppoinment = async (req, res) => {
//     try {
//         const deferred = Q.defer()
//         const { user_id, tailor_id, date, time, skill, note, name } = req.body;
//         const convertToUTC = (utcTime, format) => {
//             return moment.utc(utcTime).local().format(format);
//         };
//         // console.log('😒',convertToUTC)
//         const convertTimeToUTC = (time, format) => {
//             return moment(time, 'HH:mm A').utc().format(format);
//         };

//         const userExists = await userMaster.findOne({ _id: user_id });
//         if (!userExists) {
//             return Promise.reject({ success: false, message: 'User not found.' });
//         }

//         const tailorExists = await userMaster.findOne({ _id: tailor_id });
//         if (!tailorExists) {
//             return Promise.reject({ success: false, message: 'Tailor not found.' });
//         }

//         const appointmentExists = await bookAppoinment.findOne({user_id,date,time,skill,note });
//         if (appointmentExists) {
//             return Promise.reject({message: 'User already has an appointment.' });
//         }

//         // Fetch business hours and convert to local time
//         const businessHours = await BusinessHoursMaster.find({ tailor_id });
//         const localBusinessHours = businessHours.map(bh => ({
//             ...bh._doc,
//             start: convertToUTC(bh.start, 'HH:mm'),
//             end: convertToUTC(bh.end, 'HH:mm'),
//             breakStart: bh.breakStart ? convertToUTC(bh.breakStart, 'HH:mm') : null,
//             breakEnd: bh.breakEnd ? convertToUTC(bh.breakEnd, 'HH:mm') : null
//         }));
//         // console.log('😒😒😒',localBusinessHours)

//         const appointmentDate = new Date(date);
//         const dayOfWeek = appointmentDate.toLocaleDateString('en-US', { weekday: 'long' });
//         // console.log('🤷‍♂️🤷‍♂️🤷‍♂️🤷‍♂️🤷‍♂️🤷‍♂️🤷‍♂️🤷‍♂️🤷‍♂️🤷‍♂️🤷‍♂️',dayOfWeek)  // en-US language mate che like US = English language . weekday:'long'  full spelling like Monday . instead ('mon');

//         const businessHoursForDay = localBusinessHours.find(bh => bh.day = dayOfWeek)
//         console.log('🤷‍♂️🤷‍♂️🤷‍♂️🤷‍♂️🤷‍♂️🤷‍♂️🤷‍♂️🤷‍♂️🤷‍♂️🤷‍♂️🤷‍♂️🤷‍♂️🤷‍♂️🤷‍♂️🤷‍♂️🤷‍♂️🤷‍♂️',businessHoursForDay);

//         if (!businessHoursForDay.open) {
//             return Promise.reject({ message: 'Tailor is closed for the entire day.' });
//         }
//         console.log('✔✔✔✔✔✔✔✔',businessHoursForDay.open);

//         const appointmentTime = moment(time, 'hh:mm A').format('HH:mm');

//         const isAvailable = appointmentTime >= businessHoursForDay.start &&
//             appointmentTime <= businessHoursForDay.end;

//         if (!isAvailable) {
//             return Promise.reject('Appointment time is outside of business hours.');
//         }

//         if (appointmentTime >= businessHoursForDay.breakStart && appointmentTime <= businessHoursForDay.breakEnd) {
//             return Promise.reject('Appointment during break time.');
//         }

//         const newAppointment = new bookAppoinment({
//             user_id,
//             tailor_id,
//             date: convertTimeToUTC(date),
//             time: convertTimeToUTC(time),
//             skill,
//             note,
//         });

//         await newAppointment.save();
//         console.log('🎶🎶🎶🎶🎶',newAppointment);

//         // const newNotification = new notificationMaster({
//         //     sender_id: user_id,
//         //     receiver_id: tailor_id,
//         //     is_status: 'Appointment Booked',
//         // });
//         // await newNotification.save();

//         deferred.resolve(newAppointment);
//     } catch (error) {
//         console.error('Error booking appointment:', error);
//         // return res.status(500).json({ error: 'An error occurred while booking the appointment.' });
//     }
//     return deferred.promise
// };

userController.bookAppoinment = async (req, res) => {
    const deferred = Q.defer();
    const { user_id, tailor_id, date, time, skill, note, message } = req.body;
    const parseDate = (dateString) => {
        const parsedDate = moment.utc(dateString, moment.ISO_8601, true);
        if (!parsedDate.isValid()) {
            // console.error('Invalid date format:', dateString);
            return null;
        }
        return parsedDate.format('HH:mm');
    };

    try {
        const userExists = await userMaster.findOne({ _id: user_id });
        if (!userExists) {
            deferred.reject('User not found.');
            return deferred.promise;
        }

        const tailorExists = await userMaster.findOne({ _id: tailor_id });
        if (!tailorExists) {
            deferred.reject('Tailor not found.');
            return deferred.promise;
        }

        const appointmentDate = new Date(date);

        const workTime = new Date(time);
        // console.log('💕💕💕',workTime)

        const existingAppoinment = await bookAppoinment.findOne({
            user_id: user_id,
            tailor_id: tailor_id,
            time: workTime.toISOString(),
        })
        // console.log('💕💕💕💕',existingAppoinment);
        // console.log('😁😁😁😁😁',req.body)
        if (existingAppoinment) {
            deferred.reject("You already has an appoinment.Please book another time.");
            return deferred.promise;
        }


        // console.log('✔', appointmentDate)
        const dayOfWeek = appointmentDate.toLocaleDateString('en-US', { weekday: 'long' }); // Full weekday name 
        // console.log('Day of the Week:', dayOfWeek);

        const businessHours = await BusinessHoursMaster.find({ tailor_id });
        const localBusinessHours = businessHours.map(bh => ({
            ...bh._doc,
            start: parseDate(bh.start),
            end: parseDate(bh.end),
            breakStart: bh.breakStart ? parseDate(bh.breakStart) : null,
            breakEnd: bh.breakEnd ? parseDate(bh.breakEnd) : null
        }));
        // console.log('Local Business Hours:', localBusinessHours);

        const businessHoursForDay = localBusinessHours.find(bh => bh.day = dayOfWeek);
        // console.log('✔✔✔✔✔✔✔✔✔✔✔✔✔✔✔✔', businessHoursForDay);

        if (!businessHoursForDay.open) {
            deferred.reject('Tailor is closed for the entire day.');
            return deferred.promise;
        }
        // console.log('✔✔✔✔✔✔✔✔✔✔✔✔✔✔✔✔', businessHoursForDay.open)

        const start = businessHoursForDay.start;
        // console.log(start)
        const end = businessHoursForDay.end;
        // console.log(end)
        const breakStart = businessHoursForDay.breakStart;
        // console.log(breakStart)
        const breakEnd = businessHoursForDay.breakEnd;
        // console.log(breakEnd)

        const workHours = workTime.getUTCHours().toString().padStart(2, '0');
        const workMinutes = workTime.getUTCMinutes().toString().padStart(2, '0');
        const workAppointmentTime = `${workHours}:${workMinutes}`

        // console.log('✔✔✔✔✔✔✔', workAppointmentTime)
        const isAvailable = workAppointmentTime >= start && workAppointmentTime <= end;
        if (!isAvailable) {
            deferred.reject({ success: false, message: 'Appointment time is outside of business hours.' });
            return deferred.promise;
        };
        // console.log('✔✔✔✔✔✔✔✔✔✔✔✔✔✔', isAvailable)

        if (workAppointmentTime >= breakStart && workAppointmentTime <= breakEnd) {
            deferred.reject('Appointment time is during break time.');
            return deferred.promise;
        }

        const newAppointment = new bookAppoinment({
            user_id,
            tailor_id,
            date: appointmentDate.toISOString(),  // Store date in UTC
            // time: moment.utc(time, 'HH:mm:ss').format('HH:mm:ss'),  // Store time in UTC
            time: workTime.toISOString(),  // Store time in UTC
            skill,
            note,
        });
        await newAppointment.save();

        const newNotification = new notificationMaster({
            sender_id: user_id,
            receiver_id: tailor_id,
            message: message
        });
        await newNotification.save();
        console.log(newNotification);
        deferred.resolve(newAppointment);
    } catch (error) {
        console.error('Error booking appointment:', error);
        deferred.reject( error);
    }
    return deferred.promise;
};

userController.userPending = async (req, res) => {
    const deferred = Q.defer();
    const { user_id } = req.body;
    try {
        let tailorResponse = await userMaster.findById(user_id);
        // console.log('👌👌👌👌', tailorResponse);
        if (!tailorResponse) {
            deferred.reject('We are not able to find this user');
            return deferred.promise;
        }
        const appointments = await bookAppoinment.aggregate([
            {
                $match: { is_status: 'pending', user_id: tailorResponse._id },
            },
            {
                $lookup: {
                    from: 'user_masters',
                    localField: 'tailor_id',
                    foreignField: '_id',
                    as: 'tailorDetails'
                }
            },
            {
                $unwind: '$tailorDetails'
            },
            {
                $lookup: {
                    from: 'review_masters',
                    localField: 'tailor_id',
                    foreignField: 'tailor_id',
                    as: 'rating'
                }
            },
            // {
            //     $unwind: { path: '$reviews', preserveNullAndEmptyArrays: true }
            // },
            // {
            //     $addFields: {
            //         averageRating: { $avg: { $ifNull: ['$reviews.rating', 0] } } // Calculate average rating
            //     }
            // },
            {
                $project: {
                    _id: 1,
                    is_status: 1,
                    user_name: { $concat: ['$tailorDetails.fname', ' ', '$tailorDetails.lname'] },
                    profile: { $concat: [baseURL, 'profile/', '$tailorDetails.profile'] },
                    street: '$tailorDetails.street',
                    location: '$tailorDetails.location',
                    city: '$tailorDetails.city',
                    Bio: '$tailorDetails.Bio',
                    // rating: '$rating.rating'
                    // averageRating: { $avg: ['$rating.rating'] }
                    averageRating: { $avg: '$rating.rating' }

                }
            }
        ]);
        console.log('👌👌👌👌', appointments)
        if (appointments.length === 0) {
            deferred.reject("We are not able to find any pending Request.");
        } else {
            deferred.resolve(appointments);
        }
    } catch (error) {
        console.error('Error booking userPending:', error);
        deferred.reject(error);
    }
    return deferred.promise;
};

userController.userCompleted = async (req, res) => {
    const deferred = Q.defer();
    const { user_id, is_status } = req.body;
    try {
        let tailorResponse = await userMaster.findById({ _id: user_id });
        console.log('👌👌👌👌', tailorResponse)
        if (!tailorResponse) {
            deferred.reject('We are not able to find this user');
            return deferred.promise;
        }

        let appointments = await bookAppoinment.aggregate([
            {
                $match: { is_status: 'completed', user_id: tailorResponse._id }
            },
            {
                $lookup: {
                    from: 'user_masters',
                    localField: 'tailor_id',
                    foreignField: '_id',
                    as: 'tailorDetails'
                }
            },
            {
                $unwind: '$tailorDetails'
            },
            {
                $lookup: {
                    from: 'review_masters',
                    localField: 'tailor_id',
                    foreignField: 'tailor_id',
                    as: 'rating'
                }
            },
            // {
            //     $unwind: { path: '$rating', preserveNullAndEmptyArrays: true }
            // },
            // {
            //     $addFields: {
            //         averageRating: {
            //             $avg: {
            //                 $ifNull: ['$ratings.rating', [0]] // If no ratings, use an array with [0] to calculate average
            //             }
            //         }
            //     }
            // },
            // {
            //     $addFields: {
            //         averageRating: { $avg: { $ifNull: ['$reviews.rating', 0] } } // Calculate average rating
            //     }
            // },
            {
                $project: {
                    _id: 1,
                    is_status: 1,
                    user_name: { $concat: ['$tailorDetails.fname', ' ', '$tailorDetails.lname'] },
                    profile: { $concat: [baseURL, 'profile/', '$tailorDetails.profile'] },
                    phone: '$tailorDetails.phone',
                    street: '$tailorDetails.street',
                    location: '$tailorDetails.location',
                    city: '$tailorDetails.city',
                    Bio: '$tailorDetails.Bio',
                    averageRating: { $avg: '$rating.rating' }
                }
            }
        ]);
        console.log('👌👌👌', appointments)
        if (appointments.length !== 0) {
            deferred.resolve(appointments);
        } else {
            deferred.reject('No completed request yet.');
        }
    } catch (error) {
        console.error('Error booking userCompleted:', error);
        deferred.reject(error);
    }
    return deferred.promise
}







////////////////////       TAILOR API      //////////////////////



userController.addMultiplePhotos = async (req, res) => {
    const deferred = Q.defer();
    const { tailor_id } = req.body;
    try {
        let images = [];
        for (const i of req.files) {
            images.push(i.filename)
        }
        let imageResponse = await imageMaster.findOne({ tailor_id });

        if (!imageResponse) {
            let createImage = new imageMaster()
            createImage.tailor_id = tailor_id;
            createImage.images = images;
            createImage.save();
            deferred.resolve(createImage);
        } else {
            deferred.reject("You already added images");
        }

        // if (imageResponse) {
        //     let exitImages = await imageMaster.findOneAndUpdate({ tailor_id: tailor_id }, { $pull: { images: req.images } }, { new: true });
        //     let oldPath = publicPath + 'profile/' + exitImages.images;
        //     console.log('😂😂😂', oldPath)

        //     fs.unlink(oldPath, (err) => {
        //         if (err) {
        //             console.log(err);
        //         }
        //     });
        //     let newImages = await imageMaster.findOneAndUpdate({ tailor_id: tailor_id }, { $push: { $in: { images: req.images } } }, { new: true });
        //     console.log('😂😂😂', newImages)
        //     // console.log('2398469824986498', newImages)
        //     deferred.resolve(newImages)
        // } else {
        // }

    } catch (errorCode) {
        console.log('userController.addMultiplePhotos-', errorCode);
        deferred.reject(errorCode)
    }
    return deferred.promise;
}

userController.getUserId = async (user_id) => {
    let checkUser = await userMaster.findOne({ _id: user_id, deleted_at: null })
    return checkUser;
}

userController.setSkills = async (req, res) => {
    const deferred = Q.defer();
    const { sub_skill_id, skill_id, tailor_id, delete_sub_skill_ids } = req.body;
    try {
        // const SkillMaster = await SkillMasters.find({ _id: { $in: sub_skill_id } });
        // let findTailor = await TailorSkillMaster.findOne({ tailor_id });
        // if (!findTailor) {
        //     for (const findUserSkills of SkillMaster) {
        //         const addSkill = new TailorSkillMaster({
        //             tailor_id: tailor_id,
        //             skill_id: findUserSkills.subCategory,
        //             sub_skill_id: findUserSkills._id
        //         });
        //         await addSkill.save();
        //         deferred.resolve(addSkill)
        //     }
        // } else {
        //     // deferred.reject('We are not able to find this tailor.')
        // }

        const SkillMaster = await SkillMasters.find({ _id: { $in: sub_skill_id } });

        for (const findUserSkills of SkillMaster) {
            // Check if the skill combination already exists for the tailor
            const existingSkill = await TailorSkillMaster.findOne({
                tailor_id: tailor_id,
                skill_id: findUserSkills.subCategory,
                sub_skill_id: findUserSkills._id
            });

            if (existingSkill) {
                // deferred.reject(`Skill with sub_skill_id ${findUserSkills._id} already exists for this tailor.`);
                deferred.reject('Tailor already added this data.So add new different data.');
                return deferred.promise;
            }

            const newSkill = new TailorSkillMaster({
                tailor_id: tailor_id,
                skill_id: findUserSkills.subCategory,
                sub_skill_id: findUserSkills._id
            });
            await newSkill.save();
            deferred.resolve(newSkill);
        }
    } catch (errorCode) {
        console.log('usercontroller.setSkills-', errorCode);
        deferred.reject(errorCode);
    }
    return deferred.promise;
}

userController.updateSkills = async (req, res) => {
    const deferred = Q.defer();
    const { _id, delete_sub_skill_id, sub_skill_id } = req.body;
    try {
        let checkSkill = await TailorSkillMaster.findById(_id);
        if (checkSkill) {
            let updateSkill = await TailorSkillMaster.findByIdAndUpdate(checkSkill._id, { sub_skill_id: sub_skill_id }, { new: true });
            deferred.resolve(updateSkill)
        } else {
            deferred.reject('We are not able to find this tailor.');
        }
    } catch (errorCode) {
        console.log('usercontroller.updateSkills-', errorCode);
        deferred.reject(errorCode);
    }
    return deferred.promise;
}


userController.setBusinessHours = async (req, res) => {
    const deferred = Q.defer();
    const { user_id, businessHours } = req.body;
    try {
        const convertToUTC = (time, format) => {
            return moment(time, 'HH:mm A').utc().format(format);
        };

        // const newArray = businessHours.map((item) => ({
        //     ...item,
        //     user_id: user_id,
        //     start: convertToUTC(item.start),
        //     end: convertToUTC(item.end),
        //     breakStart: item.breakStart ? convertToUTC(item.breakStart) : null,
        //     breakEnd: item.breakEnd ? convertToUTC(item.breakEnd) : null
        // }))

        const newArray = businessHours.map((item) => {
            const newItem = {
                user_id: user_id,
                day: item.day,
                open: item.open
            };

            // Convert times to UTC if they exist
            if (item.start) {
                newItem.start = convertToUTC(item.start);
            }
            if (item.end) {
                newItem.end = convertToUTC(item.end);
            }
            if (item.breakStart) {
                newItem.breakStart = convertToUTC(item.breakStart);
            }
            if (item.breakEnd) {
                newItem.breakEnd = convertToUTC(item.breakEnd);
            }

            return newItem;
        });
        console.log('💕', newArray)
        const result = await BusinessHoursMaster.insertMany(newArray);
        deferred.resolve(result);
    } catch (error) {
        console.log('userController.setBusinessHours -', error);
        deferred.reject(error);
    }
    return deferred.promise;
}

userController.updateBusinessHours = async (req, res) => {
    const deferred = Q.defer();
    const { hours_id, businessHours } = req.body
    try {
        let checkHours = await BusinessHoursMaster.findById(hours_id)
        if (checkHours) {
            const updateHours = await BusinessHoursMaster.findByIdAndUpdate(
                hours_id, businessHours, { new: true }

            )
            deferred.resolve(updateHours)
        }
    } catch (error) {
        console.log('userController.updateBusinessHours -', error);
        deferred.reject(error);
    }

    return deferred.promise;
}

userController.showALLReviews = async (req, res) => {
    const deferred = Q.defer();
    const { tailor_id } = req.body;
    try {
        let showReviews = await reviewMaster.find({ tailor_id: tailor_id });
        if (showReviews) {
            deferred.resolve(showReviews);
        } else {
            deferred.reject("We are not able to find any reviews.")
        }
    } catch (error) {
        console.log('userController.showALLReviews-', error);
        deferred.reject(error);
    }
    return deferred.promise;
}

userController.showTailorDetails = async (req, res) => {
    const deferred = Q.defer();
    const { _id, tailor_id } = req.body;

    try {
        const tailorObjectId = new mongoose.Types.ObjectId(tailor_id);

        const result = await userMaster.aggregate([

            { $match: { _id: tailorObjectId._id } },

            {
                $lookup: {
                    from: 'businesshours_masters',
                    localField: '_id',
                    foreignField: 'user_id',
                    as: 'businessHours'
                }
            },
            { $unwind: { path: '$businessHours', preserveNullAndEmptyArrays: true } },

            {
                $lookup: {
                    from: 'tailor_skill_masters',
                    localField: '_id',
                    foreignField: 'tailor_id',
                    as: 'tailorSkills'
                }
            },
            { $unwind: { path: '$tailorSkills', preserveNullAndEmptyArrays: true } },

            {
                $lookup: {
                    from: 'category_masters',
                    localField: 'tailorSkills.sub_skill_id',
                    foreignField: '_id',
                    as: 'categories'
                }
            },
            { $unwind: { path: '$categories', preserveNullAndEmptyArrays: true } },

            { $match: { 'categories.subCategory': { $ne: null } } },

            {
                $lookup: {
                    from: 'imageupload_masters',
                    localField: '_id',
                    foreignField: 'tailor_id',
                    as: 'images'
                }
            },
            { $unwind: { path: '$images', preserveNullAndEmptyArrays: true } },

            {
                $lookup: {
                    from: 'review_masters',
                    localField: '_id',
                    foreignField: 'tailor_id',
                    as: 'rating'
                }
            },
            // {
            //     $unwind: '$rating'
            // },
            {
                $project: {
                    _id: 0,
                    tailorDetails: {
                        Bio: '$Bio',
                        phone: '$phone'
                    },
                    businessHours: {
                        day: '$businessHours.day',
                        start: '$businessHours.start',
                        end: '$businessHours.end',
                        open: '$businessHours.open',
                        breakStart: '$businessHours.breakStart',
                        breakEnd: '$businessHours.breakEnd'
                    },
                    categories: {
                        category_name: '$categories.category_name',
                        img: { $concat: [baseURL, 'profile/', '$categories.img'] }
                    },
                    images: {
                        $map: {
                            input: '$images.images',   // Iterate over the array of images
                            as: 'img',                 // Alias for each image
                            in: { $concat: [baseURL, 'profile/', '$$img'] } // Concatenate for each image
                        }
                    },
                    // rating: { $avg: '$rating.rating' }
                    rating: {
                        $ifNull: [{ $avg: '$rating.rating' }, 0] 
                    }
                }
            },
            // Group to remove duplicates 
            {
                $group: {
                    _id: null,
                    tailorDetails: { $first: '$tailorDetails' },
                    businessHours: { $addToSet: '$businessHours' },
                    categories: { $addToSet: '$categories' },
                    images: { $addToSet: '$images' },
                    // rating: { $addToSet: '$rating' }
                    rating: { $first: '$rating' }

                }

            }
        ]);
        if (result.length == 0) {
            return Promise.reject({ message: 'No tailor details found' });
        }
        deferred.resolve(result[0])
    } catch (error) {
        console.error('userController.showTailorDetails - Error:', error);
        return res.status(500).json({ error: 'An error occurred' });
    }
    return deferred.promise;
};

userController.pendingRequest = async (req, res) => {
    const deferred = Q.defer();
    const { tailor_id } = req.body;
    try {
        const tailorResponse = await userMaster.findById({ _id: tailor_id })
        console.log('😃😃😃😃😃', tailorResponse);
        if (!tailorResponse) {
            deferred.reject("We are not abele to find this tailor")
            return deferred.promise;
        }
        const appointments = await bookAppoinment.aggregate([
            {
                $match: { tailor_id: tailorResponse._id, is_status: 'pending' } // Match pending status in bookAppoinment
            },
            {
                $lookup: {
                    from: 'user_masters',
                    localField: 'user_id',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $unwind: '$user'
            },
            {
                $project: {
                    _id: 1,
                    profile: { $concat: [baseURL, 'profile/', '$user.profile'] },
                    user_name: { $concat: ['$user.fname', ' ', '$user.lname'] },
                    date: 1,
                    time: 1,
                    skill: 1,
                    note: 1,
                }
            }
        ]);
        console.log('👌👌👌', appointments)
        if (appointments.length === 0) {
            deferred.reject("No pending Requested");
        } else {
            deferred.resolve(appointments);
        }

    } catch (error) {
        console.log('userController.pendingRequest -', error);
        deferred.reject(error);
    }
    return deferred.promise;
};


userController.completeBookAppoinment = async (req, res) => {
    const deferred = Q.defer();
    const { _id, is_status } = req.body;
    try {
        const userBookApp = await bookAppoinment.findById(_id);

        if (userBookApp) {
            if (userBookApp.is_status == 'completed') {
                deferred.reject("You already completed this appoinment.");
                return deferred.promise;
            }
            let completeBookAPP = await bookAppoinment.findByIdAndUpdate(_id, { is_status: is_status }, { seen: true }, { new: true });
            deferred.resolve(completeBookAPP);
        } else {
            deferred.reject("We are not able to find this user");
        }

    } catch (error) {
        console.log('userController.completeBookAppoinment -', error);
        deferred.reject(error);
    }
    return deferred.promise;
};

userController.completedRequest = async (req, res) => {
    const deferred = Q.defer();
    const { tailor_id } = req.body;
    try {
        const tailorResponse = await userMaster.findById({ _id: tailor_id })
        const appoinment = await bookAppoinment.aggregate([
            {
                $match: { tailor_id: tailorResponse._id, is_status: 'completed' } // Match pending status in bookAppoinment
            },
            {
                $lookup: {
                    from: 'user_masters',
                    localField: 'user_id',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $unwind: '$user'
            },
            {
                $project: {
                    _id: 0,
                    profile: { $concat: [baseURL, 'profile/', '$user.profile'] },
                    user_name: { $concat: ['$user.fname', ' ', '$user.lname'] },
                    tailor_id: 1,
                    user_id: 1,
                    date: 1,
                    time: 1,
                    skill: 1,
                    note: 1
                }
            }
        ]);

        if (appoinment.length == 0) {
            deferred.reject("Here is no one user whose status is completed.");
            return deferred.promise;
        } else {
            deferred.resolve(appoinment)
        }
    } catch (error) {
        console.log('userController.completedRequest -', error);
        deferred.reject(error);
    }
    return deferred.promise;
};

userController.showALLNotification = async (req, res) => {
    const deferred = Q.defer();
    const { receiver_id } = req.body;
    try {
        const showNotifications = await notificationMaster.aggregate([
            {
                $match: { receiver_id: new mongoose.Types.ObjectId(receiver_id) }
            },
            {
                $lookup: {
                    from: 'user_masters',
                    localField: 'sender_id',
                    foreignField: '_id',
                    as: 'senderDetails'
                }
            },
            {
                $unwind: '$senderDetails'
            },
            {
                $project: {
                    _id: 1,
                    message: 1,
                    sender_id: 1,
                    is_status: 1,
                    user_name: { $concat: ['$senderDetails.fname', ' ', '$senderDetails.lname'] },
                    profile: { $concat: [baseURL, 'profile/', '$senderDetails.profile'] }
                }
            }
        ]);

        if (showNotifications.length > 0) {
            deferred.resolve(showNotifications);
        } else {
            deferred.reject("No notifications found for this receiver.");
        }
    } catch (error) {
        console.error('userController.showALLNotification -', error);
        deferred.resolve(error)
    }
    return deferred.promise
};

userController.notificationAccORDec = async (req, res) => {
    const deferred = Q.defer();
    const { sender_id, is_status, receiver_id, _id, message } = req.body;
    try {
        const acceptedNotification = await notificationMaster.findOne({
            receiver_id: sender_id,
            sender_id: receiver_id,
            is_status: 'accepted'
        });
        if (acceptedNotification) {
            deferred.reject("You have already accepted a request from this user.");
            return deferred.promise;
        }
        const senderResponse = await notificationMaster.findById(_id);
        if (senderResponse) {
            let createNotification = new notificationMaster();
            createNotification.sender_id = receiver_id;
            createNotification.receiver_id = sender_id;
            createNotification.is_status = is_status;
            createNotification.message = message;
            createNotification.seen = 'true';

            if (is_status === 'accepted') {
                createNotification.message = "Tailor accepted your request";
                await bookAppoinment.findOneAndUpdate({ user_id: sender_id, tailor_id: receiver_id }, { is_status: 'pending' }, { seen: true }, { new: true });
            } else if (is_status === 'declined') {
                createNotification.message = "Tailor declined your request";
                await bookAppoinment.findOneAndUpdate({ tailor_id: receiver_id, user_id: sender_id }, { is_status: 'rejected' }, { seen: true }, { new: true });
            } else {
                // Use the provided message or set a default one
                createNotification.message = message || "Request status updated";
            }
            await createNotification.save();
            deferred.resolve(createNotification);
        } else {
            deferred.reject(`We are not able to find this ${_id}.`);
        }
        // const notificationToUpdate = await notificationMaster.findById(_id);
        // if (notificationToUpdate) {
        //     // Swap properties with new values
        //     notificationToUpdate.sender_id = receiver_id;
        //     notificationToUpdate.receiver_id = sender_id;
        //     notificationToUpdate.is_status = is_status;

        //     // Set the message automatically if the status is 'accepted'
        //     if (is_status === 'accepted') {
        //         notificationToUpdate.message = "Tailor accepted your request";
        //         await bookAppoinment.findOneAndUpdate({user_id:sender_id,tailor_id:receiver_id},{is_status:'pending'},{new:true});

        //     } else if (is_status === 'declined') {
        //         notificationToUpdate.message = "Tailor declined your request";

        //         // Update the related bookAppointment to 'rejected'
        //         await bookAppoinment.findOneAndUpdate({ tailor_id: receiver_id, user_id: sender_id },{ is_status: 'rejected' },{ new: true });
        //     }else {
        //         // Use the provided message or set a default one
        //         notificationToUpdate.message = message || "Request status updated";
        //     }

        //     // Save the updated notification
        //     await notificationToUpdate.save();

        //     // Resolve with the updated notification
        //     deferred.resolve(notificationToUpdate);
        // }else{
        //     deferred.reject("We are not able to find this notifications.")
        // }
    } catch (error) {
        console.error('userController.notificationAccORDec -', error);
        deferred.reject(error)
    }
    return deferred.promise;
}

userController.clearAllNotifications = async (req, res) => {
    const deferred = Q.defer();
    const { receiver_id } = req.body;
    try {
        const tailorNotification = await notificationMaster.find({ receiver_id: receiver_id })
        // console.log('😃😃😃',tailorNotification)
        if (tailorNotification.length > 0) {

            let deleteAllNotification = await notificationMaster.deleteMany({ receiver_id: receiver_id });
            // await notificationMaster.deleteMany({ receiver_id: receiver_id });
            deferred.resolve({});
        } else {
            deferred.reject("We are not able to find this tailor's notifications");
        }
    } catch (error) {
        console.error('userController.deleteAllNotifications -', error);
        deferred.reject(error)
    }
    return deferred.promise;
}

userController.contactUs = async function (req, res) {
    const deferred = Q.defer();
    const { email, name, subject, message } = req.body;
    try {
        console.log('sdbciubdvo', req.body)
        let clientEmail = process.env.CLIENT_EMAIL || "darshansavaliya2005@gmail.com";
        let mailContent = await contactUsMail(name, email, subject, message);
        sendMail(clientEmail, "Contact Us email from " + APP_NAME, mailContent);
        deferred.resolve({});

    } catch (errorCode) {
        console.error("userController.contactUs - ", errorCode);
        deferred.reject(errorCode);
    }
    return deferred.promise;
}


function makeid(length) {
    let result = '';
    let characters = '0123456789';
    let characterlength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characterlength))
    }
    return result
}

module.exports = userController;
