const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const categoryMaster = Schema ({
    subCategory:{type:mongoose.Schema.Types.ObjectId,default:null},
    category_name:{type:String},
    img:{type:String},
    deleted_at:{type:Date,default:null}
},{
    versionKey:false,
    timestamps:true
});

categoryMaster.statics = {
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

categoryMaster.methods.toJSON = function () {
    var obj = this.toObject();
    var objectKey = Object.keys(obj);
    objectKey.forEach(function (key) {
        if (obj[key] == null) {
            obj[key] = ''
        }
    })

    if (obj.img && obj.img !== '') {
        obj.img = publicPath + 'profile/' + obj.img;
    }
    return obj;
}


module.exports= mongoose.model('category_master',categoryMaster);