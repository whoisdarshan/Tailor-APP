// const fs = require('fs');
const jwt = require('jsonwebtoken');
const adminController = {};
const categoryMaster = require('../model/category_master');
const sendMail = require("../utils/sendMail");
const adminMaster = require('../model/admin_master')
const imageMaster = require('../model/image_master');
const { forgotPasswordMail } = require("../utils/contentProvider");
const userMaster = require('../model/user_master');
const TailorSkillMaster = require('../model/tailor_skills_master');
// const ResponseFormatter= require('../utils/response.formatter');
// const formatter = new ResponseFormatter();
// const routesMiddlewares = require('../routes/routesMiddlewares');
const BusinessHoursMaster = require('../model/business_hours_master');
const Q = require('q');
const OTPMaster = require('../model/OTPMaster');
const config = require('../config/common.config');
const { get } = require('mongoose');
const userController = require('./user_controller');
let publicPath = basedir + '/public/';
const baseURL = 'http://localhost:3456/public/';



(async () => {
    try {
        const findAdmin = await adminMaster.findOne({ email: "admin@gmail.com" });
        if (!findAdmin) {
            const adminObj = new adminMaster({
                name: "admin",
                email: "admin@gmail.com",
                password: "123",
            }).save()
            return
        }
    } catch (errorCode) {
        return errorCode;
    }
})();


// adminController.getAdminDetail = async (category_id) => {
//     let checkCategory = await categoryMaster.findOne({ _id: category_id, deleted_at: null });
//     return checkCategory;
// }
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;
adminController.getAdminDetail = async (adminId) => {
    console.log('Fetching details for adminId:', adminId);
    let checkCategory = await adminMaster.findOne({ _id: new ObjectId(adminId), deleted_at: null });
    return checkCategory;
}


adminController.login = async (req, res) => {
    const deferred = Q.defer();
    const { email, password } = req.body;
    try {
        let checkAdmin = await adminMaster.findOne({ email: email, deleted_at: null });
        if (checkAdmin) {
            if (checkAdmin.password == password) {
                let payLoad = {
                    adminId: checkAdmin._id
                }
                const token = jwt.sign(payLoad, config.jwt.secret, { expiresIn: config.jwt.token_expiry });
                deferred.resolve(token);
            } else {
                deferred.reject('incorrect_password')
            }
            deferred.reject('incorrect_email');
        }
    } catch (errorCode) {
        console.log('adminController.login-', errorCode)
        deferred.reject(errorCode)
    }
    return deferred.promise;
}

adminController.forgetPassword = async (req, res) => {
    const deferred = Q.defer();
    const { email } = req.body;
    try {
        let otpCode = makeid(4);
        let newOTP = new OTPMaster();
        newOTP.otp_code = otpCode;
        newOTP.email = email;
        newOTP.expireAn = new Date();
        newOTP.save();
        let adminResponseObj = await adminMaster.findOneAndUpdate({ email: email }, { ccode: otpCode }, { new: true })
        if (adminResponseObj) {
            let mailContenet = forgotPasswordMail(adminResponseObj.name, otpCode);
            sendMail(email, "Froget Passsword mail", mailContenet);
            deferred.resolve({ adminResponseObj, otp_code: otpCode });
        } else {
            deferred.reject('incorrect_email');
        }

    } catch (errorCode) {
        console.log('adminController.forgetPassword-', errorCode);
        deferred.reject(errorCode);
    }
    return deferred.promise
}

adminController.verifyOtp = async (req, res) => {
    const deferred = Q.defer();
    const { email, otp } = req.body;
    try {
        let checkOtp = await OTPMaster.findOne({ otp_code: otp, email: email })
        

        if (checkOtp != null) {
            let deleteOTP = await OTPMaster.deleteOne({ _id: checkOtp._id });
            deferred.resolve({});

        } else {
            deferred.reject('invalid_otp')
        }

    } catch (errorCode) {
        console.log('adminController.verifyOtp-', errorCode)
        deferred.reject(errorCode);
    }

    return deferred.promise;

}


adminController.resetPassword = async (req, res) => {
    const deferred = Q.defer();
    const { old_password, new_password } = req.body;
    try {
        let admin = req.admin
        if (admin != null) {
            if (admin.password != old_password) {
                deferred.reject("Please check you old pasdword.")
            } else if (admin.password == new_password) {
                deferred.reject("Your new password is same as old password. Please use different new password.");
            };

            let adminResponse = await adminMaster.findByIdAndUpdate(admin._id, { password: new_password }, { new: true });
            console.log('😂😂😂', adminResponse)
            deferred.resolve({});
        }
    } catch (error) {
        console.log('adminController.resetPassword-', error)
        deferred.reject(error);
    }
    return deferred.promise;
};

