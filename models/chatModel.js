const mongoose = require('mongoose');
const chatModel = new mongoose.Schema({ 
    sender_id:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users'
    },
    receiver_id:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users'
    },
    message:{type:String,require:true}
},
{timestamps:true}
)
module.exports = mongoose.model('chats',chatModel)