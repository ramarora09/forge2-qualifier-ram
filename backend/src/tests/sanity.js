const http = require('http');

// Start the server
const app = require('../app');

const makeRequest = (path, method = 'GET', body = null) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

const runSanityChecks = async () => {
  console.log('\n--- Running Backend Sanity Checks ---');
  // Wait a moment for server initialization
  await new Promise(resolve => setTimeout(resolve, 1500));

  try {
    // 1. Health check
    console.log('Testing /api/health ...');
    const health = await makeRequest('/api/health');
    console.log('Health status:', health.status, health.data);
    if (health.status !== 200 || health.data.status !== 'OK') {
      throw new Error('Health check failed!');
    }

    // 2. Get boards
    console.log('Testing /api/boards ...');
    const boards = await makeRequest('/api/boards');
    console.log('Boards status:', boards.status, 'Count:', boards.data.length);
    if (boards.status !== 200 || !Array.isArray(boards.data) || boards.data.length === 0) {
      throw new Error('Boards listing failed or database was not seeded!');
    }

    // 3. Get single board (deep layout)
    const boardId = boards.data[0].id;
    console.log(`Testing /api/boards/${boardId} ...`);
    const boardDetail = await makeRequest(`/api/boards/${boardId}`);
    console.log('Board detail status:', boardDetail.status, 'Title:', boardDetail.data.title);
    console.log('Contains lists count:', boardDetail.data.lists.length);
    if (boardDetail.status !== 200 || boardDetail.data.lists.length === 0) {
      throw new Error('Get board details failed!');
    }

    // 4. Get members
    console.log('Testing /api/members ...');
    const members = await makeRequest('/api/members');
    console.log('Members status:', members.status, 'Count:', members.data.length);
    if (members.status !== 200 || !Array.isArray(members.data) || members.data.length === 0) {
      throw new Error('Members listing failed!');
    }

    // 5. Get dashboard stats
    console.log('Testing /api/dashboard ...');
    const dashboard = await makeRequest('/api/dashboard');
    console.log('Dashboard status:', dashboard.status, 'Metrics:', dashboard.data);
    if (dashboard.status !== 200 || dashboard.data.totalBoards === undefined) {
      throw new Error('Dashboard loading failed!');
    }

    console.log('\n=========================================');
    console.log('  ALL BACKEND SANITY CHECKS PASSED!');
    console.log('=========================================\n');
    process.exit(0);
  } catch (err) {
    console.error('Sanity checks failed:', err.message);
    process.exit(1);
  }
};

runSanityChecks();
