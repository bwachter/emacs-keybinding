var options = {}

var default_options = {
  own_tab_page: true,
  debug_log: false,
  debug_level_keybinding: 1,
  debug_level_backend: 1,
  debug_level_content: 1,
  debug_level_search_engines: 1,
  debug_level_top_sites: 1,
  debug_level_history: 1,
  debug_level_theme: 1,
  bindings_without_modifier: false,
  experimental: false,
  preferred_input: "dialog",
  nt_url_autosubmit: true,
  nt_history_age_days: 30,
  nt_history_max_items: 100,
  nt_hide_intro: false,
  nt_hide_github: false,
  nt_hide_search_engines: false,
  nt_hide_input_label: false,
  nt_hide_title: true,
  nt_hide_url_instructions: false,
  nt_hide_top_sites: false,
  nt_top_num: 10,
  nt_top_pinned: false,
  nt_top_blocked: false,
  nt_top_newtab: false,
  nt_top_searchshortcuts: false,
  nt_top_nofavicons: false
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

// return true if the message was logged, false otherwise
function logMsg(msg){
  if ('debug_log' in options && options['debug_log'] == true){
    const msgType = typeof(msg);
    if (msgType == "string"){
      console.log(`Emacs-keybinding: ${msg}`);
      return true;
    } else if (msgType == "object"){
      const keyName = 'debug_level_' + msg['subsystem'];
      if (keyName in options){
        var msgLevel = 3; // set to info as default
        if ('level' in msg){
          if (isNaN(msg.level)){
            if (msg.level == "error")
              msgLevel = 1;
            else if (msg.level == "warning")
              msgLevel = 2;
            else if (msg.level == "info")
              msgLevel = 3;
            else if (msg.level == "debug")
              msgLevel = 4
          } else
            msgLevel = msg.level;
        }

        debugLevel = options[keyName];

        if (msgLevel <= debugLevel){
          console.log(`Emacs-keybinding[${msg.subsystem}:${msg.level}] ${msg.message}`);
          return true;
        }
      } else {
        console.log(`Emacs-keybinding: Log subsystem missing: ${msg.subsystem}`);
      }
    } else {
      console.log(`Emacs-keybinding: Unhandled message type ${msgType}`);
    }
  }
  return false
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

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {

  if (msg.action != "log")
    logMsg({'subsystem': 'backend', 'message': msg.action});

  let current_tab = sender.tab;

  switch(msg.action) {
    case "log":
      var sent = logMsg(msg.msg);
      sendResponse({ response: sent });
      break;
    case "option":
      if (msg.key in options && options[msg.key] != msg.value){
        logMsg(`setting ${msg.key} to ${msg.value}`);
        options[msg.key] = msg.value;
        sendResponse(true);
      } else
        sendResponse(false);
      break;
    case "options":
      sendResponse({ response: {
        'current_options': options,
        'default_options': default_options
      }});
      break;
    case "next_tab":
      chrome.tabs.query({currentWindow: true}).then(
        (tabs) => {
          let next_tab = tabs[current_tab.index+1] || tabs[0];
          if (next_tab) {
            chrome.tabs.update(next_tab.id, {active:true})
              .then(() => chrome.tabs.sendMessage(next_tab.id, {action: "focus_window"}));
            sendResponse(true);
          } else
            sendResponse(false);
        });
      break;
    case "previous_tab":
      chrome.tabs.query({currentWindow: true}).then(
        (tabs) => {
          let previous_tab = tabs[current_tab.index-1] || tabs[tabs.length-1];
          if (previous_tab){
            chrome.tabs.update(previous_tab.id, {active:true})
              .then(() => chrome.tabs.sendMessage(previous_tab.id, {action: "focus_window"}));
            sendResponse(true);
          } else
            sendResponse(false);
        });
      break;
    case "new_tab":
      if ('own_tab_page' in options && options['own_tab_page'] == true){
        chrome.tabs.create({active:true,
                            url: "new-tab.html"})
      } else
        chrome.tabs.create({active:true})
      sendResponse(true);
      break;
    case "close_tab":
      // TODO: this triggers a promise rejected error
      sendResponse(true);
      chrome.tabs.remove(current_tab.id);
      break;
    case "new_window":
      if ('own_tab_page' in options && options['own_tab_page'] == true){
        chrome.windows.create({url: "new-tab.html"})
      } else
        chrome.windows.create();
      sendResponse(true);
      break;
    case "close_window":
      chrome.windows.remove(current_tab.windowId);
      sendResponse(true);
      break;
    case "options_page":
      var opening = chrome.runtime.openOptionsPage();
      opening.then(onSuccess, onError);
      sendResponse(true);
      break;
    case "search":
      browser.browserAction.setPopup({popup: "/popup/search.html"} );
      browser.browserAction.openPopup();
      sendResponse(true);
      break;
    case "find":
      if (msg.search.length > 0){
        logMsg(`Searching for: ${msg.search}`);
        browser.find.find(msg.search, { includeRectData: true }).then(handle_find);
        sendResponse(true);
      } else
        sendResponse(false);
      break;
    default:
      logMsg(`Unknown action: ${msg.action}`);
      sendResponse(false);
  }
});
