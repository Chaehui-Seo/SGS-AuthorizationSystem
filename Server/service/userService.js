const jwt = require('jsonwebtoken')

const db = require('../db/db')

const bcrypt = require('bcryptjs')

const nodemailer = require('nodemailer')
const { emailId, emailPw, secret } = require('../config/config')

var generateRandom = function (min, max) {
	var ranNum = Math.floor(Math.random()*(max-min+1)) + min
	return ranNum
}


let loadUsers = async function(req, res) {
	let sql = 'SELECT * FROM Users'
	db.query(sql, (err, result) => {
		if (err) {
			res.status(400).send(err)
		}
		console.log(result)
		return res.status(201).send(result)
	})
}


let withdrawl = async function(req, res) {
	const userId = req.body.userId
	const isAdmin = req.body.isAdmin
	const password = req.body.password
	var hash = bcrypt.hashSync(password, 8)
    const bcryptPassword = bcrypt.compareSync(password, hash)

	if (isAdmin == 0 ){
		const auth = req.get('Authorization')
		if (auth == null) {
			res.status(404).json({ success: false, message: "Invalid token" })
		} else {
		    const userToken = auth.split(' ')[1]
		    jwt.verify(userToken, secret, (err, encode) => {
		    	if(err) { return res.status(404).json({ success: false, message: "Invalid token" }) }
				else {
					const tokenUserId = encode["userId"]
					if (tokenUserId == userId) {
						var sql = 'SELECT * from Users WHERE (Users.userId = ?) LIMIT 1'
						let query = db.query(sql, [userId], (err, userResult) => {
							if (err) { return res.status(400).json({ success: false, message: err }) }
							if (userResult.length) {
								bcrypt.compare(password, userResult[0].password, function(error, response) {
						            if (response) {
										var sql = 'DELETE FROM Users WHERE Users.userId = ?'
										let query = db.query(sql, [userId], (err, result) => {
											if (err) { return res.status(400).send({ success: false, message: err })}
											res.status(201).send({ success: true, message: "Successfully withdrawal" })
										})
						            } else {
						                res.status(401).json({ success: false, message: "incorrect password" })
						            }
						        })
							} else {
								res.status(400).json({ success: false, message: "No user found" })
							}
						})
					} else {
						res.status(404).json({ success: false, message: "Invalid token" })
					}
				}
			})
		}
	} else {
		var sql = 'DELETE FROM Users WHERE Users.userId = ?'
		let query = db.query(sql, [userId], (err, result) => {
			if (err) {res.status(400).send({ success: false, message: err })}
			res.status(201).send({ success: true, message: "Successfully withdrawal" })
		})
	}
}

let setFcmToken = async function(req, res) {
	const userId = req.body.userId
	const fcmToken = req.body.fcmToken

    const auth = req.get('Authorization')
    if (auth == null) {
		res.status(404).json({ success: false, message: "Invalid token" })
	} else {
	    const userToken = auth.split(' ')[1]

	    jwt.verify(userToken, secret, (err, encode) => {
	    	if(err) { res.status(404).json({ success: false, message: "Invalid token" }) }
			else {
				console.log(encode["userId"])
				const tokenUserId = encode["userId"]
				if (tokenUserId == userId) {
					var sql = 'UPDATE Users SET fcmToken=? WHERE userId=?'
					let query = db.query(sql, [fcmToken, userId], (err, result) => {
						if (err) {res.status(400).json({ success: false, message: err })}
						console.log(result)
						res.status(201).json({ success: true, message: "Successfully Email Verified" })
					})
				} else {
					res.status(404).json({ success: false, message: "Invalid token" })
				}
			}
		})
	}
}

