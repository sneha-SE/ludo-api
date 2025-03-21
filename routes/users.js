var express = require('express');
var router = express.Router();
const {createRoom, joinRoom, leaveRoom, getPublicRooms} = require('../controllers/roomControl');
const {startGame, getSettings, getAboutInfo, quitGame} = require('../controllers/gameControl');
router.get('/', function (req, res, next) {
    res.render('index', { title: 'Express' });
});

router.post("/start", startGame);
router.get("/settings", getSettings);
router.get("/about", getAboutInfo);
router.post("/quit", quitGame);

router.post('/create-room', createRoom);
router.post('/join-room', joinRoom);
router.post('/leave-room', leaveRoom);


//public room api
router.get('/get-rooms', getPublicRooms);

module.exports = router;