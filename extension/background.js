// Background service worker for GigDesk Quick Invoice extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('GigDesk Quick Invoice extension installed');
});

// Handle messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'checkAuth') {
    chrome.storage.local.get(['supabase_token'], (result) => {
      sendResponse({ authenticated: !!result.supabase_token });
    });
    return true;
  }
  
  if (request.action === 'copyToClipboard') {
    navigator.clipboard.writeText(request.text).then(() => {
      sendResponse({ success: true });
    }).catch(err => {
      sendResponse({ success: false, error: err.message });
    });
    return true;
  }
});
