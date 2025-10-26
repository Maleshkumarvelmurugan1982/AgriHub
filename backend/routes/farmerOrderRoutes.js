const router = require("express").Router();
const FarmerOrder = require("../model/FarmerOrder");

// Add new farmer order
router.post("/add", (req, res) => {
  const {
    name, item, productImage, category, quantity, price,
    district, company, mobile, land, email, address, expireDate
  } = req.body;

  const newOrder = new FarmerOrder({
    name, item, productImage, category, quantity, price,
    district, company, mobile, land, email, address, expireDate,
    status: "Pending",
    deliverymanId: null
  });

  newOrder.save()
    .then(() => res.json("New Farmer Order added successfully!"))
    .catch(err => {
      console.log(err);
      res.status(500).send({ status: "Error adding farmer order" });
    });
});

// Get all farmer orders
router.get("/", (req, res) => {
  FarmerOrder.find()
    .then(orders => res.json(orders))
    .catch(err => res.status(500).send({ status: "Error fetching farmer orders" }));
});

// Accept Delivery / Update order
router.put("/update/:id", async (req, res) => {
  const orderId = req.params.id;
  const { status, deliverymanId } = req.body;

  try {
    const updatedOrder = await FarmerOrder.findByIdAndUpdate(
      orderId,
      { status, deliverymanId },
      { new: true }
    );
    res.status(200).json(updatedOrder);
  } catch (err) {
    console.error(err);
    res.status(500).send({ status: "Error updating farmer order" });
  }
});

module.exports = router;
