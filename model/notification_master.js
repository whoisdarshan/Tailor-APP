const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const notificationMaster = Schema({
    sender_id: { type: mongoose.Schema.Types.ObjectId },
    receiver_id: { type: mongoose.Schema.Types.ObjectId },
    message: { type: String },
    is_status: { type: String, default: '' },
    seen:{type:String,default:'false'}
}, {
    versionKey: false,
    timestamps: true
});

module.exports = mongoose.model('notification_master', notificationMaster);