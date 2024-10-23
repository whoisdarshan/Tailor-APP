const mongoose= require('mongoose');
const Schema= mongoose.Schema;

const myJobMaster= Schema({
    user_id:{type: mongoose.Schema.Types.ObjectId},
    tailor_id:{type: mongoose.Schema.Types.ObjectId},
    
})