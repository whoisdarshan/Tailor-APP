const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const appoinmentMaster = Schema({
    tailor_id: { type: mongoose.Schema.Types.ObjectId },
    user_id:{type:mongoose.Schema.Types.ObjectId},
    date:{type:String},
    time:{type:String},
    skill:{type:Array},
    note:{type:String},
    is_status:{type:String,default:''},
    deleted_at:{type:Date,default:null}
},{
    versionKey:false,
    timestamps:true
});


module.exports= mongoose.model('book_appoinment_masters',appoinmentMaster);