const express = require('express');
const CustomerLand = require('../../models/loans/customer-land');
const { authenticateUser }  = require('../../middleware/authentication');

const { v4: uuidv4 } = require('uuid');


const router = express.Router();

// Add a customer
router.post('/add-customer-land', authenticateUser , async (req, res) => {
  const { FirstName, LastName, phoneNumber } = req.body;

  try {
    // Check if customer already exists
    const existingCustomer = await CustomerLand.findOne({ phoneNumber });

    let message = 'Customer added successfully';

    if (existingCustomer) {
      message = 'Customer with this phone number already exists';
    }

    // Create a new customer
    const newCustomer = await CustomerLand.create({
      customerID: uuidv4(), 
      FirstName,
      LastName,
      phoneNumber,
      ByPhoneNumber: req.ByPhoneNumber,
      userId: req.userId,
    });
    res.status(201).json({ 
      message,
       customer: newCustomer,
       customerID: newCustomer.customerID || newCustomer._id,
       });
  } catch (error) {
    console.error('Error adding customer:', error);
    res.status(500).json({ message: 'Error adding customer', error: error.message });
  } 
});

// Get all customers
router.get('/customers-land', async (req, res) => {
  try {
    const customers = await CustomerLand.find();
    res.status(200).json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ message: 'Error fetching customers', error });
  }
});

// Get a single customer by phone number
router.get('/customer-land/:phoneNumber', async (req, res) => {
    const { phoneNumber } = req.params;
  
    try {
      const customer = await CustomerLand.findOne({ phoneNumber });
      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }
  
      res.status(200).json(customer);
    } catch (error) {
      console.error('Error fetching customer:', error);
      res.status(500).json({ message: 'Error fetching customer', error });
    }
  });
  
  module.exports = router;