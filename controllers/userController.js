const User = require('../models/userModel')
const Chat = require('../models/chatModel');
const bcrypt = require('bcrypt')
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
                res.cookie(`user`,JSON.stringify(userData));
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
module.exports = {
    registerLoad,
    register,
    loginLoad,
    login,
    dashboard,
    savechat,
    deletechat,
    updatechat,
    logout
}