const router = require("express").Router();
const SellerOrder = require("../model/SellerOrder");

// Add new seller order
router.post("/add", (req, res) => {
  const {
    name, item, productImage, category, quantity, price,
    district, company, mobile, land, email, address, expireDate
  } = req.body;

  const newOrder = new SellerOrder({
    name, item, productImage, category, quantity, price,
    district, company, mobile, land, email, address, expireDate,
    status: "Pending",
    deliverymanId: null
  });

  newOrder.save()
    .then(() => res.json("New Seller Order added successfully!"))
    .catch(err => {
      console.log(err);
      res.status(500).send({ status: "Error adding seller order" });
    });
});

// Get all seller orders
router.get("/", (req, res) => {
  SellerOrder.find()
    .then(orders => res.json(orders))
    .catch(err => res.status(500).send({ status: "Error fetching seller orders" }));
});

// Accept Delivery / Update order
router.put("/update/:id", async (req, res) => {
  const orderId = req.params.id;
  const { status, deliverymanId } = req.body;

  try {
    const updatedOrder = await SellerOrder.findByIdAndUpdate(
      orderId,
      { status, deliverymanId },
      { new: true }
    );
    res.status(200).json(updatedOrder);
  } catch (err) {
    console.error(err);
    res.status(500).send({ status: "Error updating seller order" });
  }
});

module.exports = router;
