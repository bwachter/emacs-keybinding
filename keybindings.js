var current_binding;

const focus_window = () => {
  if (document.activeElement) {
    document.activeElement.blur();
  }
}

var body_keybindings = {
  // scroll
  "C-f": () => window.scrollBy(30, 0),
  "C-b": () => window.scrollBy(-30, 0),
  "C-n": () => window.scrollBy(0, 30),
  "C-p": () => window.scrollBy(0, -30),
  "n": () => window.scrollBy(0, 30),
  "p": () => window.scrollBy(0, -30),

  // refresh history
  "C-r": () => window.location.reload(),
  "C-F": () => window.history.forward(),
  "C-B": () => window.history.back(),

  // tabs
  "M-f": () => browser.runtime.sendMessage({action: "next_tab"}),
  "M-b": () => browser.runtime.sendMessage({action: "previous_tab"}),

  "C-x": {
    "k": () => browser.runtime.sendMessage({action: "close_tab"}),
    "C-f": () => browser.runtime.sendMessage({action: "new_tab"})
  }
}

var textarea_keybindings = {
  "C-g": () => focus_window()
};

/**
 * Turn KeyboardEvent to string.
 * @param {KeyboardEvent} e
 * @returns {String}
 */
const get_key = (e) => {
  var key = String.fromCharCode(e.keyCode),
      ctrl = e.ctrlKey ? "C-" : "",
      meta = e.altKey ? "M-" : "",
      shift = e.shiftKey ? "S-" : "";
  return ctrl + meta + (shift ? key : key.toLowerCase());
}

/**
 * get current keybindings according to focus state.
 * @param {string} target_type - current focus, either on textarea or window
 * @return {Object} keybindings - keybindings that current page uses
 */
const get_current_bind = (target_type) =>
      (target_type == "input" || target_type == "textarea"
       ? textarea_keybindings : body_keybindings);

document.addEventListener("keydown", (e) => {
  var key = get_key(e),
      target_type = e.target.tagName.toLowerCase();

  console.log(`user press key is ${key}, target type is ${target_type}`);

  if (!current_binding) {
    current_binding = get_current_bind(target_type);
  }

  console.log(`current binding is ${Object.keys(current_binding)}`);

  var command = current_binding[key];
  switch (typeof command) {
    case "function":
      command();
      current_binding = null;   // reset keybinding
      break;
    case "object":
      current_binding = command;
      e.preventDefault();
      break;
    default:
      current_binding = null;
      break;
  }
}, true);

browser.runtime.onMessage.addListener((msg) => {
  console.log(`action: ${msg.action}`);
  switch(msg.action) {
    case "focus_window":
      focus_window();
      break;
  }
  return true;
});