adminController.pendingRequest = async (req, res) => {
    const deferred = Q.defer();
    const { is_status } = req.body;
    try {
        let showPendingReq = await userMaster.find({ is_status: 'pending', user_type: 'tailor' });
        // console.log('😂😂',showPendingReq);
        if (showPendingReq.length <= 0) {
            deferred.reject("We are not able to find any pending req.");
            // return deferred.promise;
        }
        deferred.resolve(showPendingReq);
        // console.log('😂😂😂😂😂',showPendingReq);
    } catch (error) {
        console.log('adminController.pendingRequest-', error)
        deferred.reject(error);
    }
    return deferred.promise;
}

adminController.accORdec = async (req, res) => {
    const deferred = Q.defer();
    const { tailor_id, is_status } = req.body;
    try {
        let tailorResponse = await userMaster.findById(tailor_id);
        if (tailorResponse.is_status == 'accepted') {
            deferred.reject("you already accepted request.")
        }
        if (tailorResponse) {
            let ACCorDEC = await userMaster.findByIdAndUpdate(tailor_id, { is_status: is_status }, { new: true });
            deferred.resolve(ACCorDEC);
        } else {
            deferred.reject("We are not able to find the pending request.")
        }
    } catch (error) {
        console.log('adminController.accORdec-', error)
        deferred.reject(error);
    }
    return deferred.promise;
}


adminController.showTailorDetails = async (req, res) => {
    const deferred = Q.defer();
    const { tailor_id } = req.body;

    try {
        const tailorObjectId = new mongoose.Types.ObjectId(tailor_id);
        // const publicPath = basedir + '/public/';

        const result = await userMaster.aggregate([

            { $match: { _id: tailorObjectId } },

            // BusinessHoursMaster
            {
                $lookup: {
                    from: 'businesshours_masters',
                    localField: '_id',
                    foreignField: 'user_id',
                    as: 'businessHours'
                }
            },
            { $unwind: { path: '$businessHours', preserveNullAndEmptyArrays: true } },


            // // // Lookup for TailorSkillMaster
            {
                $lookup: {
                    from: 'tailor_skill_masters',
                    localField: '_id',
                    foreignField: 'tailor_id',
                    as: 'tailorSkills'
                }
            },
            { $unwind: { path: '$tailorSkills', preserveNullAndEmptyArrays: true } },

            // // Lookup for categoryMaster based on sub_skill_id from TailorSkillMaster
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

            // // Lookup for imageMaster
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
                    rating: {
                        $ifNull: [{ $avg: '$rating.rating' }, 0] 
                    }
                }
            },

            // Group to remove duplicates and consolidate the data
            {
                $group: {
                    _id: null,
                    tailorDetails: { $first: '$tailorDetails' },
                    businessHours: { $addToSet: '$businessHours' },
                    categories: { $addToSet: '$categories' },
                    images: { $addToSet: '$images' },
                    avgRating:{$first:'$rating'}

                }

            }
        ]);

        if (result.length == 0) {
            deferred.reject('No tailor details found');
        }
        deferred.resolve(result[0])
    } catch (error) {
        console.error('userController.showTailorDetails - Error:', error);
        deferred.reject(error);
    }
    return deferred.promise;
};


adminController.showAllTailors = async (req, res) => {
    const deferred = Q.defer();
    try {
        let showTailors = await userMaster.find({ user_type: 'tailor', is_status: 'accepted' }, 'profile fname lname location street city');
        deferred.resolve(showTailors)
    } catch (errorCode) {
        console.log('adminController.showAllTailors-', errorCode)
        deferred.reject(errorCode);
    }
    return deferred.promise;
};

adminController.showAllUsers = async (req, res) => {
    const deferred = Q.defer();
    try {
        let showTailors = await userMaster.find({ user_type: 'user' }, '_id profile fname lname location street city phone');
        deferred.resolve(showTailors)
    } catch (errorCode) {
        console.log('adminController.showAllUsers-', errorCode)
        deferred.reject(errorCode);
    }
    return deferred.promise;
}


adminController.showUserDetails = async (req, res) => {
    const deferred = Q.defer();
    const { user_id } = req.body;
    try {
        let userResponse = await userMaster.findById(user_id);
        if (!userResponse) {
            deferred.reject("We are not able to find this user.");
            return deferred.promise;
        }
        // console.log('😃', userResponse)
        let showUserDetail = await userMaster.aggregate([
            {
                $match: {
                    _id: userResponse._id
                }
            },
            {
                $lookup: {
                    from: 'review_masters',
                    localField: '_id',
                    foreignField: 'user_id',
                    as: 'review'

                }
            },
            // {
            //     $unwind: '$review'
            // },
            {
                $project: {
                    _id: 0,
                    profile: 1,
                    fname: 1,
                    lname: 1,
                    Bio: 1,
                    phone: 1,
                    location: 1,
                    street: 1,
                    city: 1,
                    review: {
                        rating: 1,
                        comment: 1
                    }

                }
            }
        ]);
        deferred.resolve(showUserDetail)
    } catch (error) {
        console.error('userController.showUserDetails-', error);
        deferred.reject(error);
    }
    return deferred.promise;
}

