#!/usr/bin/env node

/**
 * 🗄️ Database Connection Test Script
 * Tests database connectivity and shows current configuration
 */

const postgres = require('postgres');

// Database configuration (using same defaults as shared-config)
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:passwd@localhost:5432/seminario_db';

async function testDatabaseConnection() {
  console.log('\n🗄️ Testing Database Connection...\n');
  console.log(`📍 DATABASE_URL: ${DATABASE_URL}`);
  
  let sql;
  
  try {
    // Create connection
    console.log('\n⏳ Connecting to database...');
    sql = postgres(DATABASE_URL, {
      max: 5,
      idle_timeout: 20,
      connect_timeout: 10,
    });

    // Test basic connection
    console.log('✓ Connection established');
    
    // Test simple query
    const result = await sql`SELECT NOW() as current_time, version() as pg_version`;
    console.log(`✓ Database time: ${result[0].current_time}`);
    console.log(`✓ PostgreSQL version: ${result[0].pg_version.split(' ')[0]}`);
    
    // Check if database exists and has tables
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    
    console.log(`\n📊 Database tables found: ${tables.length}`);
    if (tables.length > 0) {
      console.log('Tables:', tables.map(t => t.table_name).join(', '));
    } else {
      console.log('⚠️  No tables found - run migrations to create schema');
    }
    
    console.log('\n✅ Database connection test successful!');
    
  } catch (error) {
    console.error('\n❌ Database connection failed:');
    console.error('Error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Troubleshooting:');
      console.log('1. Make sure PostgreSQL is running');
      console.log('2. Check if Docker container is up: docker-compose up -d db');
      console.log('3. Verify DATABASE_URL configuration');
    } else if (error.code === '3D000') {
      console.log('\n💡 Database does not exist. Create it with:');
      console.log('docker-compose up -d db');
    } else if (error.code === '28P01') {
      console.log('\n💡 Authentication failed. Check username/password in DATABASE_URL');
    }
    
    process.exit(1);
  } finally {
    if (sql) {
      await sql.end();
      console.log('\n🔌 Connection closed');
    }
  }
}

// Run the test
testDatabaseConnection().catch(console.error); 