let logIn = async function(req, res) {
	const userId = req.body.userId
	const password = req.body.password
	var hash = bcrypt.hashSync(password, 8)
    const bcryptPassword = bcrypt.compareSync(password, hash)
	var sql = 'SELECT * from Users WHERE (Users.userId = ?) LIMIT 1'
	let query = db.query(sql, [userId], (err, userResult) => {
		if (err) { res.status(400).json({ success: false, message: err }) }
		if (userResult.length) {
			bcrypt.compare(password, userResult[0].password, function(error, response) {
	            if (response) {
	            	const accessToken = jwt.sign({
						userId : userId
					},
					secret,
					{
						expiresIn : '2h'
					})

					const refreshToken = jwt.sign({
						userId : userId
					},
					secret,
					{
						expiresIn : '14d'
					})

					// ?????? ?????? ??????
					sql = 'UPDATE Users SET refreshToken=? WHERE userId=?'
					let query = db.query(sql, [refreshToken, userId], (err, result) => {
						if (err) { res.status(400).json({ success: false, message: err }) }
						// res.json({success: true, token: accessToken, user: result})
						let sql = 'SELECT * FROM Users WHERE Users.userId = ?'
						db.query(sql, [userId], (err, result) => {
							if (err) {
								res.status(400).send(err)
							}
							res.status(201).header('Token', accessToken).json(result)
						})
					})
	            }
	            else {
	            	console.log(401)
	                res.status(401).json({ success: false, message: "Incorrect password" })
	            }
	        })
		} else {
			console.log(402)
			res.status(402).json({ success: false, message: "No user found" })
		}
	})
}

let autoLogIn = async function(req, res) {
	const userId = req.body.userId
	var sql = 'SELECT * from Users WHERE (Users.userId = ?) LIMIT 1'
	let query = db.query(sql, [userId], (err, userResult) => {
		if (err) { res.status(400).json({ success: false, message: err }) }
		if (userResult.length) {
			const refreshToken = req.get('Authorization')
			if (refreshToken == null) {
				res.status(404).json({ success: false, message: "Invalid token" })
			} else {
				const userToken = refreshToken.split(' ')[1]
			    jwt.verify(userToken, secret, (err, encode) => {
			    	if(err) { res.status(404).json({ success: false, message: "Invalid token" }) }
					const tokenUserId = encode["userId"]
					console.log(tokenUserId)
					if (tokenUserId == userId) {
						const dbToken = "Bearer " + userResult[0].refreshToken
						if (dbToken == refreshToken) {
							const accessToken = jwt.sign({
								userId : userId
							},
							secret,
							{
								expiresIn : '2h'
							})

							const refreshToken = jwt.sign({
								userId : userId
							},
							secret,
							{
								expiresIn : '14d'
							})

							// ?????? ?????? ??????
							sql = 'UPDATE Users SET refreshToken=? WHERE userId=?'
							let query = db.query(sql, [refreshToken, userId], (err, result) => {
								if (err) { res.status(400).json({ success: false, message: err }) }
								// res.json({success: true, token: accessToken, user: result})
								let sql = 'SELECT * FROM Users WHERE Users.userId = ?'
								db.query(sql, [userId], (err, result) => {
									if (err) {
										res.status(400).send(err)
									}
									res.status(201).header('Token', accessToken).json(result)
								})
							})
						} else {
							res.status(404).json({ success: false, message: "Invalid token" })
						}
					}
				})
			}
		} else {
			res.status(402).json({ success: false, message: "No user found" })
		}
	})
}

