const express = require('express');
const Loan = require('../../models/loans/loanSchema');
const router = express.Router();
const { authenticateUser }  = require('../../middleware/authentication');

router.put('/loans/:customerID/topup', async (req, res) => {
    try {
      const { customerID } = req.params;
      const { amount, date, method, topupinterestrate } = req.body;
  
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: 'Amount must be greater than zero' });
      }
  
      const loan = await Loan.findOne({ customerID }).populate('customerID');
      if (!loan) return res.status(404).json({ message: 'Loan not found' });
  
      // Store top-up details
      const currentDate = new Date(); // Fix: Use current date properly
      loan.loanDetails.topUpHistory.push({ amount, date, method, topupinterestrate });
  
    //   // Step 1: Calculate interest for the previous amount
    //   const prevAmount = loan.loanDetails.amount;
    //   const interestRate = loan.loanDetails.interestRate / 100;
    //   const startDate = new Date(loan.loanDetails.startDate);
  
    //   // Fix: Convert months properly using Math.floor
    //   const monthsElapsed = Math.floor((currentDate - startDate) / (1000 * 60 * 60 * 24 * 30));
    //   const prevInterest = prevAmount * interestRate * monthsElapsed;
  
    //   // Step 2: No interest calculation for new top-up since it just started
    //   loan.loanDetails.accruedInterest += prevInterest;
    //   loan.loanDetails.amount += amount; // Update main amount
    //   loan.loanDetails.totalAmount = loan.loanDetails.amount + loan.loanDetails.accruedInterest;
  
      await loan.save();
  
      res.json({ message: 'Top-up successful', loan });
    } catch (error) {
      res.status(500).json({ message: 'Error processing top-up', error: error.message });
    }
  });
   
  function calculateTopDownImpact(amount, interestRate, startDate, topUpHistory, topDownHistory) {
    const today = new Date();
    const dailyRate = interestRate / 100 / 30; 
    let accruedInterest = 0;
    let remainingPrincipal = amount;
  
    if (topUpHistory && Array.isArray(topUpHistory)) {
      topUpHistory.forEach(topUp => {
        const daysElapsed = Math.floor((today - new Date(topUp.date)) / (1000 * 60 * 60 * 24));
        if (daysElapsed > 0) {
          accruedInterest += topUp.amount * dailyRate * daysElapsed;
          remainingPrincipal += topUp.amount;
        }
      });
    }
  
    if (topDownHistory && Array.isArray(topDownHistory)) {
      topDownHistory.forEach(topDown => {
        remainingPrincipal -= topDown.amount; // Reduce the principal
        if (remainingPrincipal < 0) remainingPrincipal = 0; // Avoid negative loan
      });
    }
  
    const initialDays = Math.floor((today - new Date(startDate)) / (1000 * 60 * 60 * 24));
    accruedInterest += remainingPrincipal * dailyRate * initialDays;
  
    return { accruedInterest, remainingPrincipal };
  }
  


  router.put('/top-down/:customerID', async (req, res) => {
    try {
      const { amount, date, method } = req.body;
      const loan = await Loan.findOne({ customerID: req.params.customerID });
  
      if (!loan) {
        return res.status(404).json({ message: 'Loan not found' });
      }
  
      loan.loanDetails.topDownHistory.push({ amount, date, method });
  
      // Recalculate the loan balance and interest
      const { accruedInterest, remainingPrincipal } = calculateTopDownImpact(
        loan.loanDetails.amount,
        loan.loanDetails.interestRate,
        loan.loanDetails.startDate,
        loan.loanDetails.topUpHistory,
        loan.loanDetails.topDownHistory
      );
  
      loan.loanDetails.accruedInterest = accruedInterest;
      loan.loanDetails.remainingPrincipal = remainingPrincipal;
      loan.updatedAt = new Date();
  
      await loan.save();
  
      res.json({ message: 'Loan repayment added successfully', loan });
    } catch (error) {
      console.error('Error updating loan repayment:', error);
      res.status(500).json({ message: 'Error updating loan repayment', error });
    }
  });


  router.get('/top-t/:customerID', authenticateUser, async (req, res) => {
    const { customerID } = req.params;
  
    try {
      const loan = await Loan.findOne({ 
        
        customerID: customerID, 
        addedBy: req.userId 
      
      }); // Use populate if ref is added
      if (!loan) {
        return res.status(403).json({ error: 'Unauthorized: You do not have access to this loan' });
      }
      const loanData = {
        topUpHistory: loan.loanDetails.topUpHistory,
        topDownHistory: loan.loanDetails.topDownHistory,
      };
  
      res.json(loanData);
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ error: 'Server Error' });
    }
  });
  
  
  

module.exports = router;
