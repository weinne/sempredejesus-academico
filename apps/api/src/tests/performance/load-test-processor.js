const { faker } = require('@faker-js/faker');

// Pre-configured test users for load testing
const testUsers = [
  { email: 'loadtest1@seminario.edu', password: 'LoadTest123!' },
  { email: 'loadtest2@seminario.edu', password: 'LoadTest123!' },
  { email: 'loadtest3@seminario.edu', password: 'LoadTest123!' },
  { email: 'loadtest4@seminario.edu', password: 'LoadTest123!' },
  { email: 'loadtest5@seminario.edu', password: 'LoadTest123!' },
];

const adminUsers = [
  { email: 'admin1@seminario.edu', password: 'AdminTest123!' },
  { email: 'admin2@seminario.edu', password: 'AdminTest123!' },
];

module.exports = {
  // Set up random test data for each virtual user
  setUserCredentials: function(context, events, done) {
    // Pick a random test user
    const randomUser = testUsers[Math.floor(Math.random() * testUsers.length)];
    context.vars.email = randomUser.email;
    context.vars.password = randomUser.password;
    
    // Pick a random admin user for admin operations
    const randomAdmin = adminUsers[Math.floor(Math.random() * adminUsers.length)];
    context.vars.adminEmail = randomAdmin.email;
    context.vars.adminPassword = randomAdmin.password;
    
    return done();
  },

  // Generate realistic test data
  generatePersonData: function(context, events, done) {
    context.vars.randomNome = faker.person.fullName();
    context.vars.randomEmail = faker.internet.email();
    context.vars.randomCpf = faker.string.numeric(11);
    context.vars.randomTelefone = '11' + faker.string.numeric(9);
    context.vars.randomEndereco = faker.location.streetAddress();
    context.vars.randomDataNascimento = faker.date.birthdate({ min: 18, max: 80, mode: 'age' }).toISOString().split('T')[0];
    
    return done();
  },

  // Log custom metrics
  logCustomMetrics: function(context, events, done) {
    // Log authentication time
    if (context.vars.accessToken) {
      events.emit('counter', 'auth.success', 1);
    }
    
    // Log response times for critical endpoints
    events.emit('histogram', 'custom.response_time', Date.now() - context.vars.startTime);
    
    return done();
  },

  // Validate API responses
  validateResponse: function(context, events, done) {
    if (context.vars.healthStatus !== 'ok') {
      events.emit('counter', 'health_check.failure', 1);
    } else {
      events.emit('counter', 'health_check.success', 1);
    }
    
    return done();
  },

  // Track timing for performance analysis
  startTimer: function(context, events, done) {
    context.vars.startTime = Date.now();
    return done();
  },

  // Cleanup after test scenarios
  cleanup: function(context, events, done) {
    // In a real scenario, you might want to clean up test data
    // For load testing, we usually let the data accumulate for analysis
    return done();
  },

  // Custom error handling
  handleError: function(context, events, done) {
    events.emit('counter', 'custom.errors', 1);
    console.error('Custom error handler triggered:', context.vars);
    return done();
  },

  // Performance thresholds validation
  checkPerformance: function(context, events, done) {
    const responseTime = Date.now() - context.vars.startTime;
    
    if (responseTime > 2000) {
      events.emit('counter', 'performance.slow_response', 1);
    } else if (responseTime < 100) {
      events.emit('counter', 'performance.fast_response', 1);
    } else {
      events.emit('counter', 'performance.normal_response', 1);
    }
    
    return done();
  }
}; 