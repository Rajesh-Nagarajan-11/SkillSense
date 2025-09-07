document.addEventListener("DOMContentLoaded", () => {
  const log = document.getElementById("log");
  const clearBtn = document.getElementById("clear");
  const startBtn = document.getElementById("startTracking");
  const stopBtn = document.getElementById("stopTracking");
  const statusIndicator = document.getElementById("statusIndicator");
  const totalSitesElement = document.getElementById("totalSites");
  const totalTimeElement = document.getElementById("totalTime");
  const avgTimeElement = document.getElementById("avgTime");

  // Initialize and update tracking status
  function updateTrackingStatus() {
    chrome.storage.local.get({ isTracking: false }, (data) => {
      if (data.isTracking) {
        statusIndicator.innerHTML = '<span>Currently Tracking</span>';
        statusIndicator.className = "status tracking";
        startBtn.disabled = true;
        stopBtn.disabled = false;
      } else {
        statusIndicator.innerHTML = '<span>Tracking Paused</span>';
        statusIndicator.className = "status paused";
        startBtn.disabled = false;
        stopBtn.disabled = true;
      }
    });
  }

  // Calculate and update statistics
  function updateStatistics(activities) {
    const uniqueSites = new Set(activities.map(a => new URL(a.url).hostname));
    const totalSeconds = activities.reduce((acc, curr) => {
      const duration = parseInt(curr.duration);
      return acc + (isNaN(duration) ? 0 : duration);
    }, 0);
    
    const avgSeconds = activities.length ? Math.round(totalSeconds / activities.length) : 0;
    const totalMinutes = Math.round(totalSeconds / 60);
    
    totalSitesElement.textContent = uniqueSites.size;
    totalTimeElement.textContent = totalMinutes + 'm';
    avgTimeElement.textContent = avgSeconds + 's';
  }

  // Load and display activity log
  function updateActivityLog() {
    chrome.storage.local.get({ activity: [] }, (data) => {
      const sortedActivity = data.activity.sort((a, b) => new Date(b.start) - new Date(a.start));
      
      if (sortedActivity.length === 0) {
        log.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">📊</div>
            <p>No activity recorded yet</p>
          </div>
        `;
        return;
      }

      log.innerHTML = "";
      updateStatistics(sortedActivity);
      
      sortedActivity.forEach((entry) => {
        const entryDiv = document.createElement("div");
        entryDiv.className = "entry";
        
        entryDiv.innerHTML = `
          <div class="entry-title">${entry.title}</div>
          <div class="entry-url">${entry.url}</div>
          <div class="entry-meta">
            <div class="entry-time">
              <span>${new Date(entry.start).toLocaleTimeString()}</span> - 
              <span>${new Date(entry.end).toLocaleTimeString()}</span>
            </div>
            <div class="entry-duration">${entry.duration}</div>
          </div>
        `;
        log.appendChild(entryDiv);
      });
    });
  }

  // Event Listeners
  startBtn.addEventListener("click", () => {
    chrome.storage.local.set({ isTracking: true }, () => {
      chrome.runtime.sendMessage({ action: "startTracking" });
      updateTrackingStatus();
    });
  });

  stopBtn.addEventListener("click", () => {
    chrome.storage.local.set({ isTracking: false }, () => {
      chrome.runtime.sendMessage({ action: "stopTracking" });
      updateTrackingStatus();
    });
  });

  clearBtn.addEventListener("click", () => {
    chrome.storage.local.set({ activity: [] }, () => {
      updateActivityLog();
    });
  });

  // Listen for activity updates
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.activity) {
      updateActivityLog();
    }
    if (changes.isTracking) {
      updateTrackingStatus();
    }
  });

  // Initial load
  updateTrackingStatus();
  updateActivityLog();
});
