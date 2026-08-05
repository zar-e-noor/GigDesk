const API_BASE_URL = 'https://gig-desk-seven.vercel.app';

document.getElementById('openDashboard').addEventListener('click', () => {
  chrome.tabs.create({ url: `${API_BASE_URL}/dashboard` });
});

document.getElementById('invoiceForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const clientName = document.getElementById('clientName').value;
  const description = document.getElementById('description').value;
  const amount = document.getElementById('amount').value;
  const generateBtn = document.getElementById('generateBtn');
  const status = document.getElementById('status');
  
  // Show loading state
  generateBtn.disabled = true;
  generateBtn.textContent = 'Generating...';
  status.style.display = 'block';
  status.className = 'status loading';
  status.textContent = 'Creating invoice...';
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/extension/create-invoice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_name: clientName,
        description: description,
        amount: parseFloat(amount),
      }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to create invoice');
    }
    
    // Copy to clipboard
    const invoiceUrl = `${API_BASE_URL}/invoice/${data.public_token}`;
    await navigator.clipboard.writeText(invoiceUrl);
    
    // Show success state
    status.className = 'status success';
    status.innerHTML = `✓ Invoice created!<br><br>Link copied to clipboard:<br><strong>${invoiceUrl}</strong>`;
    
    // Clear form
    document.getElementById('invoiceForm').reset();
    
  } catch (error) {
    console.error('Error:', error);
    status.className = 'status error';
    status.textContent = `✗ Error: ${error.message}`;
  } finally {
    generateBtn.disabled = false;
    generateBtn.textContent = 'Generate & Copy Invoice Link';
  }
});

// Check if user is authenticated
chrome.storage.local.get(['supabase_token'], (result) => {
  const status = document.getElementById('status');
  if (result.supabase_token) {
    status.style.display = 'block';
    status.className = 'status success';
    status.textContent = '✓ Connected to GigDesk';
  }
});