adminController.deleteUser = async (req, res) => {
    const deferred = Q.defer();
    try {
        let deleteUser = await userMaster.findByIdAndDelete({ user_id, user_type: 'user' });
        deferred.resolve(deleteUser);
    } catch (errorCode) {
        console.log('adminController.deleteUser-', errorCode)
        deferred.reject(errorCode);
    }
}



//          Category APIs
//  addCat   updateCat   deleteCat  

adminController.addCategory = async (req, res) => {
    const deferred = Q.defer();
    const { subCategory_name, category_name } = req.body;
    try {
        // let category = await categoryMaster.findOne({category_name})
        // if(category){
        //     return Promise.reject('category_already_exist');
        // }
        // if(subCategory && category_name){     
        //     let addSubCategory= await categoryMaster.create({subCategory,category_name});
        //     deferred.resolve(addSubCategory);
        // }else{
        //     let addCategory= await categoryMaster.create({category_name});
        //     deferred.resolve(addCategory);
        // }
        let img = req.file ? req.file.filename : '';
        if (img) {
            let findAdmin = await adminMaster.findOne({ _id: req.admin_id })
            if (findAdmin) {
                let oldPath = publicPath + 'profile/' + req.findAdmin.img;
                fs.unlink(oldPath, (err) => {
                    if (err) {
                        console.log(err)
                    }
                })
            }

        }
        if (subCategory_name) {
            let subCategory = await categoryMaster.create({ subCategory: subCategory_name, category_name: category_name, img });
            deferred.resolve(subCategory);
        } else {
            let category = await categoryMaster.create({ category_name: category_name, img });
            deferred.resolve(category)
        }

    } catch (errorCode) {
        console.log('adminController.addCategory-', errorCode)
    }

    return deferred.promise;
}

adminController.listOfCategory = async (req, res) => {
    const deferred = Q.defer();
    const { cat_id } = req.body;
    try {
        if (cat_id) {
            const subCategoryList = await categoryMaster.find({ subCategory: cat_id, }, { category_name: 1 })
            deferred.resolve(subCategoryList)
        } else {
            const categoryList = await categoryMaster.find({ subCategory: null }).select('category_name -_id');
            deferred.resolve(categoryList);
        }
    } catch (error) {
        console.log('adminController.listOfCategory-', errorCode);
        deferred.reject(error);
    }
    return deferred.promise
}

adminController.updateCategory = async (req, res) => {
    const deferred = Q.defer()
    const { _id, category_name } = req.body;
    try {
        let updateCategory = await categoryMaster.findOneAndUpdate({ _id: _id }, { category_name }, { new: true });
        // console.log(updateCategory)
        deferred.resolve(updateCategory);

    } catch (errorCode) {
        console.log('adminController.updateCategory-', errorCode);
        deferred.reject(errorCode)
    }
    return deferred.promise;

}

adminController.deleteCategory = async (req, res) => {
    const deferred = Q.defer();
    const { subCategory_id, category_id } = req.body;
    try {
        if (subCategory_id && category_id) {
            let subCategory = await categoryMaster.findOneAndDelete({ _id: subCategory_id, subCategory: category_id })
            // console.log('😂', subCategory);
            deferred.resolve(subCategory)
        } else {
            let subCatFind = await categoryMaster.find({ subCategory: category_id })
            if (subCatFind) {
                await categoryMaster.deleteMany({ subCategory: category_id });
            }
            let category = await categoryMaster.findOneAndDelete({ _id: category_id });

            deferred.resolve(category);
        }
    } catch (errorCode) {
        console.log('adminController.deleteCategory-', errorCode);
        deferred.reject(errorCode)
    }
    return deferred.promise;
}

adminController.logOut = async (req, res) => {
    const deferred = Q.defer();
    // const { admin } = req.body;
    try {
        let admin = req.admin
        console.log('😂', admin);

        let adminResponseObj = await adminMaster.findByIdAndUpdate(admin._id, { new: true });
        if (adminResponseObj) {
            deferred.resolve();
        } else {
            deferred.reject();
        }
    } catch (errorCode) {
        console.log('adminController.logOut-', errorCode)
        deferred.reject(errorCode);
    }
}

function makeid(length) {
    let result = '';
    let characters = '0123456789';
    let characterLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characterLength))
    }
    return result
}


module.exports = adminController; 