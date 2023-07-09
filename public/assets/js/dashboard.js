var sender_id = `<%= user._id %>`;
var receiver_id;
let socket = io('/user-namespace', {
    auth: {
        token: `<%= user._id %>`
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
    console.log(sender_id + '==' + data.receiver_id, 'ok');
    if (sender_id == data.receiver_id && receiver_id == data.sender_id) {
        let chat = data.message;
        let html = ` <div class="other-user-chat" id='${data._id}'>
                             <h5>${chat}
                                </h5>
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
                $('#deleteChatModal').model('hide');
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