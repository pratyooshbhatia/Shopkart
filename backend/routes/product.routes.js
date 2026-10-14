const express = require('express');
const router = express.Router();
const {
  createProduct,
  getAllProducts,
  getProductById,
} = require('../controllers/product.controller');

// POST /products — Create a new product
router.post('/', createProduct);

// GET /products — Get all products (supports ?search=, ?category=, ?sort=)
router.get('/', getAllProducts);

// GET /products/:id — Get a single product by ID
router.get('/:id', getProductById);

module.exports = router;
