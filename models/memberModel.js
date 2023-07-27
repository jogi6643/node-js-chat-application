const mongoose = require('mongoose');
const memberModel = new mongoose.Schema({ 
    group_id:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'groups'
    },
    user_id:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users'
    },
    message:{type:String,require:true}
},
{timestamps:true}
)
module.exports = mongoose.model('members',memberModel)