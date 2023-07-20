const express = require('express');
const path = require('path');
const multer = require('multer');
const user_route = express();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const dotenv = require('dotenv').config() 

user_route.use(session({
    secret: process.env.SESSION_SECRET_KEY,
    resave: true,
    saveUninitialized: true
}))

user_route.use(cookieParser());
user_route.use(bodyParser.json());
user_route.use(bodyParser.urlencoded({
    extended: true
}));
user_route.set('view engine', 'ejs');
user_route.set('views', './views')
user_route.use(express.static('public'))
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../public/images'))
    },
    filename: function (req, file, cb) {
        const name = Date.now() + '-' + file.originalname
        cb(null, name)
    }
})
const upload = multer({
    storage: storage
});
const {
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
} = require('../controllers/userController')
const {isLoggedIn,isLoggedOut} = require('../middleware/auth')

user_route.get('/register',isLoggedOut, registerLoad);
user_route.post('/register', upload.single('image'), register);

// login
user_route.get('/login', isLoggedOut,loginLoad);
user_route.post('/login', login);
user_route.get('/dashboard',isLoggedIn, dashboard);
user_route.post('/save-chat',isLoggedIn, savechat);
user_route.post('/delete-chat',isLoggedIn, deletechat);
user_route.post('/update-chat',isLoggedIn, updatechat);
user_route.get('/logout',isLoggedIn, logout);

// Start Group Chats 18-07-2023
user_route.get('/groups',isLoggedIn, groups);
user_route.post('/groups',upload.single('image'), createGroup);

// user_route.get('*',(req,res)=>{
//     res.redirect('/login')
// });
module.exports = user_route;