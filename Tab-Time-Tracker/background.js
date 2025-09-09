let urls = {};

// Initialize urls from storage when extension loads
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['urls'], (result) => {
    urls = result.urls || {};
    saveUrlsToStorage().then(() => {
      console.log("Extension installed. URLs initialized.");
    });
  });
});

chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.get(['urls'], (result) => {
    urls = result.urls || {};
    saveUrlsToStorage().then(() => {
      console.log(
        "Extension loaded during browser startup. URLs initialized."
      );
    });
  });
});

const saveUrlsToStorage = () => {
  return new Promise((resolve) => {
    chrome.storage.local.set({ urls }, () => {
      console.log("urls object stored in local storage");
      resolve(); // Resolve the promise to indicate completion
    });
  });
};

const initializeTab = (url, tabId, title) => {
  if (!trackingEnabled) return; // hard stop
  console.log("initialization for : ", url);

  const newTab = {
    startTime: Date.now(),
    totalTime: 0,
    tabId: tabId,
    title: title || url,
  };
  urls[url] = newTab;

  saveUrlsToStorage().then(() => {
    console.log("after updating the object ", urls);
  });
};

const saveCurrentTabInfo = (currentTabInfo) => {
  if (!trackingEnabled) return Promise.resolve(); // hard stop
  return new Promise((resolve) => {
    // Store the current tab information
    chrome.storage.local.set({ currentTabInfo }, () => {
      console.log("currentTabInfo object stored in local storage");
      resolve();
    });
  });
};

let activeTabId;
let activeTabUrl;
let trackingEnabled = true;

// Initialize tracking flag from storage
chrome.storage.local.get(["trackingEnabled"], (res) => {
  if (typeof res.trackingEnabled === "boolean") {
    trackingEnabled = res.trackingEnabled;
  } else {
    chrome.storage.local.set({ trackingEnabled });
  }
});

// Keep local flag in sync and clear timer when turned OFF
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.trackingEnabled) {
    trackingEnabled = changes.trackingEnabled.newValue !== false;
    if (!trackingEnabled) {
      chrome.storage.local.set({ currentTabInfo: null });
    }
  }
});

const isTrackable = (url) => {
  if (!url) return false;
  if (/^(chrome|chrome-extension|edge):\/\//.test(url)) return false;
  if (url === 'about:blank') return false;
  return true;
};

const getCurrentTab = () => {
  chrome.tabs.query({ active: true, currentWindow: true }, ([currentTab]) => {
    if (!trackingEnabled) return;
    activeTabUrl = currentTab.url;
    activeTabId = currentTab.id;

    console.log(`URL of active tab: ${activeTabUrl}`);
    console.log(`ID of active tab: ${activeTabId}`);
  });

  return activeTabUrl;
};
getCurrentTab();

//----------------------------------
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!trackingEnabled) return;
  // Update stored title when the tab title changes (e.g., SPA updates)
  if (changeInfo.title && isTrackable(tab && tab.url)) {
    const updatedUrl = tab.url;
    chrome.storage.local.get(['urls'], (result) => {
      if (!trackingEnabled) return;
      urls = result.urls || {};
      if (urls[updatedUrl]) {
        urls[updatedUrl].title = changeInfo.title;
        saveUrlsToStorage();
      }
    });
  }

  if (changeInfo.status === "complete") {
    if (!trackingEnabled) return;
    const newTabUrl = tab.url;
    const newTabId = tab.id;
    const newTabTitle = tab.title;

    if (!isTrackable(newTabUrl)) {
      return; // skip internal pages like chrome://, extensions, new tab
    }

    console.log("\nTab loaded:", newTabUrl);

    // Ensure urls is initialized from storage before using it
    chrome.storage.local.get(['urls', 'currentTabInfo'], (result) => {
      if (!trackingEnabled) return;
      urls = result.urls || {};
      const previous = result.currentTabInfo;

      // If navigating within the same tab to a new URL, finalize the previous URL's time
      if (previous && previous.url && previous.url !== newTabUrl && isTrackable(previous.url)) {
        if (!urls[previous.url]) {
          initializeTab(previous.url, previous.tabId, previous.title || previous.url);
        }
        const elapsed = Date.now() - (previous.startTime || Date.now());
        if (elapsed >= 30000) {
          urls[previous.url].totalTime += elapsed;
        }
      }

      // Ensure there is a record for the new URL and keep an up-to-date title
      if (!urls[newTabUrl]) {
        console.log("\n\nNew tab created and not existing:\nURL:", tab, "\n\n");
        initializeTab(newTabUrl, newTabId, newTabTitle);
      } else if (!urls[newTabUrl].title && newTabTitle) {
        urls[newTabUrl].title = newTabTitle;
      }

      const newTabInfo = {
        url: newTabUrl,
        tabId: newTabId,
        startTime: Date.now(),
        title: newTabTitle,
      };

      if (!trackingEnabled) return;
      saveCurrentTabInfo(newTabInfo).then(() => {
        console.log("New tab entered and CurrentInfoObj Updated");
        saveUrlsToStorage();
      });
    });
  }
});


chrome.tabs.onActivated.addListener((activeInfo) => {
  if (!trackingEnabled) return;
  // chrome.tabs.sendMessage(activeInfo.tabId, { action: "tabSwitched" });
  console.log("Tab Switched");

  const activeTabId = activeInfo.tabId;

  // Retrieve the information of the previously active tab
  chrome.storage.local.get(["currentTabInfo"], (result) => {
    if (!trackingEnabled) return;
    const previousTabInfo = result.currentTabInfo;

    if (previousTabInfo) {
      console.log("Fetched Info : \n", previousTabInfo);
      const prevTabId = previousTabInfo.tabId;
      const prevTabUrl = previousTabInfo.url;

      // Update the time spent for the previous tab (only if trackable)
      chrome.storage.local.get(["urls"], (result) => {
        if (!trackingEnabled) return;
        urls = result.urls;

        console.log("checking if the tab alr exits : ", urls);

        if (!isTrackable(prevTabUrl)) {
          // do not track previous internal pages
          return;
        }

        if (!urls || !urls[prevTabUrl]) {
          // dikkat isi line mein h :
          console.log("new tab found");
          console.log("And current URLs object : ", urls);
          chrome.tabs.get(prevTabId, (prevTab) => {
            const prevTitle = (prevTab && prevTab.title) ? prevTab.title : prevTabUrl;
            initializeTab(prevTabUrl, prevTabId, prevTitle);
          });
        } else if (urls[prevTabUrl] && !urls[prevTabUrl].title) {
          chrome.tabs.get(prevTabId, (prevTab) => {
            if (prevTab && prevTab.title) {
              urls[prevTabUrl].title = prevTab.title;
              saveUrlsToStorage();
            }
          });
        }

  const timeSpent = Date.now() - previousTabInfo.startTime;
  // Only record if at least 30 seconds
  if (timeSpent >= 30000) {
    urls[prevTabUrl].totalTime += timeSpent; // ms
  }
  urls[prevTabUrl].startTime = Date.now();

        if (!trackingEnabled) return;
        saveUrlsToStorage().then(() => {
          console.log("Urls saved after updating for existing tab");
        });
      });
    }
  });

  // Get information about the currently active tab
  chrome.tabs.get(activeTabId, (activeTab) => {
    if (!trackingEnabled) return;
    const currentTabInfo = {
      url: activeTab.url,
      tabId: activeTabId,
      startTime: Date.now(),
    };

    // Store the current tab information
    saveCurrentTabInfo(currentTabInfo).then(()=>{
      console.log("New tab entered and CurrentInfoObj Updated") ;
    })
  });
});



