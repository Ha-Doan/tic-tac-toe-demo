// models/game.js
const mongoose = require('../config/database')
const { Schema } = mongoose


const playerSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'users' },
  symbol: {type: String, default: 'o'},
});

const gameSchema = new Schema({
  players: [playerSchema],
  board: [String],
  turn: { type: Schema.Types.ObjectId, ref: 'users' },
  started: { type: Boolean, default: false },
  userId: { type: Schema.Types.ObjectId, ref: 'users' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  winner: { type: String, default: null },
}, { usePushEach: true }); // solved the problem of different version of MongoDB

module.exports = mongoose.model('games', gameSchema)
