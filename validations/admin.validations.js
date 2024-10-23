const Joi = require('joi');
const { resetPassword, showAllTailors } = require('../controller/admin_controller');
const emailSchema = Joi.string();
const stringSchema = Joi.string();

Joi.objectId = require('joi-objectid')(Joi) 

module.exports = {
    loginSchema: {
        body: Joi.object().keys({
            email: emailSchema.required(),
            password: stringSchema.required()
        })
    },
    forgetPasswordSchema: {
        body: Joi.object().keys({
            email: stringSchema.required(),
        })
    },
    verifyOTPSchema: {
        body: Joi.object().keys({
            email: emailSchema.required(),
            otp: stringSchema.required()
        })
    },

    resetPasswordSchema:{
        body:Joi.object().keys({
            old_password:stringSchema.required(),
            new_password:stringSchema.required()
        })
    },

    deleteUserSchema:{
        body:Joi.object().keys({
            user_id:Joi.objectId().required()
        })
    },


    addCategorySchema: {
        body: Joi.object().keys({
            category_name: stringSchema.required(),
            subCategory_name: stringSchema.optional(),
            profile: stringSchema,
        })
    },

    updateCategorySchema: {
        body: Joi.object().keys({
            _id: Joi.objectId().optional(),
            category_name: stringSchema.optional()
        }),


    },
    deleteCategorySchema: {
        body: Joi.object().keys({
            category_id: Joi.objectId().optional(),
            subCategory_id: Joi.objectId().optional()
        })
    },

    listOfCategorySchema: {
        body: Joi.object().keys({
            cat_id: stringSchema.required
        })
    },
    showTailorDetailsSchema:{
        body:Joi.object().keys({
            tailor_id:Joi.objectId().required()
        })
    },
    // showAllTailorsSchema:{
    //     body:Joi.object().keys({
    //         is_status:stringSchema.required()
    //     })

    // },
    // pendingRequestSchema:{
    //     body:Joi.object().keys({
    //         is_status:stringSchema.required()
    //     })
    // },
    
    accORdecSchema:{
        body:Joi.object().keys({
            tailor_id:Joi.objectId().required(),
            is_status:stringSchema.required()
        })
    },
    showUserDetailsSchema:{
        body:Joi.object().keys({
            user_id:Joi.objectId().required()
        })
    },
    // logOutSchema:{
    //     body:Joi.object().keys({
    //         user_id:Joi.objectId().required()
    //     })
    // }
}

