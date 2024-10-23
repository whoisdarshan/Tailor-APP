const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userMaster = Schema({
    fname: { type: String },
    lname: { type: String },
    profile: { type: String },
    phone: { type: Number, unique: true },
    language: { type: String },
    pastcode: { type: Number },
    city: { type: String },
    street: { type: String },
    password: { type: String },
    Bio: { type: String },
    is_status:{type:String,default:'pending'},
    user_type: { type: String },
    location: {
        type: {
            type: String, // 'Point' for 2dsphere index
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            index: '2dsphere', // Use '2dsphere' index for geospatial queries
            required: true
        }
    }
}, {
    versionKey: false,
    timestamps: true
});

userMaster.statics = {
    /**
     * get details 
     * @param {*} filter
     * @returns
     */
    async get(id) {
        return this.findById(id)
    },

    /**
     * list of data
     * @param {*} filter
     * @returns
     */

    async list(filter = {}) {
        return this.find(filter)
    }
}

publicPath = APP_URL + '/public/';

userMaster.methods.toJSON = function () {
    var obj = this.toObject();
    var objectKey = Object.keys(obj);
    objectKey.forEach(function (key) {
        if (obj[key] == null) {
            obj[key] = ''
        }
    })

    if (obj.profile && obj.profile !== '') {
        obj.profile = publicPath + 'profile/' + obj.profile;
    }
    return obj;
}

module.exports = mongoose.model('user_master', userMaster)