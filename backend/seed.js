const mongoose = require('mongoose');
const Product = require('./models/product.model');
require('dotenv').config();

const sampleProducts = [
  {
    name: 'Logitech MX Master 3S Wireless Mouse',
    description: 'Ergonomic performance wireless mouse with ultra-quiet clicks, 8K DPI tracking on glass, and MagSpeed electromagnetic scrolling.',
    price: 8995,
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=800&q=80',
    stock: 18,
  },
  {
    name: 'Keychron K2 Mechanical Keyboard',
    description: '75% layout compact Bluetooth wireless mechanical keyboard with RGB backlighting, Gateron G Pro Brown switches, and Mac/Windows layout.',
    price: 7499,
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80',
    stock: 24,
  },
  {
    name: 'Sony WH-1000XM5 Noise Cancelling Headphones',
    description: 'Industry-leading noise canceling wireless headphones with Auto NC Optimizer, 30-hour battery life, and crystal-clear hands-free calling.',
    price: 26990,
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
    stock: 12,
  },
  {
    name: 'Classic Denim Trucker Jacket',
    description: 'Timeless premium denim jacket featuring a relaxed fit, chest flap pockets, and button-front closure for versatile everyday layering.',
    price: 3499,
    category: 'Fashion',
    image: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=800&q=80',
    stock: 35,
  },
  {
    name: 'Minimalist Leather Minimal Wallet',
    description: 'Slim bifold wallet handcrafted from full-grain genuine leather with RFID blocking protection and room for 8+ cards plus cash.',
    price: 1299,
    category: 'Fashion',
    image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=800&q=80',
    stock: 50,
  },
  {
    name: 'Atomic Habits by James Clear',
    description: 'The definitive guide to breaking bad behaviors and adopting good ones in four steps, showing how small changes can lead to remarkable results.',
    price: 499,
    category: 'Books',
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
    stock: 40,
  },
  {
    name: 'Smart Ceramic Coffee Mug with Temperature Control',
    description: 'App-controlled heated smart mug that keeps your coffee or tea at your precise preferred drinking temperature for up to 80 minutes.',
    price: 5999,
    category: 'Home',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
    stock: 15,
  },
  {
    name: 'Pro Series Non-Slip Yoga Mat',
    description: 'High-density eco-friendly TPE workout mat with laser-engraved alignment lines and superior non-slip cushioning for yoga and pilates.',
    price: 1899,
    category: 'Sports',
    image: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?auto=format&fit=crop&w=800&q=80',
    stock: 22,
  },
];

const seedProducts = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/shopkart';
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB. Seeding products...');
    
    // Check if products already exist
    const count = await Product.countDocuments();
    if (count > 0) {
      console.log(`Database already has ${count} products.`);
    } else {
      await Product.insertMany(sampleProducts);
      console.log(` Successfully inserted ${sampleProducts.length} sample products.`);
    }
  } catch (err) {
    console.error('Seeding error:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

seedProducts();
