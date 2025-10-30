const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

async function createTestSeller() {
    try {
        await mongoose.connect('mongodb://localhost:27017/bookverse');
        console.log('🔌 Connected to MongoDB\n');
        
        // Delete existing test seller if exists
        await User.deleteOne({ email: 'testseller@bookverse.com' });
        
        // Create new test seller
        const hashedPassword = await bcrypt.hash('Test@123', 10);
        
        const seller = new User({
            email: 'testseller@bookverse.com',
            password: hashedPassword,
            fullName: 'Test Seller',
            role: 'seller',
            sellerProfile: {
                businessName: 'Test Bookstore',
                businessAddress: '123 Test Street',
                taxId: 'TEST123456',
                phone: '0123456789',
                isApproved: true,
                approvalStatus: 'approved'
            }
        });
        
        await seller.save();
        
        console.log('✅ Test seller created successfully!\n');
        console.log('📧 Email: testseller@bookverse.com');
        console.log('🔑 Password: Test@123');
        console.log('👤 Role: seller');
        console.log('✅ Status: approved\n');
        
        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
}

createTestSeller();


