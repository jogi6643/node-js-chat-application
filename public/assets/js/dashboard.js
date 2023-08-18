function getCookie(name) {
	let matches = document.cookie.match(new RegExp(
		"(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
	));
	return matches ? decodeURIComponent(matches[1]) : undefined;
}
var userData = JSON.parse(getCookie('user'));
console.log('userData',userData._id);

// var sender_id = `<%= user._id %>`;
var sender_id = userData._id;
var receiver_id;
let socket = io('/user-namespace', {
    auth: {
        // token: `<%= user._id %>`
        token: userData._id
    }
});

$(document).ready(function () {
    $(".user-list").click(function () {
        let userId = $(this).attr("data-id");
        receiver_id = userId;
        // console.log(sender_id, receiver_id);
        $(".chat-heading").hide();
        $(".chat-section").show();
        $(".chat-container").show();
        socket.emit('existChat', {
            sender_id: sender_id,
            receiver_id: receiver_id
        })
        scrollChat();

    });
})

// Update user online status
socket.on('getOnlineUser', function (data) {
    $('#' + data.user_id + '-status').text('Online');
    $('#' + data.user_id + '-status').removeClass('offline-status');
    $('#' + data.user_id + '-status').addClass('online-status');
})

// Update user offline status
socket.on('getOfflineUser', function (data) {
    $('#' + data.user_id + '-status').text('Offline');
    $('#' + data.user_id + '-status').addClass('offline-status');
    $('#' + data.user_id + '-status').removeClass('online-status');


})

// chat save by user

$('#chat-form').submit(function (event) {
    event.preventDefault();
    let message = $('#message').val();
    $.ajax({
        url: '/save-chat',
        type: 'POST',
        data: {
            sender_id: sender_id,
            receiver_id: receiver_id,
            message: message
        },
        success: function (data) {
            if (data.success) {
                $('#message').val('');
                let chat = data.data.message;
                let html = `<div class="current-user-chat" id='${data.data._id}'>
                             <h5><span>${chat}</span>
                                <i class='fa fa-trash' aria-hidden='true' data-id='${data.data._id}' data-toggle="modal" data-target="#deleteChatModal"></i>
                                <i class='fa fa-edit' aria-hidden='true' data-id='${data.data._id}' data-toggle="modal" data-target="#editChatModal1"></i>
                            </h5>
                            </div>`;
                $('#chat-container').append(html);
                socket.emit('newChat', data.data)
            } else {
                alert(data.message);
            }
        }
    })

})


// Load other user chats from broadcast
socket.on('loadNewChat', function (data) {
    if (sender_id == data.receiver_id && receiver_id == data.sender_id) {
        let chat = data.message;
        let html = ` <div class="other-user-chat" id='${data._id}'>
                             <h5><span>${chat}
                                </span></h5>
                            </div>`;
        $('#chat-container').append(html);
        scrollChat();
    }
})
// Load Old Chats 
socket.on('loadChats', function (data) {
    $('#chat-container').html('');
    var chats = data.chats;

    let html = '';
    for (var i = 0; i < chats.length; i++) {

        let addClass = '';
        if (chats[i]['sender_id'] == sender_id) {
            addClass = 'current-user-chat';
        } else {
            addClass = 'other-user-chat';
        }
        html += `<div class='${addClass}' id='${chats[i]['_id']}'>
    <h5><span>${chats[i]['message']}</span>`;

        if (chats[i]['sender_id'] == sender_id) {
            html += `<i class='fa fa-trash' aria-hidden='true' data-id='${chats[i]['_id']}' data-toggle="modal" data-target="#deleteChatModal"></i>
            <i class='fa fa-edit' aria-hidden='true' data-id='${chats[i]['_id']}' data-msg='${chats[i]['message']}'  data-toggle="modal" data-target="#editChatModal1"></i>`;
        }
        html += `</h5>
    </div>`;
        // console.log(html);
        $('#chat-container').append(html);
        scrollChat();

    }
})

//Scroll Chat on Top 
function scrollChat() {
    $('#chat-container').animate({
        scrollTop: $('#chat-container').offset().top + $('#chat-container')[0].scrollHeight
    }, 0)
}

// delete chat  work

$(document).on('click', '.fa-trash', function () {
    let msg = $(this).parent().text();
    $('#delele-message').text(msg);
    $('#delete-message-id').val($(this).attr('data-id'));
    console.log(msg);

})

$('#delete-chat-form').submit(function (e) {
    e.preventDefault();
    let id = $('#delete-message-id').val();
    $.ajax({
        url: 'delete-chat',
        type: 'POST',
        data: {
            id: id
        },
        success: function (response) {
            if (response.success) {
                $('#id' + id).remove();
                $('#deleteChatModal').modal('hide');
                socket.emit('chatDeleted', id);

            } else {
                alert(response.message)
            }

        }
    })

});
socket.on('chatMessageDeleted', function (id) {
    $('#' + id).remove();
})

