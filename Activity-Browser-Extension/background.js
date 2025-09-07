// State management
const activeSessions = new Map();
const domainTotals = new Map();
let isTracking = false;
let updateInterval = null;
let activeTabId = null;
let lastSaveTime = Date.now();

// Constants
const UPDATE_INTERVAL = 10000; // 10 seconds
const SAVE_INTERVAL = 60000;   // 1 minute
const AGGREGATE_INTERVAL = 300000; // 5 minutes
let nextAggregateTime = Date.now() + AGGREGATE_INTERVAL;

// Initialize tracking state and restore previous sessions
chrome.storage.local.get({ 
  isTracking: false, 
  activeSessions: {}, 
  domainTotals: {},
  lastSaveTime: Date.now() 
}, (data) => {
  isTracking = data.isTracking;
  lastSaveTime = data.lastSaveTime;
  
  // Restore domain totals
  if (data.domainTotals) {
    Object.entries(data.domainTotals).forEach(([domain, total]) => {
      domainTotals.set(domain, total);
    });
  }
  
  // Restore active sessions
  if (isTracking && data.activeSessions) {
    Object.entries(data.activeSessions).forEach(([tabId, session]) => {
      activeSessions.set(parseInt(tabId), {
        url: session.url,
        title: session.title,
        domain: getDomain(session.url),
        startTime: session.startTime,
        lastUpdate: Date.now(),
        totalTime: session.totalTime || 0,
        isActive: false
      });
    });
  }
  
  if (isTracking) {
    // Initialize tracking for currently open tabs
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        if (!activeSessions.has(tab.id) && isValidUrl(tab.url)) {
          activeSessions.set(tab.id, createNewSession(tab));
        }
      });
      startPeriodicUpdate();
    });
  }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "startTracking") {
    isTracking = true;
    chrome.storage.local.set({ isTracking: true });
    
    // Start tracking all open tabs
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        if (isValidUrl(tab.url)) {
          activeSessions.set(tab.id, createNewSession(tab));
        }
      });
      saveSessionToStorage();
      startPeriodicUpdate();
    });
  } else if (message.action === "stopTracking") {
    isTracking = false;
    chrome.storage.local.set({ isTracking: false });
    stopPeriodicUpdate();
  }
});

// Track tab activation
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  if (!isTracking) return;
  
  const now = Date.now();
  const prevActiveTabId = activeTabId;
  activeTabId = activeInfo.tabId;

  // Update the previous active tab's timing
  if (prevActiveTabId && activeSessions.has(prevActiveTabId)) {
    const prevSession = activeSessions.get(prevActiveTabId);
    if (prevSession.isActive) {
      prevSession.isActive = false;
      prevSession.totalTime += now - prevSession.lastUpdate;
      prevSession.lastUpdate = now;
    }
  }

  // Update the new active tab
  chrome.tabs.get(activeTabId, (tab) => {
    if (!tab || !isValidUrl(tab.url)) return;
    
    let session;
    if (!activeSessions.has(tab.id)) {
      session = createNewSession(tab);
      activeSessions.set(tab.id, session);
    } else {
      session = activeSessions.get(tab.id);
    }
    
    session.isActive = true;
    session.lastUpdate = now;
    saveSessionToStorage();
  });
});

// Track URL changes
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!isTracking) return;
  
  if (changeInfo.status === "complete" && isValidUrl(tab.url)) {
    const now = Date.now();
    
    // If URL changed, save the old session and start a new one
    if (activeSessions.has(tabId) && activeSessions.get(tabId).url !== tab.url) {
      const oldSession = activeSessions.get(tabId);
      if (oldSession.isActive) {
        oldSession.totalTime += now - oldSession.lastUpdate;
      }
      saveActivityRecord(tabId, oldSession, now);
      
      const newSession = createNewSession(tab);
      newSession.isActive = tabId === activeTabId;
      activeSessions.set(tabId, newSession);
    } else if (!activeSessions.has(tabId)) {
      const newSession = createNewSession(tab);
      newSession.isActive = tabId === activeTabId;
      activeSessions.set(tabId, newSession);
    }
    saveSessionToStorage();
  } else if (changeInfo.title) {
    // Update title if it changed
    const session = activeSessions.get(tabId);
    if (session) {
      session.title = changeInfo.title;
      saveSessionToStorage();
    }
  }
});

// Track tab removal
chrome.tabs.onRemoved.addListener((tabId) => {
  if (!isTracking) return;
  
  const session = activeSessions.get(tabId);
  if (session) {
    saveActivityRecord(tabId, session, Date.now());
    activeSessions.delete(tabId);
    saveSessionToStorage();
  }
});

function isValidUrl(url) {
  return url && !url.startsWith('chrome://') && !url.startsWith('chrome-extension://');
}

function createNewSession(tab) {
  return {
    url: tab.url,
    title: tab.title,
    startTime: Date.now(),
    lastUpdate: Date.now(),
    totalTime: 0,
    isActive: false // Will be set to true if this is the active tab
  };
}

