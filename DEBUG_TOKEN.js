// Debugging script to check if admin token is stored
console.log('🔍 Checking localStorage for admin token...\n');

// Check if adminToken exists
const adminToken = localStorage.getItem('adminToken');
const adminUser = localStorage.getItem('adminUser');

console.log('📋 localStorage Contents:');
console.log('=======================\n');

if (adminToken) {
  console.log('✅ adminToken exists');
  console.log(`   Length: ${adminToken.length} characters`);
  console.log(`   Starts with: ${adminToken.substring(0, 50)}...`);
  console.log(`   Format check: ${adminToken.startsWith('eyJ') ? '✅ Valid JWT format' : '❌ Not a valid JWT'}\n`);
} else {
  console.log('❌ adminToken NOT found in localStorage\n');
}

if (adminUser) {
  console.log('✅ adminUser exists');
  try {
    const user = JSON.parse(adminUser);
    console.log(`   Username: ${user.username}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}\n`);
  } catch (e) {
    console.log('❌ adminUser is not valid JSON\n');
  }
} else {
  console.log('❌ adminUser NOT found in localStorage\n');
}

console.log('🧪 Testing getAuthHeaders function:\n');

// Simulate getAuthHeaders function
const getAuthHeaders = () => {
  const adminToken = localStorage.getItem('adminToken');
  const vendorToken = localStorage.getItem('token');
  const token = adminToken || vendorToken;
  console.log(`   adminToken: ${adminToken ? '✅ Found' : '❌ Not found'}`);
  console.log(`   vendorToken: ${vendorToken ? '✅ Found' : '❌ Not found'}`);
  console.log(`   Using token: ${token ? '✅ Token selected' : '❌ No token'}`);
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  console.log(`   Headers: ${JSON.stringify(headers)}\n`);
  return headers;
};

const authHeaders = getAuthHeaders();

if (authHeaders.Authorization) {
  console.log('✅ SUCCESS: Headers will include Authorization\n');
} else {
  console.log('❌ PROBLEM: No Authorization header will be sent\n');
}

console.log('💡 If you see ❌ marks above, copy this debug code to your AdminPanel.jsx');
console.log('   and run it in the browser console after login to identify the issue.\n');
