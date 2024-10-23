const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const OTPMaster = Schema({
    otp_code:{type:Number,default:[true,"Enter your otp"]},
    email:{type:String},
    phone:{type:String},
    ccode:{type:String},
    deleted_at:{type:Date,default:null}

},{
    collection:'otp_master'
},{
    versionKey:false,
    timestamps:true
})



module.exports= mongoose.model('otp_master',OTPMaster);