let register = async function(req, res) {
	const userId = req.body.userId
	const nickName = req.body.nickName
	const password = req.body.password
	const modifiedPw = await bcrypt.hash(password, 8)

	// ???????????? ????????? ???????????? ?????? ?????? ?????????/???????????? ????????? ??? ????????? ?????? ?????? ??? ??? ???
	var sql = 'SELECT * FROM Users WHERE (Users.userId = ?) OR (Users.nickName = ?)'
	let query = db.query(sql, [userId, nickName], (err, result) => {
		if (err) { res.status(400).send({err}) }
		if (result.length == 0) {
			// ?????? ???????????? ????????? ???????????? ?????? ??????

			// ????????? ????????? ???????????? ????????? ?????? ????????? ?????? ????????? jwt ??????
			const accessToken = jwt.sign({
				userId : userId
			},
			secret,
			{
				expiresIn : '2h'
			})

			const refreshToken = jwt.sign({
				userId : userId
			},
			secret,
			{
				expiresIn : '14d'
			})

			// ?????? ?????? ??????
			sql = 'INSERT INTO Users (userId, nickName, password, refreshToken) VALUES (?, ?, ?, ?)'
			let query = db.query(sql, [userId, nickName, modifiedPw, refreshToken], (err, result) => {
				if (err) { res.status(400).json({ success: false, message: err }) }
				let sql = 'SELECT * FROM Users WHERE Users.userId = ?'
				db.query(sql, [userId], (err, userResult) => {
					if (err) {
						res.status(400).send(err)
					}
					res.status(201).header('Token', accessToken).json(userResult)
				})
			})
		} else {
			res.status(400).json({ success: false, message: "Unavailable userId or nickName" })
		}
	})
}

let changeUserBlock = async function(req, res) {
	const userId = req.body.userId
	const isBlocked = req.body.isBlocked

	const isAdmin = req.body.isAdmin

	if (isAdmin == 0) {
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
						var sql = 'SELECT * FROM Users WHERE (Users.userId = ?)'
						let query = db.query(sql, [userId], (err, result) => {
							if (err) {res.status(400).json({ success: false, message: err })}
							console.log(result)
							if (result.length) {
								// ?????? ?????? ?????? userId
								var sql = 'UPDATE Users SET isBlocked=? WHERE userId=?'
								let query = db.query(sql, [isBlocked, userId], (err, result) => {
									if (err) {res.status(400).json({ success: false, message: err })}
									let sql = 'SELECT * FROM Users'
									db.query(sql, (err, result) => {
										if (err) {
											res.status(400).send(err)
										}
										console.log(result)
										return res.status(201).send(result)
									})
								})
							} else {
								// ????????? ?????? userId
								res.status(400).json({ success: false, message: "Unavailable userId" })
							}
						})
					} else {
						res.status(404).json({ success: false, message: "Invalid token" })
					}
				}
			})
		}
	} else {
		var sql = 'SELECT * FROM Users WHERE (Users.userId = ?)'
		let query = db.query(sql, [userId], (err, result) => {
			if (err) {res.status(400).json({ success: false, message: err })}
			console.log(result)
			if (result.length) {
				// ?????? ?????? ?????? userId
				var sql = 'UPDATE Users SET isBlocked=? WHERE userId=?'
				let query = db.query(sql, [isBlocked, userId], (err, result) => {
					if (err) {res.status(400).json({ success: false, message: err })}
					console.log(result)
					let sql = 'SELECT * FROM Users'
					db.query(sql, (err, result) => {
						if (err) {
							res.status(400).send(err)
						}
						console.log(result)
						return res.status(201).send(result)
					})
					// return res.status(201).json({ success: true, message: "Successfully isBlocked Changed" })
				})
			} else {
				// ????????? ?????? userId
				res.status(400).json({ success: false, message: "Unavailable userId" })
			}
		})
	}
}

let changeEmailVerification = async function(req, res) {
	const userId = req.body.userId
	const isEmailVerified = req.body.isEmailVerified

	const isAdmin = req.body.isAdmin

	if (isAdmin == 0) {
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
						var sql = 'SELECT * FROM Users WHERE (Users.userId = ?)'
						let query = db.query(sql, [userId], (err, result) => {
							if (err) {res.status(400).json({ success: false, message: err })}
							console.log(result)
							if (result.length) {
								// ?????? ?????? ?????? userId
								var sql = 'UPDATE Users SET isEmailVerified=? WHERE userId=?'
								let query = db.query(sql, [isEmailVerified, userId], (err, result) => {
									if (err) {res.status(400).json({ success: false, message: err })}
									console.log(result)
									return res.status(201).json({ success: true, message: "Successfully isEmailVerified Changed" })
								})
							} else {
								// ????????? ?????? userId
								res.status(400).json({ success: false, message: "Unavailable userId" })
							}
						})
					} else {
						res.status(404).json({ success: false, message: "Invalid token" })
					}
				}
			})
		}
	} else {
		var sql = 'SELECT * FROM Users WHERE (Users.userId = ?)'
		let query = db.query(sql, [userId], (err, result) => {
			if (err) {res.status(400).json({ success: false, message: err })}
			console.log(result)
			if (result.length) {
				// ?????? ?????? ?????? userId
				var sql = 'UPDATE Users SET isEmailVerified=? WHERE userId=?'
				let query = db.query(sql, [isEmailVerified, userId], (err, result) => {
					if (err) {res.status(400).json({ success: false, message: err })}
					console.log(result)
					return res.status(201).json({ success: true, message: "Successfully isEmailVerified Changed" })
				})
			} else {
				// ????????? ?????? userId
				res.status(400).json({ success: false, message: "Unavailable userId" })
			}
		})
	}
}

