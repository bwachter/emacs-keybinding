function onSuccess(){
}

function onError(error){
  console.log(`Error; ${error}`);
}

browser.runtime.onMessage.addListener((msg, sender) => {

  console.log(`action: ${msg.action}`);

  let current_tab = sender.tab;

  switch(msg.action) {
    case "next_tab":
      browser.tabs.query({currentWindow: true}).then(
        (tabs) => {
          let next_tab = tabs[current_tab.index+1] || tabs[0];
          if (next_tab) {
            browser.tabs.update(next_tab.id, {active:true})
              .then(() => browser.tabs.sendMessage(next_tab.id, {action: "focus_window"}))
          }
        });
      break;
    case "previous_tab":
      browser.tabs.query({currentWindow: true}).then(
        (tabs) => {
          let previous_tab = tabs[current_tab.index-1] || tabs[tabs.length-1];
          if (previous_tab){
            browser.tabs.update(previous_tab.id, {active:true})
              .then(() => browser.tabs.sendMessage(previous_tab.id, {action: "focus_window"}))
          }
        });
      break;
    case "new_tab":
      browser.tabs.create({active:true})
      break;
    case "close_tab":
      browser.tabs.remove(current_tab.id);
      break;
    case "options_page":
      var opening = browser.runtime.openOptionsPage();
      opening.then(onSuccess, onError);
      break;
    default:
      console.log(`Unknown action: ${msg.action}`);
  }
});
