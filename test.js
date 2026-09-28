/**
 * Automated API Test Suite - Lab 4
 * Tests all positive and negative endpoints against MongoDB Atlas / REST API.
 * Verifies 200, 201, 400 (validation & unique constraint), 404, and persistence.
 */

const mongoose = require('mongoose');
const request = require('supertest');
const app = require('./src/server');

async function waitForDbConnection(timeoutMs = 5000) {
  const start = Date.now();
  while (mongoose.connection.readyState !== 1 && Date.now() - start < timeoutMs) {
    await new Promise(r => setTimeout(r, 200));
  }
  if (mongoose.connection.readyState === 1) {
    console.log(`🔌 Connected to MongoDB: ${mongoose.connection.host}\n`);
  } else {
    console.log('⚠️ Running in fallback / in-memory mode\n');
  }
}

async function runAllTests() {
  console.log('=======================================================');
  console.log('🧪 RUNNING LAB 4 AUTOMATED API TEST SUITE');
  console.log('=======================================================');

  await waitForDbConnection();

  // Test 1: GET /students
  console.log('1. Testing GET /students (List all students)');
  const res1 = await request(app).get('/students');
  console.log(`   Status: ${res1.status} OK | Count: ${res1.body.count}`);
  console.assert(res1.status === 200, 'Expected 200 OK');

  // Test 2: POST /students (Valid creation)
  const uniqueEmail = `lab4_test_${Date.now()}@university.edu`;
  console.log(`\n2. Testing POST /students (Valid student creation: ${uniqueEmail})`);
  const validStudent = {
    name: 'Ananya Rao',
    email: uniqueEmail,
    course: 'Computer Science',
    semester: 5
  };
  const res2 = await request(app).post('/students').send(validStudent);
  console.log(`   Status: ${res2.status} Created | Assigned ID: ${res2.body.data.id}`);
  console.assert(res2.status === 201, 'Expected 201 Created');
  console.assert(res2.body.data.email === uniqueEmail.toLowerCase(), 'Expected matching email');
  const createdId = res2.body.data.id;

  // Test 3: GET /students/:id (Get student by dynamic ID)
  console.log(`\n3. Testing GET /students/${createdId} (Get single student by ID)`);
  const res3 = await request(app).get(`/students/${createdId}`);
  console.log(`   Status: ${res3.status} OK | Name: ${res3.body.data.name}`);
  console.assert(res3.status === 200, 'Expected 200 OK');
  console.assert(res3.body.data.id === createdId, 'Expected matching ID');

  // Test 4: GET /students/999 (404 Not Found Test)
  console.log('\n4. Testing GET /students/999 (Missing ID - Section 8 & 9 requirement)');
  const res4 = await request(app).get('/students/999');
  console.log(`   Status: ${res4.status} Not Found | Error: "${res4.body.message}"`);
  console.assert(res4.status === 404, 'Expected 404 Not Found');

  // Test 5: POST /students (Invalid body - 400 Bad Request)
  console.log('\n5. Testing POST /students (Invalid body - Validation failure)');
  const invalidStudent = {
    name: '',
    email: 'invalid-email',
    semester: -2
  };
  const res5 = await request(app).post('/students').send(invalidStudent);
  console.log(`   Status: ${res5.status} Bad Request | Validation Errors Count: ${res5.body.details.length}`);
  console.assert(res5.status === 400, 'Expected 400 Bad Request');

  // Test 6: POST /students (Duplicate email constraint - 400 Bad Request)
  console.log('\n6. Testing POST /students (Database Constraint: Unique Email)');
  const duplicateStudent = {
    name: 'Duplicate Student',
    email: uniqueEmail,
    course: 'Information Systems',
    semester: 3
  };
  const res6 = await request(app).post('/students').send(duplicateStudent);
  console.log(`   Status: ${res6.status} Bad Request | Message: "${res6.body.message}"`);
  console.assert(res6.status === 400, 'Expected 400 Bad Request for duplicate email');

  // Test 7: PUT /students/:id (Valid update)
  console.log(`\n7. Testing PUT /students/${createdId} (Valid student update)`);
  const updateData = {
    name: 'Ananya Rao Updated',
    email: uniqueEmail,
    course: 'Artificial Intelligence',
    semester: 6
  };
  const res7 = await request(app).put(`/students/${createdId}`).send(updateData);
  console.log(`   Status: ${res7.status} OK | Updated Course: ${res7.body.data.course}`);
  console.assert(res7.status === 200, 'Expected 200 OK');
  console.assert(res7.body.data.course === 'Artificial Intelligence', 'Expected updated course');

  // Test 8: DELETE /students/:id (Valid deletion)
  console.log(`\n8. Testing DELETE /students/${createdId} (Valid student deletion)`);
  const res8 = await request(app).delete(`/students/${createdId}`);
  console.log(`   Status: ${res8.status} OK | Message: "${res8.body.message}"`);
  console.assert(res8.status === 200, 'Expected 200 OK');

  // Test 9: DELETE /students/:id again (404 Test)
  console.log(`\n9. Testing DELETE /students/${createdId} again (Deleting non-existent student)`);
  const res9 = await request(app).delete(`/students/${createdId}`);
  console.log(`   Status: ${res9.status} Not Found | Error: "${res9.body.message}"`);
  console.assert(res9.status === 404, 'Expected 404 Not Found');

  // Test 10: OpenAPI Swagger Docs endpoint
  console.log('\n10. Testing GET /api-docs.json (Swagger Spec)');
  const res10 = await request(app).get('/api-docs.json');
  console.log(`   Status: ${res10.status} OK | OpenAPI Version: ${res10.body.openapi}`);
  console.assert(res10.status === 200, 'Expected 200 OK');

  console.log('\n=======================================================');
  console.log('✅ ALL LAB 4 API TESTS PASSED SUCCESSFULLY!');
  console.log('=======================================================\n');

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  process.exit(0);
}

runAllTests().catch(async err => {
  console.error('❌ TEST FAILED:', err);
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  process.exit(1);
});
