const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const reviewMaster=Schema({
    user_id:{type:mongoose.Schema.Types.ObjectId},
    tailor_id:{type:mongoose.Schema.Types.ObjectId},
    rating:{type:Number,min:1,max:5},
    comment:{type:String}
},{
    versionKey:false,
    timestamps:true
})

module.exports=mongoose.model('review_master',reviewMaster);