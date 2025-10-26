// far.js - Backend routes for filtering seller orders by farmer

const express = require('express');
const router = express.Router();
const SellerOrder = require('../model/SellerOrder'); // Adjust path to your model

// Get all seller orders for a specific farmer
router.get('/farmer/:farmerId', async (req, res) => {
  try {
    const { farmerId } = req.params;
    
    // Find all orders that belong to this farmer
    const orders = await SellerOrder.find({ farmerId: farmerId })
      .populate('deliverymanId') // Populate deliveryman details if referenced
      .sort({ createdAt: -1 }); // Newest orders first
    
    res.status(200).json(orders);
  } catch (error) {
    console.error('Error fetching farmer orders:', error);
    res.status(500).json({ message: 'Error fetching orders', error: error.message });
  }
});

// Get order statistics for a specific farmer
router.get('/farmer/:farmerId/stats', async (req, res) => {
  try {
    const { farmerId } = req.params;
    
    const totalOrders = await SellerOrder.countDocuments({ farmerId });
    const approvedOrders = await SellerOrder.countDocuments({ farmerId, status: 'approved' });
    const pendingOrders = await SellerOrder.countDocuments({ farmerId, status: 'pending' });
    const disapprovedOrders = await SellerOrder.countDocuments({ farmerId, status: 'disapproved' });
    
    res.status(200).json({
      total: totalOrders,
      approved: approvedOrders,
      pending: pendingOrders,
      disapproved: disapprovedOrders
    });
  } catch (error) {
    console.error('Error fetching order stats:', error);
    res.status(500).json({ message: 'Error fetching statistics', error: error.message });
  }
});

// Update order status (approve/disapprove)
router.put('/update/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    
    // Validate status
    if (!['approved', 'disapproved', 'pending'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }
    
    const updatedOrder = await SellerOrder.findByIdAndUpdate(
      orderId,
      { status: status },
      { new: true, runValidators: true }
    ).populate('deliverymanId');
    
    if (!updatedOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    res.status(200).json({ 
      message: 'Order updated successfully', 
      order: updatedOrder 
    });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ message: 'Error updating order', error: error.message });
  }
});

// Get all seller orders (for admin or general view)
router.get('/', async (req, res) => {
  try {
    const orders = await SellerOrder.find()
      .populate('deliverymanId')
      .sort({ createdAt: -1 });
    
    res.status(200).json(orders);
  } catch (error) {
    console.error('Error fetching all orders:', error);
    res.status(500).json({ message: 'Error fetching orders', error: error.message });
  }
});

module.exports = router;