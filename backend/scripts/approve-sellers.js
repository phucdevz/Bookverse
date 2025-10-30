const mongoose = require('mongoose');
const User = require('../models/User');

async function approveSellers() {
    try {
        await mongoose.connect('mongodb://localhost:27017/bookverse');
        console.log('🔌 Connected to MongoDB');
        
        // Get all sellers
        const sellers = await User.find({ role: 'seller' });
        console.log('\n📊 Current sellers:');
        sellers.forEach(s => {
            console.log(`- ${s.fullName} (${s.email})`);
            console.log(`  Approved: ${s.sellerProfile?.isApproved || false}`);
            console.log(`  Status: ${s.sellerProfile?.approvalStatus || 'pending'}`);
        });
        
        // Auto-approve ALL sellers
        const result = await User.updateMany(
            { role: 'seller' },
            { 
                $set: { 
                    'sellerProfile.isApproved': true,
                    'sellerProfile.approvalStatus': 'approved'
                } 
            }
        );
        
        console.log(`\n✅ Updated ${result.modifiedCount} sellers`);
        
        // Verify
        const updated = await User.find({ role: 'seller' });
        console.log('\n✅ Updated sellers:');
        updated.forEach(s => {
            console.log(`- ${s.fullName}: isApproved=${s.sellerProfile?.isApproved}`);
        });
        
        await mongoose.disconnect();
        console.log('\n✅ Done!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
}

approveSellers();