let refreshAccessToken = async function (req, res) {
	const userId = req.body.userId
	const auth = req.get('Authorization')
	if (auth == null) {
		res.status(404).json({ success: false, message: "Invalid token" })
	} else {
	    const userToken = auth.split(' ')[1]

	    jwt.verify(userToken, secret, (err, encode) => {
	    	if(err) { res.status(404).json({ success: false, message: "Invalid token" }) }
			const tokenUserId = encode["userId"]
			if (tokenUserId == userId) {
				const accessToken = jwt.sign({
					userId : userId
				},
				secret,
				{
					expiresIn : '2h'
				})
				const refreshToken = jwt.sign({
					userId : userId
				},
				secret,
				{
					expiresIn : '14d'
				})
				
				// ?????? ?????? ??????
				sql = 'UPDATE Users SET refreshToken=? WHERE userId=?'
				let query = db.query(sql, [refreshToken, userId], (err, result) => {
					if (err) { res.status(400).json({ success: false, message: err }) }
					let sql = 'SELECT * FROM Users WHERE Users.userId = ?'
					db.query(sql, [userId], (err, result) => {
						if (err) {
							res.status(400).send(err)
						}
						res.status(201).header('Token', accessToken).json(result)
					})
				})
				
			} else {
				res.status(404).json({ success: false, message: "Invalid token" })
			}
		})
	}
}

let changeNickname = async function(req, res) {
	const userId = req.body.userId
	const nickName = req.body.nickName

	const isAdmin = req.body.isAdmin

	if (isAdmin == 0) {
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
						var sql = 'SELECT * FROM Users WHERE (Users.userId = ?)'
						let query = db.query(sql, [userId], (err, result) => {
							if (err) {res.status(400).json({ success: false, message: err })}
							if (result.length) {
								var sql = 'SELECT * FROM Users WHERE (Users.nickName = ?)'
								let query = db.query(sql, [nickName], (err, result) => {
									if (err) {res.status(400).json({ success: false, message: err })}
									console.log(result)
									if (result.length) {
										// ?????? ?????? ?????? userId
										res.status(400).json({ success: false, message: "Unavailable nickName" })
									} else {
										// ????????? userId
										var sql = 'UPDATE Users SET nickName=? WHERE userId=?'
										let query = db.query(sql, [nickName, userId], (err, result) => {
											if (err) {res.status(400).json({ success: false, message: err })}
											console.log(result)
											let sql = 'SELECT * FROM Users WHERE Users.userId = ?'
											db.query(sql, [userId], (err, result) => {
												if (err) {
													res.status(400).send(err)
												}
												res.status(201).json(result)
											})
										})
									}
								})
								
							} else {
								// ????????? ?????? userId
								res.status(400).json({ success: false, message: "Unavailable userId" })
							}
						})
					} else {
						res.status(404).json({ success: false, message: "Invalid token" })
					}
				}
			})
		}
	} else {
		var sql = 'SELECT * FROM Users WHERE (Users.userId = ?)'
		let query = db.query(sql, [userId], (err, result) => {
			if (err) {res.status(400).json({ success: false, message: err })}
			if (result.length) {
				var sql = 'SELECT * FROM Users WHERE (Users.nickName = ?)'
				let query = db.query(sql, [nickName], (err, result) => {
					if (err) {res.status(400).json({ success: false, message: err })}
					console.log(result)
					if (result.length) {
						// ?????? ?????? ?????? userId
						res.status(400).json({ success: false, message: "Unavailable nickName" })
					} else {
						// ????????? userId
						var sql = 'UPDATE Users SET nickName=? WHERE userId=?'
						let query = db.query(sql, [nickName, userId], (err, result) => {
							if (err) {res.status(400).json({ success: false, message: err })}
							console.log(result)
							let sql = 'SELECT * FROM Users WHERE Users.userId = ?'
							db.query(sql, [userId], (err, result) => {
								if (err) {
									res.status(400).send(err)
								}
								res.status(201).json(result)
							})
						})
					}
				})
				
			} else {
				// ????????? ?????? userId
				res.status(400).json({ success: false, message: "Unavailable userId" })
			}
		})
	}
}

