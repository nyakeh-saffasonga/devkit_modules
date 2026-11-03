/** STAGE 2: ACCOUNT ROLES */

const ROLES = Object.freeze({USER: 'user', ADMIN: 'admin'})
const ROLES_VALUES = Object.freeze(Object.values(ROLES))

/**
 *  STAGE 2: AUTHENTICATION
 */

const AUTH = Object.freeze({
    SALT_ROUNDS: 10,
    // when using encryption, the term salting refers to how complex the encryption will be, but it also plays a role
    // in how long it will take for the authorization to complete, meaning that maving too many salt rounds
    // is not the best for application performance
    DEFAULT_JWT_EXPIRES_IN: '7d',
    BEARER_PREFIX: 'Bearer'
})

const DEFAULT_SORT = Object.freeze({createdAt: -1})

module.exports = {ROLES, ROLES_VALUES, AUTH, DEFAULT_SORT}