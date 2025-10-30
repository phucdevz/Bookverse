const API_URL = 'http://localhost:5000/api';
let authToken = '';
let categoryId = '';

async function fetchJSON(url, options = {}) {
    const response = await fetch(url, options);
    const data = await response.json();
    return { status: response.status, data };
}

async function testProductUpload() {
    try {
        console.log('🧪 ===== TESTING PRODUCT UPLOAD =====\n');
        
        // Step 1: Login as admin (admin can also create products)
        console.log('1️⃣ Login as admin...');
        const loginResult = await fetchJSON(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@bookverse.com',
                password: 'Admin@123'
            })
        });
        
        if (!loginResult.data.success) {
            throw new Error('Login failed: ' + loginResult.data.message);
        }
        
        authToken = loginResult.data.token;
        console.log('✅ Login successful');
        console.log('   Token:', authToken.substring(0, 30) + '...\n');
        
        // Step 2: Get categories
        console.log('2️⃣ Fetching categories...');
        const categoriesResult = await fetchJSON(`${API_URL}/products/categories`);
        
        if (!categoriesResult.data.success || !categoriesResult.data.data.categories.length) {
            throw new Error('No categories found');
        }
        
        categoryId = categoriesResult.data.data.categories[0]._id;
        console.log('✅ Categories loaded');
        console.log('   Using category:', categoriesResult.data.data.categories[0].name);
        console.log('   Category ID:', categoryId + '\n');
        
        // Step 3: Create product
        console.log('3️⃣ Creating product...');
        const productData = {
            title: 'Test Product ' + Date.now(),
            author: 'Test Author',
            publisher: 'Test Publisher',
            isbn: '978-0-123456-78-9',
            description: 'This is a test product created by automated test script. It should work perfectly!',
            price: 150000,
            originalPrice: 200000,
            stock: 10,
            condition: 'new',
            category: categoryId,  // ✅ Using ObjectID
            language: 'Tiếng Việt',
            publishYear: 2024,
            pages: 300
        };
        
        console.log('   Product data:');
        console.log('   - Title:', productData.title);
        console.log('   - Category ID:', productData.category);
        console.log('   - Price:', productData.price);
        console.log('   - Stock:', productData.stock);
        
        const productResult = await fetchJSON(`${API_URL}/products`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(productData)
        });
        
        if (!productResult.data.success) {
            throw new Error('Product creation failed: ' + JSON.stringify(productResult.data));
        }
        
        console.log('\n✅✅✅ PRODUCT CREATED SUCCESSFULLY! ✅✅✅');
        console.log('\n📦 Product Details:');
        console.log('   - ID:', productResult.data.data._id);
        console.log('   - Title:', productResult.data.data.title);
        console.log('   - Price:', productResult.data.data.price);
        console.log('   - Status:', productResult.data.data.status);
        console.log('   - Category:', productResult.data.data.category);
        
        console.log('\n🎉 ALL TESTS PASSED! 🎉');
        console.log('✅ Login works');
        console.log('✅ Categories API works');
        console.log('✅ Product upload works');
        console.log('\n💡 You can now upload products from frontend!\n');
        
    } catch (error) {
        console.error('\n❌ TEST FAILED!');
        if (error.response) {
            console.error('❌ Response error:', error.response.status);
            console.error('❌ Response data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('❌ Error:', error.message);
        }
        process.exit(1);
    }
}

testProductUpload();

