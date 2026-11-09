const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')


async function hashPassword(password, saltRounds, jwtSecretHash) {
    isHashedAlready = password.startsWith('$2'); // $2 is the start of bcrypt hashes
    if (!isHashedAlready) {
        newPassword = await bcrypt.hash(password, saltRounds)
        return newPassword
    }
    return password
}

function comparePassword(candidatePassword, hashedPassword) {
    return bcrypt.compare(candidatePassword, hashedPassword)
}


function signToken(user, jwtSecretHash, jwtExpiresIn) {
    console.log("sign---"+user.id)
    const payload = {sub: String(user.id), role: user.role}
    return jwt.sign(payload, jwtSecretHash, {expiresIn: jwtExpiresIn})
}

function verifyToken(token, jwtSecretHash) {
    try {
        return jwt.verify(token, jwtSecretHash)
    } catch (err) {
        throw ApiError.unauthorized()
    }
}

function extractToken(token) {
    if(token.startsWith("Bearer ")) {
        return token.slice(7)
    }
    return "This is already extracted!"
}

module.exports = {signToken, verifyToken, extractToken, hashPassword, comparePassword}
