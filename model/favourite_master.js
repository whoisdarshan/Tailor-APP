const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const favouriteMaster= Schema({
    user_id:{type:mongoose.Schema.Types.ObjectId},
    tailor_id:{type:mongoose.Schema.Types.ObjectId},
    deleted_at:{type:Date,default:null}
},{
    versionKey:false,
    timestamps:true
});

module.exports= mongoose.model('favourite_master',favouriteMaster);