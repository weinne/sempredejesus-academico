#!/usr/bin/env node

/**
 * 🗄️ Database Connection Test Script
 * Tests database connectivity and shows current configuration
 */

const { testConnection } = require('../db/index.js');
const { config } = require('@seminario/shared-config');

async function runDatabaseTest() {
  console.log('\n🗄️ Testing Database Connection...\n');
  console.log(`📍 DATABASE_URL: ${config.database.url}`);
  
  try {
    console.log('\n⏳ Testing connection...');
    const isConnected = await testConnection();
    
    if (isConnected) {
      console.log('✅ Database connection test successful!');
      console.log('\n📋 Next steps:');
      console.log('1. Run migrations: pnpm run db:migrate');
      console.log('2. Start development server: pnpm run dev');
    } else {
      console.log('❌ Database connection failed');
      console.log('\n💡 Make sure PostgreSQL is running:');
      console.log('docker-compose up -d db');
    }
    
  } catch (error) {
    console.error('\n❌ Database test failed:');
    console.error('Error:', error.message);
    
    console.log('\n💡 Troubleshooting:');
    console.log('1. Check if PostgreSQL is running: docker-compose up -d db');
    console.log('2. Verify DATABASE_URL in your .env file');
    console.log('3. Check database credentials');
    
    process.exit(1);
  }
}

// Run the test
runDatabaseTest().catch(console.error); 