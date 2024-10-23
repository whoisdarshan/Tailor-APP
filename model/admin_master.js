const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AdminMaster= Schema({
    name:{type:String,default:[true,"Enter first name"]},
    email:{type:String,default:[true,"Enter your email"]},
    password:{type:String,default:[true,"Enter your password"]},
    deleted_at:{type:Date,default:null}
},{
    collection:'admin_master'
},{
    versionKey:false,
    timestamps:true
})


AdminMaster.statics={
    /**
     * get data
     * @param {*} filter
     * @returns
     */
    async get(id){
        return this.findOne(id).exec();
    },
    /**
     * list data
     * @param {*} filter
     * @returns
     */
    async list(filter={}){
        return this.find(filter).exec();
    }
    
}

AdminMaster.methods.toJSON=function(){
    var obj = this.toObject();
    let objKeys= Object.keys(obj);
    objKeys.forEach(key=>{
        if(obj[key]==null){
            obj[key]=''
        }
    })
    return obj;
}

module.exports= mongoose.model('admin_master',AdminMaster);