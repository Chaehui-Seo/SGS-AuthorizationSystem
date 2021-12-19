const jwt = require('jsonwebtoken')

const db = require('../db/db')

const { secret } = require('../config/config')


let createMessage = async function(req, res) {
	const fromUser = req.body.fromUser
	const toUser = req.body.toUser
	const content = req.body.content
	var sql = 'INSERT INTO BlockMessages (fromUser, toUser, content) VALUES (?, ?, ?)'
	let query = db.query(sql, [fromUser, toUser, content], (err, result) => {
		if (err) {res.status(400).send({err})}
		console.log(result)
		res.status(201).json({ success: true, message: "Successfully message sent" })
	})
}

let sendResponse = async function(req, res) {
	const id = req.body.id
	const userId = req.body.userId
	const response = req.body.response
	const auth = req.get('Authorization')
	if (auth == null) {
		res.status(404).json({ success: false, message: "Invalid token" })
	} else {
	    const userToken = auth.split(' ')[1]
	    jwt.verify(userToken, secret, (err, encode) => {
	    	if(err) { res.status(404).json({ success: false, message: "Invalid token" }) }
			else {
				const tokenUserId = encode["userId"]
				if (tokenUserId == userId) {
					var sql = 'UPDATE BlockMessages SET response=? WHERE id=?'
					let query = db.query(sql, [response, id], (err, result) => {
						if (err) {res.status(400).send({err})}
						console.log(result)
						res.status(201).json({ success: true, message: "Successfully edited" })
					})
				} else {
					res.status(404).json({ success: false, message: "Invalid token" })
				}
			}
		})
	}
}

let loadMessages = async function(req, res) {
	var userId = req.query.userId
	const auth = req.get('Authorization')

	if (auth == null) {
		res.status(404).json({ success: false, message: "Invalid token" })
	} else {
	    const userToken = auth.split(' ')[1]
	    jwt.verify(userToken, secret, (err, encode) => {
	    	if(err) { res.status(404).json({ success: false, message: "Invalid token" }) }
			else {
				const tokenUserId = encode["userId"]
				if (tokenUserId == userId) {
					let sql = 'SELECT * FROM BlockMessages WHERE BlockMessages.toUser = ?'
					db.query(sql, [userId], (err, result) => {
						if (err) {
							res.status(400).send(err)
						}
						console.log(result)
						res.status(201).send(result)
					})
				} else {
					res.status(404).json({ success: false, message: "Invalid token" })
				}
			}
		})
	}
}

let deleteMessages = async function(req, res) {
	const toUser = req.body.toUser

	var sql = 'DELETE FROM BlockMessages WHERE BlockMessages.toUser = ?'
	let query = db.query(sql, [toUser], (err, result) => {
		if (err) {res.status(400).send({err})}
		console.log(result)
		res.status(201).json({ success: true, message: "Successfully deleted" })
	})
}

module.exports = {
	createMessage: createMessage,
	sendResponse: sendResponse,
	loadMessages: loadMessages,
	deleteMessages: deleteMessages
}