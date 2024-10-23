const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const BusinessHoursSchema = Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId },
    start:{type:String},
    end:{type:String},
    day: { type: String },
    open: { type: Boolean },
    breakStart: { type: String },
    breakEnd: { type: String },
    deleted_at: { type: Date, default: null }
},
    {
        versionKey: false,
        timestamps: true
    });
    
   
module.exports = mongoose.model('businessHours_master', BusinessHoursSchema);

