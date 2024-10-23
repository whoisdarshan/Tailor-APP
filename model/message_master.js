const { version } = require('joi');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MessageMaster= Schema({
    receiver_id:{type:mongoose.Schema.Types.ObjectId},
    sender_id:{type:mongoose.Schema.Types.ObjectId},
    message:{type:String},
    type:{type:String},
    seen:{type:String,default:'false'}
},{
    versionKey:false,
    timestamps:true
});


module.exports= mongoose.model('message_master',MessageMaster);