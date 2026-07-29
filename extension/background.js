// Background service worker for GigDesk extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('GigDesk extension installed');
});

// Handle messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'checkAuth') {
    chrome.storage.local.get(['supabase_token'], (result) => {
      sendResponse({ authenticated: !!result.supabase_token });
    });
    return true;
  }
});
