const express = require('express')
const mongoose = require('mongoose')
// const io = require('socket.io')('http');

mongoose.connect('mongodb://127.0.0.1:27017/dynamic-chap-app')
const app = express()
const userRoute = require('./routes/userRoute')
const User = require('./models/userModel');
const Chat = require('./models/chatModel');
app.use('/', userRoute)

const http = require("http").Server(app);

const io = require("socket.io")(http);

const usp = io.of('/user-namespace');

usp.on('connection', async function (socket) {
    console.log("User connected ..");
    let userId = socket.handshake.auth.token;
    await User.findByIdAndUpdate({_id: userId},{$set:{is_online: '1'}})
    //User broadcast online Status
    socket.broadcast.emit('getOnlineUser',{user_id:userId});

    socket.on('disconnect', async  function () {
        console.log("User disconnected ..");
        let userId = socket.handshake.auth.token;
        await User.findByIdAndUpdate({_id: userId},{$set:{is_online: '0'}})
        //User broadcast offiline Status
        socket.broadcast.emit('getOfflineUser',{user_id:userId});
    })

    socket.on('newChat',function(data){
        // console.log(data);
        socket.broadcast.emit('loadNewChat',data)
    })
    // Load old chats 
    socket.on('existChat',async function(data){
        var chats = await Chat.find({$or:[
            {
                sender_id:data.sender_id,
                receiver_id:data.receiver_id 
            },
            {
                sender_id:data.receiver_id,
                receiver_id:data.sender_id 
            }
        ]});
        socket.emit('loadChats',{chats,chats})

    })

    // /Deleted Message 
    socket.on('chatDeleted',function(id){
        socket.broadcast.emit('chatMessageDeleted',id)

    })

      // /Updated Message 
  socket.on('chatDeleted',function(data){
    socket.broadcast.emit('chatMessageUpdated',data)

})

})




http.listen(4040, function () {
    console.log(`Server is working on http://localhost:${4040}`);
});