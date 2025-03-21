var express = require('express');
var router = express.Router();
const userController = require('../controllers/userControl');
router.get('/', function (req, res, next) {
    res.render('index', { title: 'Express' });
});

router.post('/users/signup', userController.signup);
router.post('/users/login', userController.login);
router.post('/users/forget', userController.sendResetOTP);
router.post('/users/verify', userController.verifyOTP);
router.post('/users/reset', userController.resetPassword);

router.post('/users/changeUsername', userController.userCanChangeUserName);
router.post('/users/change-avatar', userController.userCanChangeAv);


module.exports = router;
