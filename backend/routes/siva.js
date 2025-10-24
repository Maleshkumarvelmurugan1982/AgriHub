const express = require('express');
const router = express.Router();
const Siva = require('../model/Siva');

// Create or get guest siva
router.post('/create-guest', async (req, res) => {
  try {
    const siva = new Siva({
      isGuest: true,
      name: 'Guest Siva',
      createdAt: new Date()
    });
    
    await siva.save();
    
    res.status(201).json({
      success: true,
      sivaId: siva._id,
      message: 'Guest siva created successfully'
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
});

// Get siva by ID
router.get('/:id', async (req, res) => {
  try {
    const siva = await Siva.findById(req.params.id);
    
    if (!siva) {
      return res.status(404).json({ 
        success: false,
        message: 'Siva not found' 
      });
    }
    
    res.json({
      success: true,
      siva
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
});

// Get all sivas
router.get('/', async (req, res) => {
  try {
    const sivas = await Siva.find();
    res.json({
      success: true,
      sivas
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
});

module.exports = router;
