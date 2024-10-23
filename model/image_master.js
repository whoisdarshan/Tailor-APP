const mongoose= require('mongoose');
const Schema= mongoose.Schema;

const imageMaster= Schema({
    tailor_id:{type:mongoose.Schema.Types.ObjectId},
    images:{type:Array}
},{
    versionKey:false,
    timestamps:true
});

imageMaster.statics = {
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

imageMaster.methods.toJSON = function () {
    var obj = this.toObject();
    var objectKey = Object.keys(obj);
    objectKey.forEach(function (key) {
        if (obj[key] == null) {
            obj[key] = ''
        }
    })

    // Handle  multiple images with different paths

    // if (obj.images && obj.images !== '') {
    //     obj.images = publicPath + 'profile/' + obj.images;
    // }
    // return obj;

    if (Array.isArray(obj.images)) {
        for (let i in obj.images) {
            obj.images[i] = publicPath + 'profile/' + obj.images[i];
        }
    }

    return obj;
}

module.exports= mongoose.model('imageUpload_master',imageMaster);