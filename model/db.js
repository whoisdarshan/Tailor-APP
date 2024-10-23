const mongoose = require('mongoose');
const config= require('../config/common.config')

mongoose.set('strictQuery',true);

mongoose.connect('mongodb://localhost:27017/tailor')
.then(()=>console.log('DB connected'))
 .catch((err)=>{
    console.log("eror while connecting to mongo daatbase",err)
 });
 