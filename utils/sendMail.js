const nodemailer = require('nodemailer');
// const mailsuite= require('mailsuite');

// var transport = nodemailer.createTransport({
//     service: 'mail.hexanetwork.in',
//     port: 25,
//     secure: false,
//     auth: {
//         user: 'admin@hexanetwork.in',
//         pass: 'Kmphasis@12345'
//     },
//     tls: {
//         rejectUnauthorized: false
//     }
// });
// const sendMail = function (to, subject, body) {
//     console.log(to);
//     message = {

//         from: "admin@hexanetwork.in",   
//         to: to,
//         subject: subject,
//         html: body,
//     }
//     transport.sendMail(message, function (err, info) {
//         if (err) {
//             console.log(err)
//         } else {
//             console.log(info);
//         }
//     })
// };





const transport = nodemailer.createTransport({
    host : 'smtp.ethereal.email',
    port : 3456,
    auth : {
        user : 'danielle.denesik36@ethereal.email',
        pass : 'SsaPrxnSEFTX4xG61H'
    }
});

const sendMail = function(to,subject,body){
    let message={
        from : "<admin@gmail.com>",
        to : to, 
        subject : subject,
        text :body
    }
    transport.sendMail(message, function (err, info) {
                if (err) {
                    console.log(err)
                } else {
                    console.log(info);
                }
            })

}



module.exports = sendMail;
