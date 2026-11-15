const button = document.querySelector('#save');
const status = document.querySelector('#status');
button.addEventListener('click', async () => {
  button.disabled = true;
  try {
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
    if (!tab?.id || !/^https:\/\/web\.telegram\.org\//.test(tab.url || '')) throw new Error('Open https://web.telegram.org and play a video first.');
    const [injection] = await chrome.scripting.executeScript({target: {tabId: tab.id}, world: 'MAIN', files: ['content.js']});
    const result = injection?.result;
    if (!result?.ok) throw new Error(result?.error || 'Could not start the download.');
    status.textContent = 'Download started. Progress appears on the Telegram tab. You can close this popup.';
  } catch (error) { status.textContent = error.message; }
  finally { button.disabled = false; }
});
