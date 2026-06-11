import socketio

# Create socket.io async server
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')

@sio.event
async def connect(sid, environ):
    # print(f"Connected: {sid}")
    pass

@sio.event
async def disconnect(sid):
    # print(f"Disconnected: {sid}")
    pass

@sio.event
async def join_room(sid, room):
    await sio.enter_room(sid, room)
    # print(f"Client {sid} joined room {room}")

@sio.event
async def send_message(sid, data):
    # data has format: { 'room': groupId, 'message': messageObject }
    room = data.get('room')
    # Broadcast to all users in the room
    await sio.emit('receive_message', data, room=room)

@sio.event
async def goal_updated(sid, data):
    room = data.get('room')
    await sio.emit('refresh_goals', room=room)

@sio.event
async def resource_uploaded(sid, data):
    room = data.get('room')
    await sio.emit('refresh_resources', room=room)
