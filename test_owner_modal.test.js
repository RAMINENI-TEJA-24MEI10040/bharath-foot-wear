const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

console.log('🧪 Starting Expanded Unit Tests for BHARATH FOOT WEAR...');

const htmlContent = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

const dom = new JSDOM(htmlContent, {
  runScripts: 'dangerously',
  resources: 'usable',
  url: 'http://localhost:3000/'
});

const { window } = dom;
const { document } = window;

// Helper assertion
function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASS: ${message}`);
  }
}

// Wait for DOM content loaded
window.addEventListener('DOMContentLoaded', async () => {
  console.log('📌 DOMContentLoaded fired.');

  // Test 1: Verify Owner Modal initial state is hidden
  const modal = document.getElementById('owner-modal');
  assert(modal !== null, 'Owner modal element #owner-modal exists in DOM');
  assert(!modal.classList.contains('active'), 'Owner modal is initially hidden (not active)');

  // Test 2: Verify #btn-owner-portal exists
  const ownerBtn = document.getElementById('btn-owner-portal');
  assert(ownerBtn !== null, 'Owner Portal button #btn-owner-portal exists in DOM');

  // Test 3: Click Owner Portal button
  console.log('👆 Simulating click on #btn-owner-portal...');
  ownerBtn.click();

  // Test 4: Verify modal opens after click
  assert(modal.classList.contains('active'), 'Owner modal has class "active" after clicking button');

  // Test 5: Verify PIN & Mobile hint text is REMOVED from login view
  const loginView = document.getElementById('owner-login-view');
  assert(loginView.style.display !== 'none', 'Owner login view is visible');
  assert(!loginView.textContent.includes('Default Security PIN: 2002'), 'PIN hint text "Default Security PIN: 2002" is completely removed');
  assert(!loginView.textContent.includes('Phone 9059613235'), 'Phone number hint text "Phone 9059613235" is completely removed');

  // Test 6: Verify PIN input field exists with updated placeholder
  const pinInput = document.getElementById('owner-pin-input');
  assert(pinInput !== null, 'Owner PIN input field exists');
  assert(pinInput.getAttribute('placeholder') === 'Enter Security PIN', 'PIN input placeholder is "Enter Security PIN"');

  // Test 7: Verify verifyOwnerPIN() with PIN 2002
  console.log('🔑 Testing verifyOwnerPIN...');
  pinInput.value = '2002';
  await window.verifyOwnerPIN();

  // Verify dashboard view displays after authentication
  const dashboardView = document.getElementById('owner-dashboard-view');
  assert(dashboardView.style.display === 'block', 'Owner dashboard view opens after PIN verification');

  // Test 8: Verify section title in bill form is "Item Details"
  const itemDetailsHeading = document.querySelector('#portal-tab-create-bill h4');
  assert(itemDetailsHeading !== null, 'Item section header exists');
  assert(itemDetailsHeading.textContent.trim() === 'Item Details', 'Section header text is exactly "Item Details"');

  // Test 9: Verify default invoice number input field exists, is readonly, and formatted correctly
  const invNoInput = document.getElementById('bill-inv-no');
  assert(invNoInput !== null, 'Invoice number input #bill-inv-no exists');
  assert(invNoInput.readOnly, 'Invoice number input is readonly (auto-populated series)');
  assert(invNoInput.value.startsWith('BFW-'), 'Invoice number series format starts with BFW-');

  // Test 10: Verify 6-column item table header & row cell alignment
  const tableHeaders = document.querySelectorAll('.bill-items-table th');
  assert(tableHeaders.length === 6, 'Bill items table header has exactly 6 columns');
  const tableCells = document.querySelectorAll('#bill-items-body tr:first-child td');
  assert(tableCells.length === 6, 'Bill items single row has exactly 6 cells (matching header)');

  // Test 11: Verify "+ Add Another Item" button is removed for clean single item selection
  const addItemBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Add Another Item'));
  assert(!addItemBtn, 'Manual "+ Add Another Item" button is removed for single-click item selection');

  // Test 12: Verify category descriptions are hidden across all category cards
  const categoryDescs = document.querySelectorAll('.category-card-desc');
  assert(categoryDescs.length === 0, 'Category description paragraphs are removed from grid');

  // Test 13: Test closeOwnerModal()
  console.log('🔒 Testing closeOwnerModal()...');
  window.closeOwnerModal();
  assert(!modal.classList.contains('active'), 'Owner modal closes cleanly');

  console.log('\n🎉 ALL 13 UNIT TESTS PASSED SUCCESSFULLY! 100% VERIFIED!');
  process.exit(0);
});

