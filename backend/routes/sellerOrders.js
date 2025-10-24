const router = require("express").Router();
const SellerOrder = require("../model/SellerOrder");
const Product = require("../model/Product");

// Get all seller orders
router.get("/", (req, res) => {
  SellerOrder.find()
    .then(orders => res.json(orders))
    .catch(err => res.status(500).send({ status: "Error fetching seller orders" }));
});

// Add new seller order
router.post("/add", (req, res) => {
  const {
    name, item, productImage, category, quantity, price,
    district, company, mobile, land, email, address, postedDate, expireDate
  } = req.body;
  
  const newOrder = new SellerOrder({
    name: name || "", // Optional field
    item, 
    productImage, 
    category, 
    quantity, 
    price,
    district, 
    company, 
    mobile, 
    land, 
    email, 
    address, 
    postedDate: postedDate || new Date().toISOString().split('T')[0],
    expireDate,
    status: "pending",
    deliverymanId: null
  });
  
  newOrder.save()
    .then((savedOrder) => {
      console.log("✅ Order created:", savedOrder);
      res.json({ 
        message: "New Seller Order added successfully!",
        order: savedOrder
      });
    })
    .catch(err => {
      console.error("❌ Error adding order:", err);
      res.status(500).send({ 
        status: "Error adding seller order",
        error: err.message 
      });
    });
});

// ✅ NEW ROUTE: Accept delivery by deliveryman (accepts undefined deliverymanId)
router.put("/:id/accept", async (req, res) => {
  try {
    const { deliverymanId } = req.body;
    
    console.log(`📦 Deliveryman accepting order ${req.params.id}`);
    console.log(`👤 Deliveryman ID:`, deliverymanId);
    
    // Accept undefined, null, 0, or any value - no validation
    const order = await SellerOrder.findByIdAndUpdate(
      req.params.id,
      { 
        acceptedByDeliveryman: true,
        deliveryStatus: 'approved',
        deliverymanId: deliverymanId  // Can be undefined/null/0/any value
      },
      { new: true }
    );
    
    if (!order) {
      console.log("❌ Order not found:", req.params.id);
      return res.status(404).json({ message: 'Order not found' });
    }
    
    console.log("✅ Order accepted by deliveryman:", order);
    res.json(order);
  } catch (err) {
    console.error("❌ Error accepting delivery:", err);
    res.status(500).json({ message: err.message });
  }
});

// ✅ NEW ROUTE: Update delivery status (delivered/not-delivered)
router.put("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    
    console.log(`📦 Updating delivery status for order ${req.params.id} to: ${status}`);
    
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }
    
    const order = await SellerOrder.findByIdAndUpdate(
      req.params.id,
      { deliveryStatus: status },
      { new: true }
    );
    
    if (!order) {
      console.log("❌ Order not found:", req.params.id);
      return res.status(404).json({ message: 'Order not found' });
    }
    
    console.log("✅ Delivery status updated:", order);
    res.json(order);
  } catch (err) {
    console.error("❌ Error updating delivery status:", err);
    res.status(500).json({ message: err.message });
  }
});

// ✅ UPDATE: Approve / Disapprove Seller Order & Reduce Product Quantity if approved
router.put("/update/:id", async (req, res) => {
  const orderId = req.params.id;
  const { status } = req.body; // "approved" or "disapproved"
  
  console.log(`📝 Update request for order ${orderId} with status: ${status}`);
  
  try {
    const order = await SellerOrder.findById(orderId);
    if (!order) {
      console.log("❌ Order not found:", orderId);
      return res.status(404).json({ status: "Order not found" });
    }
    
    console.log("✅ Order found:", order);
    
    // If approved, reduce product quantity
    if (status === "approved") {
      // Try to find product by productName field
      let product = await Product.findOne({ productName: order.item });
      
      // If not found, try by name field (fallback)
      if (!product) {
        product = await Product.findOne({ name: order.item });
      }
      
      console.log("🔍 Product lookup for:", order.item);
      
      if (!product) {
        console.log("❌ Product not found:", order.item);
        return res.status(404).json({ status: "Product not found" });
      }
      
      console.log("✅ Product found:", product);
      
      if (product.quantity < order.quantity) {
        console.log("❌ Insufficient quantity");
        return res.status(400).json({ status: "Not enough product quantity" });
      }
      
      product.quantity -= order.quantity;
      await product.save();
      console.log(`✅ Product quantity updated: ${product.productName || product.name} - ${order.quantity} kg`);
    }
    
    // Update only the status field
    const updatedOrder = await SellerOrder.findByIdAndUpdate(
      orderId,
      { status },
      { new: true, runValidators: false }
    );
    
    console.log("✅ Order status updated:", updatedOrder);
    
    res.status(200).json({ 
      message: `Order ${status}`,
      order: updatedOrder 
    });
  } catch (err) {
    console.error("❌ Error updating seller order:", err);
    res.status(500).send({ 
      status: "Error updating seller order",
      error: err.message 
    });
  }
});

// Delete order (optional)
router.delete("/:id", async (req, res) => {
  try {
    const deletedOrder = await SellerOrder.findByIdAndDelete(req.params.id);
    
    if (!deletedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({ 
      message: "Order deleted successfully",
      order: deletedOrder
    });
  } catch (err) {
    console.error("❌ Error deleting order:", err);
    res.status(500).json({ 
      message: "Error deleting order",
      error: err.message 
    });
  }
});

module.exports = router;
