const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser')
const server = require('http').createServer(app);
const io = require('socket.io')(server);

global.basedir = __dirname;
global.APP_NAME = process.env.APPNAME || "Tailor";
global.APP_URL = process.env.APP_URL || "http://localhost:3456";
const corsOptions = {
    origin: global.APP_URL
};

app.use(cors(corsOptions))
app.use(express.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use('/public', express.static(`${__dirname}/public`))


require('./model/db');
require('./routes')(app)


app.get('/', (req, res) => {
    res.json({ message: "Welcome to the server." })
});
// const NotificationMaster = require('./model/notification_master');
const MessageMaster = require('./model/message_master');
const TailorSkillMaster = require('./model/tailor_skills_master');
const userMaster = require('./model/user_master');
const notificationMaster = require('./model/notification_master');
const BusinessHoursMaster = require('./model/business_hours_master');
const reviewMaster = require('./model/review_master');
const favouriteMaster = require('./model/favourite_master');
const categoryMaster = require('./model/category_master');
const bookAppoinment = require('./model/book_appoinment');
const SkillMasters = require('./model/category_master');


io.on("connection", (socket) => {
    socket.emit("userConnect", socket.id);

    socket.on("socketJoin", (userId) => {
        if (!socket.rooms.has(userId.toString())) {
            console.log("roomJoin-->>>", userId);
            socket.join(userId.toString());
        }
    });

    socket.on("socketLeave", (userId) => {
        if (socket.rooms.has(userId.toString())) {
            console.log("roomLeave-->>>", userId);
            socket.leave(userId.toString());
        }
    });

    socket.on('getNotificationCount', async (userId) => {
        const userNotifi = await notificationMaster.find({ receiver_id: userId, seen: "false" })
        socket.emit("setNotificationCount", { unreadNotifi: userNotifi.length });
    })

    socket.on('readNotification', async (userId) => {
        await notificationMaster.updateMany({ receiver_id: userId }, { seen: "true" }, { new: true })
        const userNotifi = await notificationMaster.find({ receiver_id: userId, seen: "false" })
        socket.emit("setNotificationCount", { unreadNotifi: userNotifi.length });
    })

    // total count of new message
    socket.on('getChatTotalCount', async (loginUserId) => {

        const chatTotalCount = await MessageMaster.aggregate([
            {
                $match: {
                    $or: [
                        // { senderId: new ObjectId(loginUserId) },
                        { receiver_id: new ObjectId(loginUserId) }
                    ],
                    seen: 'false'
                }
            },
            // {
            //     $sort: { createdAt: 1 }
            // },
            {
                $group: {
                    _id: {
                        sender_id: "$sender_id",
                        receiver_id: "$receiver_id"
                    },
                    firstMessage: { $first: "$$ROOT" }
                }
            },
            {
                $replaceRoot: { newRoot: "$firstMessage" }
            },
            {
                $lookup: {
                    from: "message_masters",
                    let: { userId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$sender_id", "$$userId"] },
                                        { $eq: ["$receiver_id", ObjectId(loginUserId)] },
                                        { $eq: ["$seen", false] }
                                    ]
                                }
                            }
                        },
                        {
                            $count: "unreadCount"
                        }
                    ],
                    as: "unreadMessages"
                }
            },
            {
                $addFields: {
                    unreadCount: { $arrayElemAt: ["$unreadMessages.unreadCount", 0] }
                }
            }
        ]);

        socket.emit("setChatTotalCount", { unreadNotifi: chatTotalCount.length });
    })

    socket.on("sendMessage", async (sender_id, receiver_id, message, type) => {

        try {
            const messageCreate = await MessageMaster.create({
                sender_id: sender_id,
                receiver_id: receiver_id,
                message: message,
                type: type
            });
            const msgObj = {
                sender_id: messageCreate?.sender_id,
                receiver_id: messageCreate?.receiver_id,
                message: messageCreate?.message,
                type: messageCreate?.type,
                // createdAt: messageCreate?.createdAt
            };

            const userNotifi = await notificationMaster.find({ receiver_id: receiver_id, seen: "false" })
            const chatTotalCount = await MessageMaster.aggregate([
                {
                    $match: {
                        $or: [
                            { sender_id: new ObjectId(sender_id) },
                            { receiver_id: new ObjectId(sender_id) }
                        ],
                        seen: 'false'
                    }
                },
                // {
                //     $sort: { createdAt: 1 }
                // },
                {
                    $group: {
                        _id: {
                            senderId: "$sender_id",
                            receiverId: "$receiver_id"
                        },
                        firstMessage: { $first: "$$ROOT" }
                    }
                },
                {
                    $replaceRoot: { newRoot: "$firstMessage" }
                },
                {
                    $lookup: {
                        from: "message_masters",
                        let: { userId: "$_id" },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ["$sender_id", "$$userId"] },
                                            { $eq: ["$receiver_id", ObjectId(senderId)] },
                                            { $eq: ["$seen", false] }
                                        ]
                                    }
                                }
                            },
                            {
                                $count: "unreadCount"
                            }
                        ],
                        as: "unreadMessages"
                    }
                },
                {
                    $addFields: {
                        unreadCount: { $arrayElemAt: ["$unreadMessages.unreadCount", 0] }
                    }
                }
            ]);

            const senderUserDetails = await userMaster.findOne({ _id: sender_id })
            const receiverUserDetails = await userMaster.findOne({ _id: receiver_id })

            // if (receiverUserDetails && receiverUserDetails.device_token != "") {
            //     await sendFirebaseNotification(receiverUserDetails.device_token, "Tailor", `${senderUserDetails}` ? `${senderUserDetails.fname} ${senderUserDetails.lname} Sent You a Message` : `Sent You a Message`)
            // }

            socket.to(receiver_id.toString()).emit("setNewMessage", {
                resData: msgObj,
            });

            socket.to(receiver_id.toString()).emit("setNotificationCount", { unreadNotifi: userNotifi.length });
            socket.to(receiver_id.toString()).emit("setChatTotalCount", { unreadNotifi: chatTotalCount.length });

        } catch (error) {
            console.log("sendMessage errorMsg-setNewMessage->>", error);
            let errorMsg = error.message ?? "Somethig went wrong";
            socket.emit("error", errorMsg);
        }
    });

    socket.on("getUserAllChatsUser", async (loginUserId) => {
        try {
            if (!socket.rooms.hasOwnProperty(loginUserId.toString())) {
                socket.join(loginUserId.toString());
            }

            const result = await MessageMaster.aggregate([
                { $match: { $or: [{ senderId: new ObjectId(loginUserId) }, { receiverId: new ObjectId(loginUserId) }] } },
                { $sort: { _id: -1 } },
                {
                    $group: {
                        _id: {
                            $cond: [
                                { $gt: ["$sender_id", "$receiver_id"] },
                                { sender_id: "$sender_id", receiver_id: "$receiver_id" },
                                { sender_id: "$receiver_id", receiver_id: "$sender_id" },
                            ],
                        },
                        latestMessage: { $first: "$$ROOT" },
                    },
                },
                {
                    $addFields: {
                        chatUser: {
                            $first: {
                                $setDifference: [
                                    ["$_id.sender_id", "$_id.receiver_id"],
                                    [new ObjectId(loginUserId)],
                                ],
                            },
                        },
                    },
                },
                {
                    $lookup: {
                        from: "user_masters",
                        localField: "chatUser",//              what is chatuser ?
                        foreignField: "_id",
                        as: "userData",
                    },
                },
                {
                    $lookup: {
                        from: "message_masters",
                        let: { chatUser: "$chatUser" },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ["$sender_id", "$$chatUser"] },
                                            { $eq: ["$receiver_id", new ObjectId(loginUserId)] },
                                            { $eq: ["$seen", 'false'] }
                                        ]
                                    }
                                }
                            },
                            {
                                $count: "unreadCount"
                            }
                        ],
                        as: "unreadMessages"
                    }
                },
                {
                    $addFields: {
                        unreadCount: { $ifNull: [{ $arrayElemAt: ["$unreadMessages.unreadCount", 0] }, 0] }
                    }
                },
                {
                    $project: {
                        profile: {
                            $cond: {
                                if: { $ne: [{ $first: "$userData.profile" }, null] },
                                then: { $concat: [global.APP_URL, '/public/profile/', { $first: "$userData.profile" }] },
                                else: "$$REMOVE"
                            }
                        },
                        unreadCount: 1,
                        user_id: { $arrayElemAt: ["$userData._id", 0] },
                        userName: { $concat: [{ $first: "$userData.fname" }, " ", { $first: "$userData.lname" }] },
                        message: {
                            $cond: {
                                if: { $eq: ["$latestMessage.type", "image"] },
                                then: { $concat: [global.APP_URL, '/public/chat_img/', "$latestMessage.message"] },
                                else: "$latestMessage.message"
                            }
                        },
                        time: "$latestMessage.createdAt"
                    },
                },
                { $sort: { time: -1 } }
            ]);

            const finalRes = []
            for (i of result) {
                if (i._id.sender_id.toString() != i._id.receiver_id.toString()) {
                    const finalOBJ = {
                        // _id: i._id,
                        user_id: i.user_id,
                        profile: i.profile,
                        userName: i.userName,
                        message: i.message,
                        time: i.time,
                        unReadCount: i.unreadCount,
                    }
                    finalRes.push(finalOBJ)
                }
            }

            socket.emit("setChatUserList", { resData: finalRes });
        } catch (error) {
            console.log("getChatUserList errorMsg-setChatUserlist->>", error);
            let errorMsg = error.message ?? "Somethig went wrong";
            socket.emit("error", errorMsg);
        }
    });

    socket.on("twoUserMessageList", async (loginUserId, receiver_id) => {
        try {
            if (!socket.rooms.hasOwnProperty(receiverId.toString())) {
                socket.join(receiverId.toString());
            }
            await MessageMaster.updateMany({ receiver_id: loginUserId, senderId: receiver_id }, { seen: 'true' }, { new: true })
            // const result = await MessageMaster.aggregate([
            //     {
            //         $match: {
            //             $or: [
            //                 {
            //                     $and: [
            //                         { senderId: new ObjectId(loginUserId) },
            //                         { receiverId: new ObjectId(receiverId) },
            //                     ],
            //                 },
            //                 {
            //                     $and: [
            //                         { senderId: new ObjectId(receiverId) },
            //                         { receiverId: new ObjectId(loginUserId) },
            //                     ],
            //                 },
            //             ],
            //         },
            //     },
            // ])
            //     .project({ senderId: 1, receiverId: 1, message: 1, updatedAt: 1, type: 1 });
            const result = await MessageMaster.aggregate([
                {
                    $match: {
                        $or: [
                            {
                                $and: [
                                    { sender_id: new ObjectId(loginUserId) },
                                    { receiver_id: new ObjectId(receiver_id) },
                                ],
                            },
                            {
                                $and: [
                                    { sender_id: new ObjectId(receiver_id) },
                                    { receiver_id: new ObjectId(loginUserId) },
                                ],
                            },
                        ],
                    },
                },
                {
                    $addFields: {
                        message: {
                            $cond: {
                                if: { $eq: ["$type", "image"] },
                                then: { $concat: [global.APP_URL + '/public/chat_img/', '$message'] },
                                else: "$message",
                            },
                        },
                    },
                },
                {
                    $project: {
                        sender_id: 1,
                        receiver_id: 1,
                        message: 1,
                        // createdAt: 1,
                        type: 1,
                    },
                },
                { $sort: { _id: -1 } }
            ]);
            socket.emit("setMessageList", { resData: result });
        } catch (error) {
            console.log("twoUserMessageList errorMsg-setChatUserlist->>", error);
            let errorMsg = error.message ?? "Somethig went wrong";
            socket.emit("error", errorMsg);
        }
    });
});


const PORT = process.env.PORT || 3456

app.listen(PORT, () => {
    console.log(`server is running on port ${PORT}.`)
})

