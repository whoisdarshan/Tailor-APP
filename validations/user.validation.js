const Joi = require('joi');
const { selectSubCategory, setBusinessHours, showAllSkills, addFavourite, updateBusinessHours, listOfTailors } = require('../controller/user_controller');
const stringSchema = Joi.string();
const emailSchema = Joi.string();
Joi.objectId = require('joi-objectid')(Joi);

module.exports = {
    sendOtpForSignUpSchema: {
        body: Joi.object().keys({
            phone: stringSchema,
        })
    },
    loginSchema: {
        body: Joi.object().keys({
            phone: stringSchema,
            password: stringSchema.required()
        })
    },
    signup: {
        body: Joi.object().keys({
            phone: stringSchema,
            otp: stringSchema,
            fname: stringSchema.required(),
            lname: stringSchema.required(),
            password: stringSchema.required(),
            profile: Joi.any(),
            pastcode: stringSchema,
            Bio: stringSchema.required(),
            language: stringSchema.required(),
            user_type: stringSchema.required(),
            city: stringSchema.optional(),
            street: stringSchema.optional(),
            latitude: stringSchema.required(),
            latitude: Joi.number().required(),
            longitude: Joi.number().required(),
            location: Joi.object({
                type: Joi.string().valid('Point').required(), // Ensure type is 'Point'
                coordinates: Joi.array().items(Joi.number()).length(2).required() // Ensure coordinates array has 2 numbers
            }).optional()


        })
    },
    updateProfileSchema: {
        body: Joi.object().keys({
            _id: Joi.objectId().required(),
            profile: stringSchema.optional(),
            fname: stringSchema.optional(),
            lname: stringSchema.optional(),
            Bio: stringSchema.optional(),
            city: stringSchema.optional(),
            street: stringSchema.optional(),
            pastcode: Joi.any(),
            images:Joi.any().optional(),
            deleteImages:Joi.any().optional(),
        })
    },

    addMultiplePhotos: {
        body: Joi.object().keys({
            tailor_id: Joi.objectId().required(),
            images: Joi.any(),
            // profile:Joi.any(),
        })
    },
    changePasswordSchema: {
        body: Joi.object().keys({
            user_id: Joi.objectId().required(),
            old_password: stringSchema.required(),
            new_password: stringSchema.required(),
        })
    },
    forgetPasswordSchema: {
        body: Joi.object().keys({
            phone: stringSchema.required()
        })
    },
    verifyOtpSchema: {
        body: Joi.object().keys({
            otp: stringSchema.required(),
            phone: stringSchema
        })
    },

    resetPasswordSchema: {
        body: Joi.object().keys({
            old_password: stringSchema.required(),
            new_password: stringSchema.required()
        })
    },
    changeLanguageSchema: {
        body: Joi.object().keys({
            _id: Joi.objectId().required(),
            old_language: stringSchema,
            new_language: stringSchema
        })
    },
    contactUsSchema:{
            body:Joi.object().keys({
                name: stringSchema.required(),
                email: emailSchema.required(),
                subject: stringSchema.required(),
                message: stringSchema.required(),
            })
        
    },
    logOutSchema: {
        body: Joi.object().keys({
            _id: Joi.objectId(),
        })
    },
    deleteAccountSchema: {
        body: Joi.object().keys({
            _id: Joi.objectId(),
        })
    },

    setSkillsSchema: {
        body: Joi.object().keys({
            sub_skill_id: Joi.array(),
            // sub_skill_id:Joi.objectId().optional(),
            tailor_id: Joi.objectId().required(),
            skill_id: Joi.objectId().optional(),
            // skill_id: Joi.array(),
            // delete_sub_skill_ids:Joi.array().optional(),

        })
    },

    updateSkillsSchema: {
        body: Joi.object().keys({
            sub_skill_id: Joi.objectId().optional(),
            // sub_skill_id:Joi.objectId().optional(),
            _id: Joi.objectId().required(),
            delete_sub_skill_id: Joi.objectId().optional(),

        })
    },

    showTailorDetailsSchema: {
        body: Joi.object().keys({
            tailor_id: Joi.objectId().required()
        })
    },
    setBusinessHoursSchema: {
        body: Joi.object().keys({
            user_id: Joi.objectId().optional(),
            businessHours: Joi.array().items(Joi.object().keys({
                day: stringSchema.required(),
                start: stringSchema.optional(),
                end: stringSchema.optional(),
                open: Joi.boolean(),
                breakEnd: stringSchema.optional(),
                breakStart: stringSchema.optional()
            })),

        })
    },

    updateBusinessHoursSchema: {
        body: Joi.object().keys({
            hours_id: Joi.objectId().required(),
            businessHours: Joi.object().keys({
                day: stringSchema.optional(),
                start: stringSchema.optional(),
                end: stringSchema.optional(),
                open: Joi.boolean(),
                breakEnd: stringSchema.optional(),
                breakStart: stringSchema.optional()
            })
        })
    },

    editProfileSchema: {
        body: Joi.object().keys({
            user_id: Joi.objectId().required(),
            profile: stringSchema,
            city: stringSchema,
            street: stringSchema,
            fname: stringSchema,
            lname: stringSchema,
            Bio: stringSchema,
            pastcode: Joi.any(),
        })
    },

    showAllSkillsSchema: {
        body: Joi.object().keys({
            sub_skill: Joi.objectId().optional()
        })
    },

    addFavouriteSchema: {
        body: Joi.object().keys({
            user_id: Joi.objectId().optional(),
            tailor_id: Joi.objectId().optional()
        })
    },
    showAllFavouritesSchema: {
        body: Joi.object().keys({
            user_id: Joi.objectId().optional()
        })
    },
    ReviewSchema: {
        body: Joi.object().keys({
            user_id: Joi.objectId().required(),
            tailor_id: Joi.objectId().required(),
            rating: Joi.any(),
            comment: stringSchema
        })
    },
    showTailorDetailSchema: {
        body: Joi.object().keys({
            tailor_id: Joi.objectId().required(),
            // user_id:Joi.objectId().optional()
        })
    },
    bookAppoinmentSchema: {
        body: Joi.object().keys({
            user_id: Joi.objectId().required(),
            tailor_id: Joi.objectId().required(),
            date: stringSchema.required(),
            time: stringSchema.required(),
            skill: Joi.any(),
            note: stringSchema.required(),
            is_status: stringSchema.optional(),
            message: stringSchema.required()
        })
    },
    completeBookAppoinmentSchema: {
        body: Joi.object().keys({
            _id: Joi.objectId().required(),
            is_status:stringSchema.required()
        })
    },
    completedRequestSchema: {
        body: Joi.object().keys({
            tailor_id:Joi.objectId().required()
        })
    },
    showALLNotificationSchema: {
        body: Joi.object().keys({
            receiver_id: Joi.objectId().required()
        })
    },
    notificationAccORDecSchema: {
        body: Joi.object().keys({
            sender_id: Joi.objectId().required(),
            receiver_id: Joi.objectId().required(),
            _id: Joi.objectId().required(),
            is_status: stringSchema.required(),
            // message: stringSchema.required()
        })
    },
    clearAllNotificationsSchema: {
        body: Joi.object().keys({
            receiver_id: Joi.objectId().required()
        })
    },
    userPendingSchema: {
        body: Joi.object().keys({
            user_id: Joi.objectId().required()
        })
    },
    userCompletedSchema: {
        body: Joi.object().keys({
            user_id: Joi.objectId().required(),
            // is_status: stringSchema.required()
        })
    },
    // listOfTailorsSchema:{
    //     body:Joi.object().keys({
    //         latitude: Joi.number()
    //         .required()
    //         .min(-90)
    //         .max(90)
    //         .message('Latitude must be a number between -90 and 90'), // Latitude range constraint

    //     longitude: Joi.number()
    //         .required()
    //         .min(-180)
    //         .max(180)
    //         .message('Longitude must be a number between -180 and 180'), // Longitude range constraint
    //         category_id:Joi.objectId().required(),
    //         distance:stringSchema.optional()
    //     })
    // }
    listOfTailorsSchema: {
        body: Joi.object().keys({
            category_id: Joi.objectId().required(),
            // user_id: Joi.objectId().required(),
            distance: stringSchema.optional(),
            longitude: stringSchema.optional(),
            latitude:stringSchema.optional()
        })
    },
    showALLReviewsSchema:{
        body:Joi.object().keys({
            tailor_id:Joi.objectId().required()
        })
    },
    pendingRequestSchema:{
        body:Joi.object().keys({
            tailor_id:Joi.objectId().required()
        })
    }
}