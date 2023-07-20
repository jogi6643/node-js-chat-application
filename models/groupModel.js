const mongoose = require('mongoose');
const groupModel = new mongoose.Schema({ 
    creator_id:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users'
    },
    name:{
        type: String,
        required: true
    },
    image:{
        type:String,
        require:true
    },
    limit:{
        type:Number, 
        required:true
    }
},
{timestamps:true}
)
module.exports = mongoose.model('groups',groupModel)