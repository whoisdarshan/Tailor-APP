const admin = require('../model/admin_master');
const user = require('../model/user_master');
const config = require('../config/common.config')
const jwt = require('jsonwebtoken')

exports.adminVerifyToken = async (req, res, next) => {
    try {
        let authorized = req.headers['authorization'];
        if (typeof authorized != 'undefined') {
            let token = authorized.split(' ')[1]
            let decoded  = jwt.verify(token, 'darshan')
            const adminId= decoded.adminId
            let adminResponse =await  admin.findOne({ _id: adminId, deleted_at: null })
            if (adminResponse) {
                req.admin = adminResponse; 
                next();
            } else {
                res.status(401).json({ message: "Admin not found or has been deleted." });
            }
        }
    } catch (error) {
        console.log(error);
        res.send('Invalid Token')
    }
}

exports.userVerifyToken = async (req, res, next) => {
    try {
        let authorized = req.headers['authorization'];
        if (typeof authorized != 'undefined') {
            let token = authorized.split(' ')[1]
            let decode = jwt.verify(token, 'darshan');
            const userId= decode.userId;
            const userResponse = await user.findOne({ _id: userId, deleted_at: null });
            if(userResponse){
                req.user=userResponse
                next();
            }else{
                res.status(404).json({message:"User not found or has been deleeted"})
            }
        }
    } catch (error) {
        console.log(error);
        res.send('Invalid token')
    }
}