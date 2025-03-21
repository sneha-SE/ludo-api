const User = require('../models/userSchema');

const startGame = (req, res) => {
    res.json({ message: "Game Started!" });
};

const getSettings = (req, res) => {
    res.json({ message: "Fetching Settings..." });
};

const getAboutInfo = async (req, res) => {
    try {
        const username = req.query.name; 
        
        if (!username) {
            return res.status(400).json({ message: "User name is required" });
        }

        const user = await User.findOne({ name: username });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({
            message: "User match statistics",
            data: {
                name: user.name,
                matchesPlayed: user.matchesPlayed,
                matchesWon: user.matchesWon,
            },
        });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};


const quitGame = (req, res) => {
    res.json({ message: "Game Quit Successfully!" });
};


// dice role api
const rollDice = (req, res) => {
    try{
        const diceValue = Math.floor(Math.random() * 6) + 1;

        return res.status(200).json({status: true, diceValue: diceValue, message: `you rolled a ${diceValue}`});
    }
    catch(error){
        return res.status(500).json({status: true, message: "error rolling the dice", error: error.message});
    }
}

module.exports = { startGame, getSettings, getAboutInfo, quitGame, rollDice };