function startPeriodicUpdate() {
  if (updateInterval) {
    clearInterval(updateInterval);
  }
  
  updateInterval = setInterval(() => {
    const now = Date.now();
    
    // Update active session times
    activeSessions.forEach((session, tabId) => {
      if (session.isActive) {
        const timeSinceUpdate = now - session.lastUpdate;
        session.totalTime += timeSinceUpdate;
        session.lastUpdate = now;
        
        // Update domain totals
        const currentTotal = domainTotals.get(session.domain) || 0;
        domainTotals.set(session.domain, currentTotal + timeSinceUpdate);
      }
      
      // Verify tab still exists
      chrome.tabs.get(tabId, (tab) => {
        if (!chrome.runtime.lastError && tab) {
          if (tab.title !== session.title) {
            session.title = tab.title;
          }
        } else {
          // Tab no longer exists, update final totals and remove
          if (session.isActive) {
            const finalTime = now - session.lastUpdate;
            const domainTotal = domainTotals.get(session.domain) || 0;
            domainTotals.set(session.domain, domainTotal + finalTime);
          }
          activeSessions.delete(tabId);
          if (activeTabId === tabId) {
            activeTabId = null;
          }
        }
      });
    });
    
    // Save state periodically
    if (now - lastSaveTime >= SAVE_INTERVAL) {
      saveState();
      lastSaveTime = now;
    }
    
    // Aggregate data periodically
    if (now >= nextAggregateTime) {
      aggregateData();
      nextAggregateTime = now + AGGREGATE_INTERVAL;
    }
  }, UPDATE_INTERVAL);
}

function stopPeriodicUpdate() {
  if (updateInterval) {
    clearInterval(updateInterval);
    updateInterval = null;
  }
  
  // Save final state of all sessions
  activeSessions.forEach((session, tabId) => {
    saveActivityRecord(tabId, session, Date.now());
  });
  
  activeSessions.clear();
  saveSessionToStorage();
}

function clearCurrentSession() {
  currentTabId = null;
  currentUrl = null;
  startTime = null;
  lastUpdateTime = null;
  chrome.storage.local.remove('lastSession');
}

function handleTabSwitch(tabId) {
  const endTime = Date.now();

  if (currentUrl && startTime) {
    saveActivity(currentUrl, currentTabId, startTime, endTime);
  }

  chrome.tabs.get(tabId, (tab) => {
    if (tab && tab.url) {
      // Skip recording if it's a new tab or extensions page
      if (tab.url === "chrome://newtab/" || tab.url.startsWith("chrome://extensions")) {
        clearCurrentSession();
        return;
      }
      
      currentTabId = tabId;
      currentUrl = tab.url;
      startTime = Date.now();
      lastUpdateTime = null; // Reset update time for new tab

      // Save initial state of new session
      chrome.storage.local.set({
        lastSession: {
          tabId: currentTabId,
          url: currentUrl,
          startTime: startTime,
          lastUpdateTime: null
        }
      });
    }
  });
}

function saveState() {
  const sessionsObj = {};
  activeSessions.forEach((session, tabId) => {
    sessionsObj[tabId] = session;
  });
  
  const domainTotalsObj = {};
  domainTotals.forEach((total, domain) => {
    domainTotalsObj[domain] = total;
  });
  
  chrome.storage.local.set({
    activeSessions: sessionsObj,
    domainTotals: domainTotalsObj,
    activeTabId: activeTabId,
    lastSaveTime: Date.now()
  });
}

function aggregateData() {
  chrome.storage.local.get({ dailyStats: {}, weeklyStats: {} }, (data) => {
    const today = new Date().toISOString().split('T')[0];
    const thisWeek = getWeekNumber(new Date());
    
    // Update daily statistics
    const dailyStats = data.dailyStats || {};
    dailyStats[today] = dailyStats[today] || {};
    
    domainTotals.forEach((total, domain) => {
      dailyStats[today][domain] = (dailyStats[today][domain] || 0) + total;
    });
    
    // Update weekly statistics
    const weeklyStats = data.weeklyStats || {};
    weeklyStats[thisWeek] = weeklyStats[thisWeek] || {};
    
    domainTotals.forEach((total, domain) => {
      weeklyStats[thisWeek][domain] = (weeklyStats[thisWeek][domain] || 0) + total;
    });
    
    chrome.storage.local.set({ dailyStats, weeklyStats });
  });
}

function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
  return Math.ceil((((d - yearStart) / 86400000) + 1)/7);
}

function getDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (e) {
    return url;
  }
}

function saveActivityRecord(tabId, session, endTime) {
  chrome.storage.local.get({ activity: [] }, (data) => {
    const activity = data.activity;
    const duration = endTime - session.startTime;
    
    // Try to merge with last activity if it's the same URL and recent
    const lastActivity = activity[activity.length - 1];
    if (lastActivity && 
        lastActivity.url === session.url && 
        new Date(lastActivity.end).getTime() > session.startTime - 300000) { // 5 minute gap
      // Update existing record
      lastActivity.end = new Date(endTime).toLocaleString();
      lastActivity.totalTime += duration;
      lastActivity.duration = formatDuration(lastActivity.totalTime);
    } else {
      // Create new record
      activity.push({
        url: session.url,
        title: session.title,
        start: new Date(session.startTime).toLocaleString(),
        end: new Date(endTime).toLocaleString(),
        totalTime: session.totalTime + (endTime - session.lastUpdate),
        duration: formatDuration(session.totalTime + (endTime - session.lastUpdate))
      });
    }
    
    chrome.storage.local.set({ activity });
  });
}

