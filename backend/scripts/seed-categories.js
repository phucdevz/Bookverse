const mongoose = require('mongoose');
const Category = require('../models/Category');

const categories = [
    {
        name: 'Văn học',
        slug: 'van-hoc',
        path: 'van-hoc',
        description: 'Sách văn học, tiểu thuyết, truyện ngắn',
        isActive: true
    },
    {
        name: 'Kinh tế',
        slug: 'kinh-te',
        path: 'kinh-te',
        description: 'Sách về kinh tế, kinh doanh, tài chính',
        isActive: true
    },
    {
        name: 'Kỹ năng sống',
        slug: 'ky-nang-song',
        path: 'ky-nang-song',
        description: 'Sách phát triển bản thân, kỹ năng mềm',
        isActive: true
    },
    {
        name: 'Giáo dục',
        slug: 'giao-duc',
        path: 'giao-duc',
        description: 'Sách giáo khoa, tham khảo, học tập',
        isActive: true
    },
    {
        name: 'Công nghệ',
        slug: 'cong-nghe',
        path: 'cong-nghe',
        description: 'Sách về lập trình, công nghệ thông tin',
        isActive: true
    },
    {
        name: 'Thiếu nhi',
        slug: 'thieu-nhi',
        path: 'thieu-nhi',
        description: 'Sách dành cho trẻ em',
        isActive: true
    },
    {
        name: 'Tâm lý',
        slug: 'tam-ly',
        path: 'tam-ly',
        description: 'Sách tâm lý học, phát triển tư duy',
        isActive: true
    },
    {
        name: 'Lịch sử',
        slug: 'lich-su',
        path: 'lich-su',
        description: 'Sách lịch sử, văn hóa',
        isActive: true
    },
    {
        name: 'Khoa học',
        slug: 'khoa-hoc',
        path: 'khoa-hoc',
        description: 'Sách khoa học tự nhiên, xã hội',
        isActive: true
    },
    {
        name: 'Nghệ thuật',
        slug: 'nghe-thuat',
        path: 'nghe-thuat',
        description: 'Sách về nghệ thuật, âm nhạc, hội họa',
        isActive: true
    }
];

async function seedCategories() {
    try {
        await mongoose.connect('mongodb://localhost:27017/bookverse');
        console.log('🔌 Connected to MongoDB');
        
        // Clear existing categories
        await Category.deleteMany({});
        console.log('🗑️  Cleared existing categories');
        
        // Insert new categories
        const result = await Category.insertMany(categories);
        console.log(`✅ Created ${result.length} categories\n`);
        
        // Display created categories
        console.log('📂 Categories:');
        result.forEach(cat => {
            console.log(`- ${cat.name} (${cat.slug})`);
            console.log(`  ID: ${cat._id}`);
        });
        
        await mongoose.disconnect();
        console.log('\n✅ Done!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
}

seedCategories();

