
document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.local.get(["urls"], (result) => {
    const storedUrls = result.urls;
    const urlList = document.getElementById("urlList");
    urlList.innerHTML = "";
    if (!storedUrls || Object.keys(storedUrls).length === 0) {
      urlList.innerHTML = '<li style="text-align:center;color:#aaa;">No data tracked yet.</li>';
      return;
    }
    const isRenderable = (u, info) => !/^(chrome|chrome-extension|edge):\/\//.test(u) && u !== 'about:blank' && (info.totalTime || 0) >= 30000;
    for (const url in storedUrls) {
      const urlInfo = storedUrls[url];
      if (!isRenderable(url, urlInfo)) continue;
      // Convert ms to minutes, rounded to 2 decimals
      const minutes = (urlInfo.totalTime / 1000 / 60).toFixed(2);
      const li = document.createElement("li");
      li.className = "list-group-item card-item";
      li.innerHTML = `
        <div class="card-content">
          <div class="url-title">${urlInfo.title || 'Untitled tab'}</div>
          <div class="url-subtext">${url}</div>
          <div class="time-tracked"><span class="minutes">${minutes}</span> min</div>
        </div>
      `;
      urlList.appendChild(li);
    }
  });

  // Start/Stop controls
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const statusEl = document.getElementById('status');
  const setStatus = (enabled) => { statusEl.textContent = enabled ? 'Tracking: ON' : 'Tracking: OFF'; };
  chrome.storage.local.get(['trackingEnabled'], (res) => setStatus(res.trackingEnabled !== false));
  startBtn.addEventListener('click', () => { chrome.storage.local.set({ trackingEnabled: true }, () => setStatus(true)); });
  stopBtn.addEventListener('click', () => { chrome.storage.local.set({ trackingEnabled: false, currentTabInfo: null }, () => setStatus(false)); });
});




