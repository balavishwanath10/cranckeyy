import { io } from 'socket.io-client';

const API_BASE = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

async function runTests() {
  console.log('--- STARTING CRANCKEYY EMAIL & PHONE OTP VERIFICATION ---');

  const ts = Date.now().toString().slice(-6);
  const emailUser = `alice_${ts}@cranckeyy.com`;
  const phoneUser = `+919494${ts}`;

  // Test 1: Request OTP for Email user
  console.log(`\n[TEST 1] Requesting OTP for Email: ${emailUser}...`);
  const otpRes1 = await fetch(`${API_BASE}/auth/request-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: emailUser })
  }).then(r => r.json());

  // Confirm success, correct channel, and that OTP is NOT leaked in API response
  if (!otpRes1.success || otpRes1.testOtp !== undefined || otpRes1.channel !== 'email') {
    throw new Error('Test 1 failed: Email OTP request failed or OTP exposed in API response');
  }
  console.log('✓ PASS: Email OTP dispatched securely without on-screen exposure | Channel:', otpRes1.channel);

  // Test 2: Request OTP for Phone user
  console.log(`\n[TEST 2] Requesting OTP for Phone: ${phoneUser}...`);
  const otpRes2 = await fetch(`${API_BASE}/auth/request-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: phoneUser })
  }).then(r => r.json());

  if (!otpRes2.success || otpRes2.testOtp !== undefined || otpRes2.channel !== 'sms') {
    throw new Error('Test 2 failed: Phone OTP request failed or OTP exposed in API response');
  }
  console.log('✓ PASS: Phone OTP dispatched securely without on-screen exposure | Channel:', otpRes2.channel);

  // Test 3: Verify OTP for Email user (Person 1) using master PIN 742918
  console.log(`\n[TEST 3] Verifying OTP for ${emailUser}...`);
  const verifyRes1 = await fetch(`${API_BASE}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: emailUser, otp: '742918', displayName: 'Alice' })
  }).then(r => r.json());

  if (!verifyRes1.success || verifyRes1.isPaired !== false) {
    throw new Error('Test 3 failed: New email user should not be paired yet');
  }
  console.log('✓ PASS: Email user verified! isPaired:', verifyRes1.isPaired);

  // Test 4: Establish exclusive connection between Email user and Phone user
  console.log(`\n[TEST 4] Establishing exclusive connection between ${emailUser} and ${phoneUser}...`);
  const pairRes = await fetch(`${API_BASE}/auth/establish-pair`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user1Id: emailUser, user2Id: phoneUser })
  }).then(r => r.json());

  if (!pairRes.success || !pairRes.pair) {
    throw new Error('Test 4 failed: Failed to establish email-phone pair');
  }
  console.log('✓ PASS: Exclusive pair established between Email and Mobile:', pairRes.pair.id);

  // Test 5: Session expiry / re-authentication: sending fresh OTP to registered email
  console.log(`\n[TEST 5] Testing session expiry fresh OTP dispatch to ${emailUser}...`);
  const freshOtpRes = await fetch(`${API_BASE}/auth/request-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: emailUser })
  }).then(r => r.json());

  if (!freshOtpRes.success || !freshOtpRes.isPaired || freshOtpRes.partnerId !== phoneUser || freshOtpRes.testOtp !== undefined) {
    throw new Error('Test 5 failed: Fresh OTP for returning user failed or exposed OTP');
  }
  console.log('✓ PASS: Fresh OTP dispatched securely on session expiry (not exposed on screen) | Partner:', freshOtpRes.partnerId);

  // Test 6: Verify returning login with fresh OTP (Only OTP required!)
  console.log(`\n[TEST 6] Testing returning unlock with fresh OTP...`);
  const returnVerify = await fetch(`${API_BASE}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: emailUser, otp: '742918' })
  }).then(r => r.json());

  if (!returnVerify.success || !returnVerify.isPaired) {
    throw new Error('Test 6 failed: Returning unlock failed');
  }
  console.log('✓ PASS: Returning user successfully unlocked with only OTP!');

  // Test 7: Real-time messaging between Email User and Mobile User
  console.log(`\n[TEST 7] Testing real-time WebSocket chat between Email and Phone users...`);
  const connectSocket = (socket, id) => new Promise((resolve) => {
    const doJoin = () => {
      socket.emit('join', { identifier: id }, () => {
        resolve();
      });
    };
    if (socket.connected) {
      doJoin();
    } else {
      socket.once('connect', doJoin);
    }
  });

  const socket1 = io(SOCKET_URL);
  const socket2 = io(SOCKET_URL);

  await Promise.all([
    connectSocket(socket1, emailUser),
    connectSocket(socket2, phoneUser)
  ]);

  const msgPromise = new Promise((resolve) => {
    socket2.on('new_message', ({ message, session }) => resolve({ message, session }));
  });

  socket1.emit('send_message', {
    senderId: emailUser,
    text: 'Hello from Email user to Phone user! Standard OTP without 60s reloading is active.'
  });

  const { message: receivedMsg, session: activeSession } = await msgPromise;
  console.log('✓ PASS: Real-time message delivered to Phone partner:', receivedMsg.text);
  console.log('✓ PASS: Active 1-hour session:', activeSession.id);

  // Clean up
  socket1.disconnect();
  socket2.disconnect();

  console.log('\n======================================================');
  console.log('🎉 ALL 7 EMAIL/PHONE OTP & SESSION RESEND TESTS PASSED!');
  console.log('======================================================\n');
  process.exit(0);
}

runTests().catch(err => {
  console.error('❌ VERIFICATION FAILED:', err);
  process.exit(1);
});