let changePassword = async function(req, res) {
	const userId = req.body.userId
	const newPw = req.body.newPw
	const modifiedPw = await bcrypt.hash(newPw, 8)
	const isAdmin = req.body.isAdmin

	if (isAdmin == 0) {
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
						var sql = 'SELECT * FROM Users WHERE (Users.userId = ?)'
						let query = db.query(sql, [userId], (err, result) => {
							if (err) {res.status(400).json({ success: false, message: err })}
							console.log(result)
							if (result.length) {
								// ?????? ?????? ?????? userId
								var sql = 'UPDATE Users SET password=? WHERE userId=?'
								let query = db.query(sql, [modifiedPw, userId], (err, result) => {
									if (err) {res.status(400).json({ success: false, message: err })}
									console.log(result)
									let sql = 'SELECT * FROM Users WHERE Users.userId = ?'
									db.query(sql, [userId], (err, result) => {
										if (err) {
											res.status(400).send(err)
										}
										res.status(201).json(result)
									})
								})
							} else {
								// ????????? ?????? userId
								res.status(400).json({ success: false, message: "Unavailable userId" })
							}
						})
					} else {
						res.status(404).json({ success: false, message: "Invalid token" })
					}
				}
			})
		}
	} else {
		var sql = 'SELECT * FROM Users WHERE (Users.userId = ?)'
		let query = db.query(sql, [userId], (err, result) => {
			if (err) {res.status(400).json({ success: false, message: err })}
			console.log(result)
			if (result.length) {
				// ?????? ?????? ?????? userId
				var sql = 'UPDATE Users SET password=? WHERE userId=?'
				let query = db.query(sql, [modifiedPw, userId], (err, result) => {
					if (err) {res.status(400).json({ success: false, message: err })}
					console.log(result)
					let sql = 'SELECT * FROM Users WHERE Users.userId = ?'
					db.query(sql, [userId], (err, result) => {
						if (err) {
							res.status(400).send(err)
						}
						res.status(201).json(result)
					})
				})
			} else {
				// ????????? ?????? userId
				res.status(400).json({ success: false, message: "Unavailable userId" })
			}
		})
	}
}

let sendEmailVerificationForPw = async function(req, res) {
	const userId = req.body.userId

	var sql = 'SELECT * FROM Users WHERE (Users.userId = ?)'
	let query = db.query(sql, [userId], (err, result) => {
		if (err) {res.status(400).json({ success: false, message: err })}
		console.log(result)
		if (result.length) {
			// ?????? ?????? ?????? userId
			const number = generateRandom(111111,999999)
			const content = `??????????????? ${ number } ?????????`

			let transporter = nodemailer.createTransport({
		        host: "smtp.gmail.com",
		        secure: true,
		        auth: {
		            user: emailId,
		            pass: emailPw
		        }
		    })
		    
		    let mailOptions = {
		        from: emailId,
		        to: userId,
		        subject: "???????????? ??????",
		        text: content
		    }

		    //?????? ??????!
		    transporter.sendMail(mailOptions, function(error, info){
		        if (error) {
		            //??????
		            console.log(error)
		            res.status(400).json({ success: false, message: error })
		        }
		        //?????? ??????
		        console.log("Finish sending email : " + info.response)
		        res.status(201).json({ success: true, message: number })       
		        transporter.close()
		    })
		} else {
			// ????????? ?????? userId
			res.status(402).json({ success: false, message: "Unavailable userId" })
		}
	})
}

