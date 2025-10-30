const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');
require('dotenv').config();

// Connect to database
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bookverse');

async function seedDatabase() {
    try {
        console.log('🌱 Starting database seeding...');

        // Clear existing data
        await User.deleteMany({});
        await Product.deleteMany({});
        await Category.deleteMany({});
        await Order.deleteMany({});

        console.log('✅ Cleared existing data');

        // Create categories
        const categories = await Category.insertMany([
            {
                name: 'Văn học',
                slug: 'van-hoc',
                description: 'Tiểu thuyết, truyện ngắn, thơ ca và các tác phẩm văn học',
                isActive: true,
                isFeatured: true,
                sortOrder: 1
            },
            {
                name: 'Khoa học',
                slug: 'khoa-hoc',
                description: 'Sách khoa học, công nghệ, nghiên cứu',
                isActive: true,
                isFeatured: true,
                sortOrder: 2
            },
            {
                name: 'Kinh tế',
                slug: 'kinh-te',
                description: 'Sách về kinh tế, tài chính, kinh doanh',
                isActive: true,
                isFeatured: true,
                sortOrder: 3
            },
            {
                name: 'Lịch sử',
                slug: 'lich-su',
                description: 'Sách lịch sử, địa lý, văn hóa',
                isActive: true,
                isFeatured: false,
                sortOrder: 4
            },
            {
                name: 'Giáo dục',
                slug: 'giao-duc',
                description: 'Sách giáo khoa, tài liệu học tập',
                isActive: true,
                isFeatured: false,
                sortOrder: 5
            },
            {
                name: 'Thiếu nhi',
                slug: 'thieu-nhi',
                description: 'Sách dành cho trẻ em',
                isActive: true,
                isFeatured: true,
                sortOrder: 6
            }
        ]);

        console.log('✅ Created categories');

        // Create admin user
        const adminUser = new User({
            username: 'admin',
            email: 'admin@bookverse.vn',
            password: 'admin123',
            role: 'admin',
            profile: {
                firstName: 'Admin',
                lastName: 'Bookverse',
                phone: '0123456789'
            },
            isActive: true,
            isEmailVerified: true
        });
        await adminUser.save();

        // Create test users
        const users = await User.insertMany([
            {
                username: 'nguyenvana',
                email: 'nguyenvana@example.com',
                password: 'password123',
                role: 'user',
                profile: {
                    firstName: 'Nguyễn',
                    lastName: 'Văn A',
                    phone: '0123456789',
                    address: {
                        street: '123 Đường ABC',
                        city: 'Hà Nội',
                        state: 'Hà Nội',
                        zipCode: '100000',
                        country: 'Vietnam'
                    }
                },
                isActive: true,
                isEmailVerified: true
            },
            {
                username: 'tranthib',
                email: 'tranthib@example.com',
                password: 'password123',
                role: 'user',
                profile: {
                    firstName: 'Trần',
                    lastName: 'Thị B',
                    phone: '0987654321',
                    address: {
                        street: '456 Đường XYZ',
                        city: 'TP.HCM',
                        state: 'TP.HCM',
                        zipCode: '700000',
                        country: 'Vietnam'
                    }
                },
                isActive: true,
                isEmailVerified: true
            }
        ]);

        console.log('✅ Created users');

        // Create seller users
        const sellers = await User.insertMany([
            {
                username: 'sachhaystore',
                email: 'sachhaystore@example.com',
                password: 'password123',
                role: 'seller',
                profile: {
                    firstName: 'Nguyễn',
                    lastName: 'Văn C',
                    phone: '0123456789'
                },
                sellerProfile: {
                    businessName: 'Sách Hay Store',
                    businessType: 'individual',
                    description: 'Chuyên cung cấp sách văn học và khoa học chất lượng cao',
                    isApproved: true,
                    approvedAt: new Date(),
                    approvedBy: adminUser._id
                },
                isActive: true,
                isEmailVerified: true
            },
            {
                username: 'bookworld',
                email: 'bookworld@example.com',
                password: 'password123',
                role: 'seller',
                profile: {
                    firstName: 'Trần',
                    lastName: 'Thị D',
                    phone: '0987654321'
                },
                sellerProfile: {
                    businessName: 'Book World',
                    businessType: 'company',
                    businessLicense: 'BL123456',
                    taxId: 'TAX789012',
                    description: 'Nhà sách trực tuyến hàng đầu Việt Nam',
                    isApproved: true,
                    approvedAt: new Date(),
                    approvedBy: adminUser._id
                },
                isActive: true,
                isEmailVerified: true
            }
        ]);

        console.log('✅ Created sellers');

        // Create sample products
        const products = await Product.insertMany([
            {
                title: 'Đắc Nhân Tâm',
                description: 'Cuốn sách kinh điển về nghệ thuật giao tiếp và ứng xử trong cuộc sống',
                author: 'Dale Carnegie',
                price: 89000,
                originalPrice: 120000,
                category: categories[0]._id, // Văn học
                seller: sellers[0]._id,
                images: [
                    {
                        url: 'https://via.placeholder.com/300x400/FF6B6B/FFFFFF?text=Dac+Nhan+Tam',
                        alt: 'Đắc Nhân Tâm',
                        isPrimary: true
                    }
                ],
                stock: 50,
                condition: 'new',
                language: 'Vietnamese',
                publisher: 'NXB Trẻ',
                publishYear: 2020,
                pages: 320,
                isbn: '9786041001234',
                tags: ['self-help', 'giao-tiep', 'thanh-cong'],
                status: 'approved',
                isActive: true,
                isFeatured: true,
                rating: {
                    average: 4.5,
                    count: 128
                }
            },
            {
                title: 'Sapiens: Lược sử loài người',
                description: 'Cuốn sách khám phá lịch sử tiến hóa của loài người từ thời tiền sử đến hiện tại',
                author: 'Yuval Noah Harari',
                price: 195000,
                originalPrice: 250000,
                category: categories[1]._id, // Khoa học
                seller: sellers[1]._id,
                images: [
                    {
                        url: 'https://via.placeholder.com/300x400/4ECDC4/FFFFFF?text=Sapiens',
                        alt: 'Sapiens',
                        isPrimary: true
                    }
                ],
                stock: 30,
                condition: 'new',
                language: 'Vietnamese',
                publisher: 'NXB Thế Giới',
                publishYear: 2021,
                pages: 512,
                isbn: '9786041005678',
                tags: ['lich-su', 'khoa-hoc', 'triet-hoc'],
                status: 'approved',
                isActive: true,
                isFeatured: true,
                rating: {
                    average: 4.8,
                    count: 95
                }
            },
            {
                title: 'Rich Dad Poor Dad',
                description: 'Cuốn sách về tư duy tài chính và cách xây dựng sự giàu có',
                author: 'Robert Kiyosaki',
                price: 125000,
                originalPrice: 150000,
                category: categories[2]._id, // Kinh tế
                seller: sellers[0]._id,
                images: [
                    {
                        url: 'https://via.placeholder.com/300x400/45B7D1/FFFFFF?text=Rich+Dad',
                        alt: 'Rich Dad Poor Dad',
                        isPrimary: true
                    }
                ],
                stock: 25,
                condition: 'new',
                language: 'Vietnamese',
                publisher: 'NXB Lao Động',
                publishYear: 2019,
                pages: 288,
                isbn: '9786041009012',
                tags: ['tai-chinh', 'dau-tu', 'thanh-cong'],
                status: 'approved',
                isActive: true,
                isFeatured: false,
                rating: {
                    average: 4.3,
                    count: 67
                }
            },
            {
                title: 'Harry Potter và Hòn đá Phù thủy',
                description: 'Cuốn đầu tiên trong series Harry Potter - câu chuyện về cậu bé phù thủy',
                author: 'J.K. Rowling',
                price: 180000,
                originalPrice: 220000,
                category: categories[5]._id, // Thiếu nhi
                seller: sellers[1]._id,
                images: [
                    {
                        url: 'https://via.placeholder.com/300x400/96CEB4/FFFFFF?text=Harry+Potter',
                        alt: 'Harry Potter',
                        isPrimary: true
                    }
                ],
                stock: 40,
                condition: 'new',
                language: 'Vietnamese',
                publisher: 'NXB Trẻ',
                publishYear: 2020,
                pages: 320,
                isbn: '9786041003456',
                tags: ['phieu-luu', 'phap-thuat', 'thieu-nhi'],
                status: 'approved',
                isActive: true,
                isFeatured: true,
                rating: {
                    average: 4.9,
                    count: 203
                }
            },
            {
                title: 'Lịch sử Việt Nam',
                description: 'Cuốn sách tổng hợp lịch sử Việt Nam từ thời kỳ dựng nước đến hiện tại',
                author: 'GS. Phan Huy Lê',
                price: 220000,
                originalPrice: 280000,
                category: categories[3]._id, // Lịch sử
                seller: sellers[0]._id,
                images: [
                    {
                        url: 'https://via.placeholder.com/300x400/FFEAA7/FFFFFF?text=Lich+Su+Viet+Nam',
                        alt: 'Lịch sử Việt Nam',
                        isPrimary: true
                    }
                ],
                stock: 20,
                condition: 'new',
                language: 'Vietnamese',
                publisher: 'NXB Giáo Dục',
                publishYear: 2021,
                pages: 680,
                isbn: '9786041007890',
                tags: ['lich-su', 'viet-nam', 'giao-duc'],
                status: 'approved',
                isActive: true,
                isFeatured: false,
                rating: {
                    average: 4.6,
                    count: 45
                }
            }
        ]);

        console.log('✅ Created products');

        // Create sample orders
        const orders = await Order.insertMany([
            {
                customer: users[0]._id,
                items: [
                    {
                        product: products[0]._id,
                        seller: sellers[0]._id,
                        quantity: 2,
                        price: products[0].price,
                        total: products[0].price * 2
                    }
                ],
                shippingAddress: {
                    fullName: 'Nguyễn Văn A',
                    phone: '0123456789',
                    email: 'nguyenvana@example.com',
                    street: '123 Đường ABC',
                    city: 'Hà Nội',
                    state: 'Hà Nội',
                    zipCode: '100000',
                    country: 'Vietnam'
                },
                payment: {
                    method: 'cod',
                    status: 'pending'
                },
                status: 'pending',
                subtotal: products[0].price * 2,
                shipping: {
                    cost: 30000,
                    method: 'standard'
                },
                tax: {
                    rate: 0.1,
                    amount: (products[0].price * 2) * 0.1
                },
                total: (products[0].price * 2) + 30000 + ((products[0].price * 2) * 0.1)
            },
            {
                customer: users[1]._id,
                items: [
                    {
                        product: products[1]._id,
                        seller: sellers[1]._id,
                        quantity: 1,
                        price: products[1].price,
                        total: products[1].price
                    },
                    {
                        product: products[3]._id,
                        seller: sellers[1]._id,
                        quantity: 1,
                        price: products[3].price,
                        total: products[3].price
                    }
                ],
                shippingAddress: {
                    fullName: 'Trần Thị B',
                    phone: '0987654321',
                    email: 'tranthib@example.com',
                    street: '456 Đường XYZ',
                    city: 'TP.HCM',
                    state: 'TP.HCM',
                    zipCode: '700000',
                    country: 'Vietnam'
                },
                payment: {
                    method: 'bank_transfer',
                    status: 'paid',
                    paidAt: new Date()
                },
                status: 'processing',
                subtotal: products[1].price + products[3].price,
                shipping: {
                    cost: 25000,
                    method: 'express'
                },
                tax: {
                    rate: 0.1,
                    amount: (products[1].price + products[3].price) * 0.1
                },
                total: (products[1].price + products[3].price) + 25000 + ((products[1].price + products[3].price) * 0.1)
            }
        ]);

        console.log('✅ Created orders');

        console.log('🎉 Database seeding completed successfully!');
        console.log('\n📊 Summary:');
        console.log(`- Categories: ${categories.length}`);
        console.log(`- Users: ${users.length + 1} (including admin)`);
        console.log(`- Sellers: ${sellers.length}`);
        console.log(`- Products: ${products.length}`);
        console.log(`- Orders: ${orders.length}`);

        console.log('\n🔑 Test Accounts:');
        console.log('Admin: admin@bookverse.vn / admin123');
        console.log('User: nguyenvana@example.com / password123');
        console.log('Seller: sachhaystore@example.com / password123');

    } catch (error) {
        console.error('❌ Seeding failed:', error);
    } finally {
        mongoose.connection.close();
    }
}

// Run seeding
seedDatabase();