// Helper Functions for Advanced Tracking
function isValidUrl(url) {
  return url && !url.startsWith('chrome://') && !url.startsWith('chrome-extension://') && !url.startsWith('moz-extension://');
}

function getDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (e) {
    return url;
  }
}

function trackTabSwitchBehavior(fromTabId, toTabId) {
  const pattern = userBehaviorPatterns.get('tabSwitching') || {
    totalSwitches: 0,
    averageTimeBeforeSwitch: 0,
    commonPatterns: new Map(),
    rapidSwitchCount: 0
  };
  
  pattern.totalSwitches++;
  
  if (fromTabId && toTabId) {
    const switchKey = `${fromTabId}-${toTabId}`;
    const count = pattern.commonPatterns.get(switchKey) || 0;
    pattern.commonPatterns.set(switchKey, count + 1);
  }
  
  userBehaviorPatterns.set('tabSwitching', pattern);
}

function checkIdleStatus() {
  const now = Date.now();
  const idleThreshold = CONFIG.IDLE_THRESHOLD;
  
  if (now - lastActivityTime > idleThreshold) {
    // Mark active sessions as idle
    activeSessions.forEach((session, tabId) => {
      if (session.isActive && !session.isIdle) {
        session.isIdle = true;
        session.idleStartTime = now;
      }
    });
  } else {
    // Resume from idle
    activeSessions.forEach((session, tabId) => {
      if (session.isIdle) {
        session.isIdle = false;
        if (session.idleStartTime) {
          session.idleTime += now - session.idleStartTime;
        }
      }
    });
  }
}

function analyzeProductivityPatterns() {
  const now = Date.now();
  const today = new Date().toISOString().split('T')[0];
  
  let productiveTime = 0;
  let distractingTime = 0;
  let totalFocusScore = 0;
  let sessionCount = 0;
  
  activeSessions.forEach((session) => {
    if (session.category === 'productive' || session.category === 'educational') {
      productiveTime += session.totalTime;
    } else if (session.category === 'social' || session.category === 'entertainment') {
      distractingTime += session.totalTime;
    }
    
    totalFocusScore += session.focusScore;
    sessionCount++;
  });
  
  const metrics = {
    date: today,
    productiveTime,
    distractingTime,
    averageFocusScore: sessionCount > 0 ? totalFocusScore / sessionCount : 0,
    productivityRatio: (productiveTime + distractingTime) > 0 ? productiveTime / (productiveTime + distractingTime) : 0,
    totalSessions: sessionCount,
    timestamp: now
  };
  
  productivityMetrics.set(today, metrics);
}

function saveAdvancedState() {
  const stateData = {
    activeSessions: Object.fromEntries(activeSessions),
    domainAnalytics: Object.fromEntries(domainAnalytics),
    categoryStats: Object.fromEntries(categoryStats),
    productivityMetrics: Object.fromEntries(productivityMetrics),
    timeBlocks: Object.fromEntries(timeBlocks),
    userBehaviorPatterns: Object.fromEntries(userBehaviorPatterns),
    dailyGoals: Object.fromEntries(dailyGoals),
    activeTabId,
    activeWindowId,
    lastActivityTime,
    sessionStartTime
  };
  
  chrome.storage.local.set(stateData);
}

function calculateAdvancedAnalytics() {
  // Real-time analytics calculation
  const now = Date.now();
  
  // Update category percentages
  let totalTime = 0;
  categoryStats.forEach((stats) => {
    totalTime += stats.totalTime;
  });
  
  categoryStats.forEach((stats, category) => {
    stats.percentage = totalTime > 0 ? (stats.totalTime / totalTime) * 100 : 0;
  });
  
  // Generate insights and patterns
  generateProductivityInsights();
  updateBehaviorPatterns();
}

function generateProductivityInsights() {
  const insights = {
    mostProductiveHour: 0,
    leastProductiveHour: 0,
    focusSessionCount: 0,
    distractionScore: 0,
    recommendedBreakTime: Date.now() + CONFIG.BREAK_REMINDER
  };
  
  // Calculate insights from time blocks and sessions
  activeSessions.forEach((session) => {
    if (session.totalTime >= CONFIG.FOCUS_THRESHOLD) {
      insights.focusSessionCount++;
    }
  });
  
  // Store insights
  chrome.storage.local.set({ productivityInsights: insights });
}

function updateBehaviorPatterns() {
  const now = Date.now();
  const currentHour = new Date().getHours();
  
  const patterns = userBehaviorPatterns.get('hourlyActivity') || new Array(24).fill(0);
  
  activeSessions.forEach((session) => {
    if (session.isActive) {
      patterns[currentHour] += CONFIG.UPDATE_INTERVAL;
    }
  });
  
  userBehaviorPatterns.set('hourlyActivity', patterns);
}
