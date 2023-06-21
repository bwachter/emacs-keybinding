var options = {}

function onSuccess(){
}

function onError(error){
  console.log(`Error; ${error}`);
}

function logMsg(msg){
  if ('debug_log' in options && options['debug_log'] == true)
    console.log(`Emacs-keybinding: ${msg}`);
}

chrome.runtime.onMessage.addListener((msg, sender) => {

  logMsg(`action: ${msg.action}`);
  let current_tab = sender.tab;

  switch(msg.action) {
    case "log":
      logMsg(msg.msg);
      break;
    case "option":
      logMsg(`setting ${msg.key} to ${msg.value}`);
      options[msg.key] = msg.value;
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
    default:
      logMsg(`Unknown action: ${msg.action}`);
  }
});
