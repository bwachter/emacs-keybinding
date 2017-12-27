const get_current_tab = (tabs) => {
  for (let tab of tabs)
    if (tab.active)
      return tab;
  return null;
}

browser.runtime.onConnect.addListener((port) => {
  port.onMessage.addListener((msg) => {

    console.log(`action: ${msg.action}`);

    switch(msg.action) {
      case "next_tab":
        browser.tabs.query({currentWindow: true}).then(
          (tabs) => {
            let current_tab = get_current_tab(tabs);
            let next_tab = tabs[current_tab.index+1] || tabs[0];
            if (next_tab)
              browser.tabs.update(next_tab.id, {active:true})
          }
        )
        break;
      case "previous_tab":
        browser.tabs.query({currentWindow: true}).then(
          (tabs) => {
            let current_tab = get_current_tab(tabs);
            let previous_tab = tabs[current_tab.index-1] || tabs[tabs.length-1];
            if (previous_tab)
              browser.tabs.update(previous_tab.id, {active:true})
          }
        )
        break;
      case "new_tab":
        browser.tabs.create({active:true})
        break;
      case "close_tab":
        browser.tabs.query({currentWindow: true, active: true}).then(
          (tabs) => browser.tabs.remove(tabs[0].id),
        );
        break;
    }
  })
})
