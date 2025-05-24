// scripts/seedProductsAdmin.js
const admin = require('firebase-admin');
const dotenv = require('dotenv');

// 環境変数を読み込み
dotenv.config({ path: '.env.local' });

// Admin SDK を初期化
try {
  admin.initializeApp({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'we-are-onchain',
  });
  console.log('🔧 Using Firebase Admin SDK with project:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'we-are-onchain');
} catch (error) {
  console.error('❌ Firebase Admin initialization error:', error.message);
  process.exit(1);
}

const db = admin.firestore();

// 商品データ
const products = [
  {
    id: 'pepe-protein-1',
    name: 'Pepe Flavor Protein 1kg',
    description: 'Premium whey protein with the legendary Pepe flavor. Built for the blockchain generation. This high-quality protein powder delivers 25g of protein per serving and is perfect for post-workout recovery.',
    price: {
      usd: 27.8
    },
    inventory: {
      totalStock: 100,
      availableStock: 45,
      reservedStock: 0
    },
    metadata: {
      rating: 4.9,
      reviewCount: 127,
      features: [
        'Blockchain Verified Quality',
        'Community Approved Formula',
        'Meme-Powered Gains',
        'Web3 Native Nutrition',
        'Premium Whey Isolate',
        'No Artificial Colors'
      ],
      nutritionFacts: {
        protein: '25g',
        fat: '1.5g',
        carbs: '2g',
        minerals: '1g',
        allergen: 'Milk',
        calories: '120'
      },
      images: [
        '/images/pepe-protein-main.webp',
        '/images/pepe-protein-side.webp',
        '/images/pepe-protein-back.webp'
      ],
      tags: ['protein', 'whey', 'pepe', 'meme', 'premium', 'blockchain']
    },
    settings: {
      maxOrderQuantity: 10,
      minOrderQuantity: 1,
      isActive: true,
      category: 'protein',
      sku: 'PEPE-PROT-1KG-001'
    }
  },
  {
    id: 'crypto-creatine-500g',
    name: 'Crypto Creatine Monohydrate 500g',
    description: 'Pure creatine monohydrate for maximum gains. Verified on the blockchain for authenticity and purity. Each serving provides 5g of micronized creatine.',
    price: {
      usd: 19.99
    },
    inventory: {
      totalStock: 75,
      availableStock: 68,
      reservedStock: 0
    },
    metadata: {
      rating: 4.7,
      reviewCount: 89,
      features: [
        'Micronized Formula',
        'Blockchain Verified Purity',
        '99.9% Pure Creatine',
        'No Fillers Added',
        'Third-Party Tested'
      ],
      nutritionFacts: {
        creatine: '5g',
        calories: '0',
        fat: '0g',
        carbs: '0g',
        protein: '0g',
        allergen: 'None'
      },
      images: [
        '/images/crypto-creatine-main.webp'
      ],
      tags: ['creatine', 'crypto', 'pure', 'strength', 'performance']
    },
    settings: {
      maxOrderQuantity: 5,
      minOrderQuantity: 1,
      isActive: true,
      category: 'supplements',
      sku: 'CRYPTO-CREAT-500G-001'
    }
  }
];

// データ投入関数
async function seedProducts() {
  try {
    console.log('🌱 Starting product data seeding with Admin SDK...');
    
    for (const product of products) {
      const { id, ...productData } = product;
      
      // Firestoreドキュメントを作成
      const productDoc = {
        ...productData,
        timestamps: {
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }
      };
      
      await db.collection('products').doc(id).set(productDoc);
      
      console.log(`✅ Product created: ${product.name} (${id})`);
    }
    
    console.log('🎉 Product seeding completed successfully!');
    console.log(`📊 Total products added: ${products.length}`);
    
  } catch (error) {
    console.error('❌ Error seeding products:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  }
}

// スクリプト実行
if (require.main === module) {
  seedProducts()
    .then(() => {
      console.log('✨ Seeding process finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedProducts };