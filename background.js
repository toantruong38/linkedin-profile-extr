const regexp = /\/in\/.*\//gm;

chrome.tabs.onUpdated.addListener((tabId, changes, tab) => {
  console.log(tabId, changes);
});
chrome.webNavigation.onCompleted.addListener(
  function (details) {
    if (details.url.match(regexp).length === 0) {
      return;
    }

    // console.log(details);

    // chrome.tabs.sendMessage(details.tabId, { cmd: "fetchProfile" });

    // chrome.tabs.sendMessage(details.tabId, { cmd: "init" });
  },
  {
    url: [{ urlContains: "linkedin.com/in/" }],
  }
);