// Update User chat Functionality
$(document).on('click','.fa-edit',function () {
    $('#edit-message-id').val($(this).attr('data-id'))
    $('#update-message').val($(this).attr('data-msg'))

})


// update msg using ajax

$('#edit-chat-form').submit(function (e) {
    e.preventDefault();
    let id = $('#edit-message-id').val();
    let msg = $('#update-message').val();
    $.ajax({
        url: 'update-chat',
        type: 'POST',
        data: {
            id: id,
            message:msg
        },
        success: function (response) {
            if (response.success) {
                $('#editChatModal').modal('hide');
                $('#'+id).find('span').text(msg);
                $('#'+id).find('.fa-edit').attr('data-msg',msg);
                socket.emit('chatUpdated', {id:id,message:msg});

            } else {
                alert(response.message)
            }

        }
    })

});

socket.on('chatMessageUpdated', function (data) {
    $('#'+data.id).find('span').text(data.message);

})


// Add Members 

$('.addMember').click(function (e) {
    console.log($(this).attr('data-id'),'Hii');
   let group_id = $(this).attr('data-id');
   let limit = $(this).attr('data-limit');
   $('#group_id').val(group_id);
   $('#limit').val(limit);
    $.ajax({
        url:'/get-members',
        type:'POST',
        data:{group_id:group_id},
        success: function (res) {
            if(res.success===true) {
             let users = res.data;
             let html = '';
             for(let i=0; i<users.length; i++) {
                let isMemberOfGroup = users[i].member.length>0?true:false;
                html += `<tr>
                          <td><input type="checkbox" ${isMemberOfGroup?'checked':''} name="members[]" value="${users[i]._id}"></td>
                          <td>${users[i].name}</td>
                        </tr>`;

             }
             $('.addMemberTable').html(html);
            }else{
                alert('Something went wrong');
            }

        }
    })
})


// Add Member
$('#add-member-form').submit(function(event){
    event.preventDefault();
    var formData = $(this).serialize();
    $.ajax({
        url:'/add-members',
        type: 'POST',
        data:formData,
        success: function(response){
            if(response.success){
             
             $('#add-member-form')[0].reset();
             $('#membermodal').modal('hide');
             alert(response.msg);

            }else{
                $('#add-member-error').text(response.msg);
                setTimeout(() => {
                $('#add-member-error').text('');
                }, 2000);
            }
        }
    });
})


// Update Group 

$('.updateGroup').click(function(){
    var obj = JSON.parse($(this).attr('data-obj'));
    $("#update_group_id").val(obj._id);
    $("#last_limit").val(obj.limit);
    $("#group_name").val(obj.name);
    $("#group_limit").val(obj.limit);

})

$('#updateChatGroupForm').submit(function(e){
    e.preventDefault();
    $.ajax({
        url:'/update-chat-group',
        type: 'POST',
        data:new FormData(this),
        contentType: false,
        cache:false,
        processData:false,
        success: function(response){
            alert(response.msg);
            if(response.success){
                location.reload();
            }
        }
    })
})


// Delete Goup 

$('.deleteGroup').click(function(e){
    $('#delete_group_id').val($(this).attr('data-id'));
    $('#delete_group_name').text($(this).attr('data-name'));
    // console.log($(this).attr('data-name'));
})


$('#deleteChatGroupForm').submit(function(event){
    event.preventDefault();
    var formData = $(this).serialize();
    $.ajax({
        url:'/delete-chat-group',
        type: 'POST',
        data:formData,
        success: function(response){
            alert(response.msg);
            if(response.success){
                location.reload();
            }
        }
    });
})

// Copy 

$('.copy').click(function(event){
    $(this).prepend('<span class="copied_text">Copied</span>');
    var group_id = $(this).attr('data-id');
    var url = window.location.host+'/share-group/'+group_id;
    var temp = $("<input>");
    $("body").append(temp);
    temp.val(url).select();
    document.execCommand("copy");
    temp.remove();
    setTimeout(() => {
        $(".copied_text").remove();
    }, 2000);
})

// join now chat 

$('.join-now').click(function(e) {
    $(this).text('waiting...');
    $(this).attr('disabled', 'disabled');
    var group_id = $(this).attr('data-id');
    $.ajax({
        url:'/join-group',
        type: 'POST',
        data:{group_id:group_id},
        success: function(res){
            alert(res.msg);
            if(res.success){
                location.reload();
            }else{
            $(this).text('Join Now');
            $(this).removeAttr('disabled');
            }

        }
    })
})