let emailVerified = async function(req, res) {
	const userId = req.body.userId

	var sql = 'UPDATE Users SET isEmailVerified=1 WHERE userId=?'
	let query = db.query(sql, [userId], (err, result) => {
		if (err) {res.status(400).json({ success: false, message: err })}
		console.log(result)
		return res.status(201).json({ success: true, message: "Successfully Email Verified" })
	})
}

let nickNameValidation = async function(req, res) {
	const nickName = req.body.nickName
	var sql = 'SELECT * FROM Users WHERE (Users.nickName = ?)'
	let query = db.query(sql, [nickName], (err, result) => {
		if (err) {res.status(400).json({ success: false, message: err })}
		console.log(result)
		if (result.length) {
			// ?????? ?????? ?????? userId
			res.status(400).json({ success: false, message: "Unavailable nickName" })
		} else {
			// ????????? userId
			res.status(201).json({ success: true, message: "Available nickName" })
		}
	})
}

let userIdValidation = async function(req, res) {
	const userId = req.body.userId

	var sql = 'SELECT * FROM Users WHERE (Users.userId = ?)'
	let query = db.query(sql, [userId], (err, result) => {
		if (err) {res.status(400).json({ success: false, message: err })}
		console.log(result)
		if (result.length) {
			// ?????? ?????? ?????? userId
			res.status(400).json({ success: false, message: "Unavailable userId" })
		} else {
			// ????????? userId
			res.status(201).json({ success: true, message: "Available userId" })
		}
	})
}

let sendEmailverificationForRegister = async function(req, res) {
	const userId = req.body.userId

	var sql = 'SELECT * FROM Users WHERE (Users.userId = ?)'
	let query = db.query(sql, [userId], (err, result) => {
		if (err) {res.status(400).json({ success: false, message: err })}
		console.log(result)
		if (result.length) {
			// ?????? ?????? ?????? userId
			res.status(400).json({ success: false, message: "Unavailable userId" })
		} else {
			// ????????? userId
			// res.status(201).json({ success: true, message: "Available userId" })
			const number = generateRandom(111111,999999)
			const content = `??????????????? ${ number } ?????????`

			let transporter = nodemailer.createTransport({
		        host: "smtp.gmail.com",
		        secure: true,
		        auth: {
		            user: emailId,
		            pass: emailPw
		        }
		    })
		    
		    let mailOptions = {
		        from: emailId,
		        to: userId,
		        subject: "???????????? ??????",
		        text: content
		    }

		    //?????? ??????!
		    transporter.sendMail(mailOptions, function(error, info){
		        if (error) {
		            //??????
		            console.log(error)
		            res.status(400).json({ success: false, message: error })
		        }
		        //?????? ??????
		        console.log("Finish sending email : " + info.response)
		        res.status(201).json({ success: true, message: number })       
		        transporter.close()
		    })
		}
	})
}


module.exports = {
  loadUsers: loadUsers,
  withdrawl: withdrawl,
  setFcmToken: setFcmToken,
  logIn: logIn,
  register:register,
  changeUserBlock: changeUserBlock,
  changeEmailVerification: changeEmailVerification,
  changeNickname: changeNickname,
  changePassword: changePassword,
  sendEmailVerificationForPw: sendEmailVerificationForPw,
  emailVerified: emailVerified,
  nickNameValidation: nickNameValidation,
  userIdValidation: userIdValidation,
  sendEmailverificationForRegister: sendEmailverificationForRegister,
  refreshAccessToken: refreshAccessToken,
  autoLogIn: autoLogIn
}