// routes/games.js
const router = require('express').Router()
const passport = require('../config/auth')
const { Game } = require('../models')
const utils = require('../lib/utils')
var winner = require('../lib/winner')
var noWinner = false
var winnerSymbol = null

const authenticate = passport.authorize('jwt', { session: false })

module.exports = io => {
  router
    .get('/games', (req, res, next) => {
      Game.find()
        // Newest games first
        .sort({ createdAt: -1 })
        // Send the data in JSON format
        .then((games) => res.json(games))
        // Throw a 500 error if something goes wrong
        .catch((error) => next(error))
    })
    .get('/games/:id', (req, res, next) => {
      const id = req.params.id
      Game.findById(id)
        .then((game) => {
          if (!game) { return next() }
          res.json(game)
        })
        .catch((error) => next(error))
    })
    .post('/games', authenticate, (req, res, next) => {

      noWinner = false
      const newGame = {
        userId: req.account._id,
        players: [{
          userId: req.account._id,
          symbol: 'x',

        }],
        turn: null,
        board: [null, null,null,null, null,null,null, null,null],

      }

      Game.create(newGame)
        .then((game) => {

          io.emit('action', {
            type: 'GAME_CREATED',
            payload: game
          })
          res.json(game)
        })
        .catch((error) => next(error))
    })
    .put('/games/:id', authenticate, (req, res, next) => {
      const id = req.params.id
      const updatedGame = req.body

      Game.findByIdAndUpdate(id, { $set: updatedGame }, { new: true })
        .then((game) => {
          io.emit('action', {
            type: 'GAME_UPDATED',
            payload: game
          })
          res.json(game)
        })
        .catch((error) => next(error))
    })
    .patch('/games/play/:id', authenticate, (req, res, next) => {
      const id = req.params.id
      const myGame = req.body.game
      const position =req.body.index
      const currentPlayer = req.body.currentPlayer

      var myBoard = myGame.board
      winnerSymbol = winner.isWinner(myBoard)
      noWinner = winnerSymbol === null
      console.log("WINNER IS " + winnerSymbol)

      if (noWinner)
      {

        Game.findById(id)
          .then((game) => {
            if (!game) { return next() }
            myGame.players[0].symbol = 'x'
            myGame.players[1].symbol = 'o'

            if ((currentPlayer.userId !== myGame.turn) && (currentPlayer.userId === myGame.players[0].userId))
              myBoard[position] = myGame.players[0].symbol

            if ((currentPlayer.userId !== myGame.turn) && (currentPlayer.userId === myGame.players[1].userId))
                myBoard[position] = myGame.players[1].symbol


            myGame.turn = currentPlayer.userId

            winnerSymbol = winner.isWinner(myBoard)
            if (winnerSymbol !== null)
              winnerSymbol = currentPlayer.name

            const patchForGame = Object.assign({}, myGame,{
              board: myBoard,
              winner: winnerSymbol
            })

            const updatedGame = { ...game, ...patchForGame }

            Game.findByIdAndUpdate(id, { $set: updatedGame }, { new: true })
              .then((game) => {
                io.emit('action', {
                  type: 'GAME_UPDATED',
                  payload: game
                })
                res.json(game)
              })
              .catch((error) => next(error))
          })
          .catch((error) => next(error))
      }
    })

    .delete('/games/:id', authenticate, (req, res, next) => {
      const id = req.params.id
      Game.findByIdAndRemove(id)
        .then(() => {
          io.emit('action', {
            type: 'GAME_REMOVED',
            payload: id
          })
          res.status = 200
          res.json({
            message: 'Removed',
            _id: id
          })
        })
        .catch((error) => next(error))
    })

  return router
}
