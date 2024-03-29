var options = {}

var default_options = {
  own_tab_page: false,
  debug_log: false,
  bindings_without_modifier: false,
  experimental: false,
  preferred_input: "dialog"
}

// this makes sure options are set without loading the options page
// additionally this should avoid problems with the background service
// restarting for manifest 3 in the future
for (const key in default_options){
  chrome.storage.sync.get(key, function (setting) {
    if (Object.keys(setting).length == 0){
      var value = default_options[key];
      chrome.storage.sync.set({[key]: value});
      options[key] = value;
    } else
      options[key] = setting[key];
  });
}

console.log(options);

function onSuccess(){
}

function onError(error){
  console.log(`Error; ${error}`);
}

function logMsg(msg){
  if ('debug_log' in options && options['debug_log'] == true)
    console.log(`Emacs-keybinding: ${msg}`);
}

/* Eventually this should
 * - highlight matches as typed
 * - jump to the first match as it is developing
 * - jump to the second match when C-s is pressed again
 */
function handle_find(results){
  logMsg("Handling find, results: " + results.count);
  if (results.count > 0) {
    browser.find.highlightResults();
  }
}

function handleAction() {

}

browser.browserAction.onClicked.addListener(handleAction);

chrome.runtime.onMessage.addListener((msg, sender) => {

  if (msg.action != "log")
    logMsg(`action: ${msg.action}`);

  let current_tab = sender.tab;

  switch(msg.action) {
    case "log":
      logMsg(msg.msg);
      break;
    case "option":
      if (msg.key in options && options[msg.key] != msg.value){
        logMsg(`setting ${msg.key} to ${msg.value}`);
        options[msg.key] = msg.value;
      }
      break;
    case "next_tab":
      chrome.tabs.query({currentWindow: true}).then(
        (tabs) => {
          let next_tab = tabs[current_tab.index+1] || tabs[0];
          if (next_tab) {
            chrome.tabs.update(next_tab.id, {active:true})
              .then(() => chrome.tabs.sendMessage(next_tab.id, {action: "focus_window"}))
          }
        });
      break;
    case "previous_tab":
      chrome.tabs.query({currentWindow: true}).then(
        (tabs) => {
          let previous_tab = tabs[current_tab.index-1] || tabs[tabs.length-1];
          if (previous_tab){
            chrome.tabs.update(previous_tab.id, {active:true})
              .then(() => chrome.tabs.sendMessage(previous_tab.id, {action: "focus_window"}))
          }
        });
      break;
    case "new_tab":
      if ('own_tab_page' in options && options['own_tab_page'] == true){
        chrome.tabs.create({active:true,
                             url: "new-tab.html"})
      } else
        chrome.tabs.create({active:true})
      break;
    case "close_tab":
      chrome.tabs.remove(current_tab.id);
      break;
    case "new_window":
      if ('own_tab_page' in options && options['own_tab_page'] == true){
        chrome.windows.create({url: "new-tab.html"})
      } else
        chrome.windows.create();
      break;
    case "close_window":
      chrome.windows.remove(current_tab.windowId);
      break;
    case "options_page":
      var opening = chrome.runtime.openOptionsPage();
      opening.then(onSuccess, onError);
      break;
    case "search":
      browser.browserAction.setPopup({popup: "/popup/search.html"} );
      browser.browserAction.openPopup();
      break;
    case "find":
      if (msg.search.length > 0){
        logMsg(`Searching for: ${msg.search}`);
        browser.find.find(msg.search, { includeRectData: true }).then(handle_find);
      }
      break;
    default:
      logMsg(`Unknown action: ${msg.action}`);
  }
});
