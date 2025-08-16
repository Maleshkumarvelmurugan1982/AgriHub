const router = require("express").Router();
const DeliveryPost = require("../model/DeliveryPost");

// Route to add a new delivery post
// POST http://localhost:8070/deliverypost/add
router.route("/add").post((req, res) => {
  const {
    name,
    model,
    capacity,
    vehicleImage,
    price,
    district,
    company,
    mobile,
    land,
    email,
    address,
  } = req.body;

  const newDeliveryPost = new DeliveryPost({
    name,
    model,
    capacity,
    vehicleImage,
    price,
    district,
    company,
    mobile,
    land,
    email,
    address,
  });

  newDeliveryPost
    .save()
    .then(() => {
      res.json("New Deliverypost added successfully!");
    })
    .catch((error) => {
      console.log(error);
      res.status(500).json({ error: "Error adding new delivery post" });
    });
});

// Route to get all delivery posts
// GET http://localhost:8070/deliverypost/
router.route("/").get((req, res) => {
  DeliveryPost.find()
    .then((deliveryposts) => {
      res.json(deliveryposts);
    })
    .catch((error) => {
      console.log(error);
      res.status(500).json({ error: "Error fetching delivery posts" });
    });
});

// Route to update a delivery post by ID
// PUT http://localhost:8070/deliverypost/update/:id
router.route("/update/:id").put(async (req, res) => {
  let deliveryPostID = req.params.id;
  const {
    name,
    model,
    capacity,
    vehicleImage,
    price,
    district,
    company,
    mobile,
    land,
    email,
    address,
  } = req.body;

  const updateDeliveryPost = {
    name,
    model,
    capacity,
    vehicleImage,
    price,
    district,
    company,
    mobile,
    land,
    email,
    address,
  };

  await DeliveryPost.findByIdAndUpdate(deliveryPostID, updateDeliveryPost)
    .then(() => {
      res.status(200).send({ status: "Delivery post updated" });
    })
    .catch((error) => {
      console.log(error);
      res.status(500).send({ status: "Error updating delivery post" });
    });
});

// Route to delete a delivery post by ID
// DELETE http://localhost:8070/deliverypost/delete/:id
router.route("/delete/:id").delete(async (req, res) => {
  let deliveryPostID = req.params.id;

  await DeliveryPost.findByIdAndDelete(deliveryPostID)
    .then(() => {
      res.status(200).send({ status: "Delivery post deleted" });
    })
    .catch((error) => {
      console.log(error);
      res.status(500).send({ status: "Error deleting delivery post" });
    });
});

// Route to get a delivery post by ID
// GET http://localhost:8070/deliverypost/get/:id
router.route("/get/:id").get(async (req, res) => {
  let deliveryPostID = req.params.id;
  await DeliveryPost.findById(deliveryPostID)
    .then((deliverypost) => {
      res.status(200).send({ status: "Delivery post fetched", deliverypost });
    })
    .catch((error) => {
      console.log(error);
      res.status(500).send({ status: "Error fetching delivery post" });
    });
});

module.exports = router;
