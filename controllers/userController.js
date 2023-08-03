const User = require('../models/userModel')
const Chat = require('../models/chatModel');
const Group = require('../models/groupModel');
const Member = require('../models/memberModel');
const bcrypt = require('bcrypt');
const {
    request
} = require('express');
const mongoose = require('mongoose');

const registerLoad = async (req, res) => {
    try {
        res.render('register')
    } catch (error) {
        console.log(error.message);
    }
}
const register = async (req, res) => {
    try {
        let passwordHash = await bcrypt.hash(req.body.password, 10);
        const user = new User({
            name: req.body.name,
            email: req.body.email,
            image: 'images/' + req.file.filename,
            password: passwordHash
        })
        user.save();
        res.render('register', {
            message: 'Your Registration is Succesfully !!'
        })
    } catch (error) {
        console.log(error.message);

    }
}
const loginLoad = async (req, res) => {
    try {
        res.render('login')
    } catch (error) {
        console.log(error.message);
    }
}
const login = async (req, res) => {
    try {
        const password = req.body.password;
        const userData = await User.findOne({
            email: req.body.email,
        })
        if (userData) {
            const passwordMatch = await bcrypt.compare(password, userData.password);
            if (passwordMatch) {
                req.session.user = userData;
                res.cookie(`user`, JSON.stringify(userData));
                res.redirect('/dashboard');
            } else {
                res.render('login', {
                    message: 'Email and password are incorrect'
                })
            }
        } else {

            res.render('login', {
                message: 'Email and password are incorrect'
            })
        }

    } catch (error) {
        console.log(error.message);

    }
}
const dashboard = async (req, res) => {
    try {
        let users = await User.find({
            _id: {
                $nin: [req.session.user._id]
            }
        })
        res.render('dashboard', {
            user: req.session.user,
            users: users
        })
    } catch (error) {
        console.log(error.message);
    }
}

const savechat = async (req, res) => {
    try {
        let chat = new Chat({
            sender_id: req.body.sender_id,
            receiver_id: req.body.receiver_id,
            message: req.body.message
        })
        let newData = await chat.save();
        res.status(201).send({
            success: true,
            message: 'Message successfully',
            data: newData
        });
    } catch (error) {
        console.log(error.message);
        res.status(400).send({
            success: false,
            message: error.message
        });
    }
}
const deletechat = async (req, res) => {
    try {
        console.log(req.body.id)
        await Chat.deleteOne({
            _id: req.body.id
        })
        res.status(201).send({
            success: true
        });
    } catch (error) {
        console.log(error.message);
        res.status(400).send({
            success: false,
            message: error.message
        });
    }
}
const updatechat = async (req, res) => {
    try {
        await Chat.findByIdAndUpdate({
            _id: req.body.id
        }, {
            $set: {
                message: req.body.message
            }
        })
    } catch (error) {
        console.log(error.message);
        res.status(400).send({
            success: false,
            message: error.message
        });
    }
}
const logout = async (req, res) => {
    try {
        res.clearCookies('user');
        req.session.destroy();
        res.redirect('/login');

    } catch (error) {
        console.log(error.message);
    }
}

// Group Chats 
const groups = async (req, res) => {
    try {
        const groups = await Group.find({
            creator_id: req.session.user._id
        })
        console.log(groups);
        res.render('groups', {
            groups: groups
        })
    } catch (error) {
        console.log(error.message);
    }
}
// Group Chats 
const createGroup = async (req, res) => {
    try {

        const group = new Group({
            creator_id: req.session.user._id,
            name: req.body.name,
            image: 'images/' + req.file.filename,
            limit: req.body.limit,
        })

        await group.save();
        const groups = await Group.find({
            creator_id: req.session.user._id
        })
        res.render('groups', {
            groups: groups,
            message: "Group Created Successfully"
        })
    } catch (error) {
        console.log(error.message);
    }
}

const getMembers = async (req, res) => {
    try {

        // let users = await User.find({
        //     _id: {
        //         $nin: req.session.user._id
        //     }
        // });
        let users = await User.aggregate([
            {
                $lookup:{
                    from:"members",
                    localField:"_id",
                    foreignField:"user_id",
                    pipeline:[
                        {
                            $match:{
                                $expr:{
                                    $and:[
                                        {
                                            $eq:["$group_id",new mongoose.Types.ObjectId(req.body.group_id)]
                                        }
                                    ]
                                }
                            }
                        }
                    ],
                    as:"member"
                }
            },
            {
                $match:{
                    "_id":{
                        $nin:[new mongoose.Types.ObjectId(req.session.user._id)]
                    }
                }
            }
        ]);
        console.log(users);
        res.status(200).send({
            success: true,
            data: users
        });
    } catch (error) {
        console.log(error.message);
    }
}
const addMembers = async (req, res) => {
    try {

        if (!req.body.members) {
            res.status(200).send({
                success: false,
                msg: "Please select anyone Member"
            });
        } else if (req.body.members.length > parseInt(req.body.limit)) {
            res.status(200).send({
                success: false,
                msg: `You can not select more than ${req.body.limit} Member`
            });
        }
        else{
            await Member.deleteMany({group_id:req.body.group_id})
            var data = [];
            let members = req.body.members
            for (var i = 0; i < members.length; i++) {
                data.push({
                    group_id:req.body.group_id,
                    user_id:members[i],

                })
            }
            await Member.insertMany(data)
            res.status(200).send({
                success: true,
                msg: `Members Added Successfully....`
            });
        }
    } catch (error) {
        console.log(error.message);
    }
}

const updateChatGroup = async (req, res) => {
    try {
        if(parseInt(req.body.limit)<parseInt(req.body.last_limit)){
            await Member.deleteMany({group_id:req.body.gid});
        }
        var updateObj;
        if(req.file != undefined ){
            updateObj ={
                name: req.body.name,
                image: 'images/' + req.file.filename,
                limit: req.body.limit,
            }
        }else{
            updateObj ={
                name: req.body.name,
                limit: req.body.limit,
            }

        }
        await Group.findByIdAndUpdate({_id:req.body.gid},{$set:updateObj})

        res.status(200).send({
            success: true,
            msg: `Chat group updated successfully ....`
        });
    } catch (error) {
        console.log(error.message);
    }

}
const deleteChatGroup = async(req, res) => {
try {
    await Group.deleteOne({_id:req.body.gid});
    await Member.deleteMany({group_id:req.body.gid});
    res.status(200).send({
        success: true,
        msg: `Chat group delete successfully ....`
    });
} catch (error) {
    console.log(error.message);
}
}
module.exports = {
    registerLoad,
    register,
    loginLoad,
    login,
    dashboard,
    savechat,
    deletechat,
    updatechat,
    logout,
    groups,
    createGroup,
    getMembers,
    addMembers,
    updateChatGroup,
    deleteChatGroup
}