document.getElementById('openDashboard').addEventListener('click', () => {
  chrome.tabs.create({ url: 'http://localhost:3000/dashboard' });
});

// Check if user is authenticated
chrome.storage.local.get(['supabase_token'], (result) => {
  const status = document.getElementById('status');
  if (result.supabase_token) {
    status.textContent = '✓ Connected to GigDesk';
    status.style.display = 'block';
    status.style.background = '#D1FAE5';
    status.style.color = '#059669';
  }
});
