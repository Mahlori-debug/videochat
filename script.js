const socket = io();

const createBtn = document.getElementById('createBtn');
const joinBtn = document.getElementById('joinBtn');
const roomInput = document.getElementById('roomInput');
const videoContainer = document.getElementById('videoContainer');
const myVideo = document.getElementById('myVideo');
const peerVideo = document.getElementById('peerVideo');

let localStream;
let peerStream;
let peerConnection;
let room = new URLSearchParams(window.location.search).get('room');

// Create room and redirect
createBtn.addEventListener('click', () => {
    const newRoom = generateRoomId();
    window.location.href = `/?room=${newRoom}`;
});

// Join a room with the room ID
joinBtn.addEventListener('click', () => {
    room = roomInput.value.trim();
    if (room) {
        window.location.href = `/?room=${room}`;
    } else {
        alert("Please enter a room ID!");
    }
});

// Generate a random room ID
function generateRoomId() {
    return Math.random().toString(36).substring(2, 9);
}

// Join the room on page load
if (room) {
    socket.emit('join', room);
    startVideo();
}

// Handle media stream and WebRTC connections
async function startVideo() {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
        });
        myVideo.srcObject = localStream;
        if (room) {
            socket.emit('offer', room);
        }
    } catch (err) {
        console.log("Error accessing media devices.", err);
    }
}

// Socket.io listeners
socket.on('user-joined', () => {
    console.log('A new user joined the room');
    createPeerConnection();
});

socket.on('offer', (offer) => {
    createPeerConnection();
    peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    peerConnection.createAnswer().then(answer => {
        peerConnection.setLocalDescription(answer);
        socket.emit('answer', answer, room);
    });
});

socket.on('answer', (answer) => {
    peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
});

socket.on('ice-candidate', (candidate) => {
    peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
});

// Handle ICE candidates
function handleICECandidate(event) {
    if (event.candidate) {
        socket.emit('ice-candidate', event.candidate, room);
    }
}

// Create the peer connection
function createPeerConnection() {
    peerConnection = new RTCPeerConnection({
        iceServers: [{
            urls: 'stun:stun.l.google.com:19302',
        }]
    });

    peerConnection.addEventListener('icecandidate', handleICECandidate);
    peerConnection.addEventListener('track', (event) => {
        peerVideo.srcObject = event.streams[0];
    });

    localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
    });
}
