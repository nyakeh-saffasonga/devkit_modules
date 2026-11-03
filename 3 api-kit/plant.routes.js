'use strict'

const express = require('express')
const plantController = require('../controller/plant.controller')
const { requireAuth } = require('../middleware/auth')

const router = express.Router()
router.get('/stats', plantController.plantStats)

router
    .route('/')
        .get(plantController.getAllPlants)
        .post(requireAuth, plantController.createPlant)
        // later on we will be adding additional functions like POST to this route
        // this router is stating that any GET request on the /api/v1/ path will execute the controller function we built
router
    .route('/:id')
        .get(plantController.getPlantById)
        .put(plantController.updatePlant)
        .patch(plantController.updatePlant) 
        .delete(plantController.removePlant) // this will later be authorized delete
router
    .route('/:id/water')
        .post(plantController.waterPlant)
        
        
// here there will be more routes each with their own combination of GET, PUT, PATCH, DELETE

module.exports = router