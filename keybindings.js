var current_binding;

// recursively generate ESC <key> compat mappings for M-<key>
function generate_ESC_bindings(bindings){
  var new_bindings = {}
  var esc_bindings = {}

  for (const key in bindings){
    const value = bindings[key];
    if (typeof value == "object"){
      var submap = generate_ESC_bindings(value);
      new_bindings[key] = submap;
      continue;
    }
    new_bindings[key] = value;
    if (key.startsWith("M-")){
      esc_key = key.replace("M-", "");
      esc_bindings[esc_key] = value;
    }
  }

  if (Object.keys(esc_bindings).length > 0)
    new_bindings['ESC'] = esc_bindings;
  return new_bindings;
}

const focus_window = () => {
  if (document.activeElement) {
    document.activeElement.blur();
  }
}

const focus_first_input = () => {
  for (var i = 0; document.forms[0].elements[i].type == 'hidden'; i++);
  document.forms[0].elements[i].focus();
}

var body_keybindings = {
  // scroll
  "C-f": () => window.scrollBy(30, 0),
  "C-b": () => window.scrollBy(-30, 0),
  "C-n": () => window.scrollBy(0, 30),
  "C-p": () => window.scrollBy(0, -30),
  "n": () => window.scrollBy(0, 30),
  "p": () => window.scrollBy(0, -30),
  "M-<": () => window.scroll(0, 0),
  "M->": () => window.scroll(0, document.body.scrollHeight),

  // refresh history
  "C-r": () => window.location.reload(),
  "C-F": () => window.history.forward(),
  "C-B": () => window.history.back(),

  // tabs
  "M-f": () => chrome.runtime.sendMessage({action: "next_tab"}),
  "M-b": () => chrome.runtime.sendMessage({action: "previous_tab"}),
  "t": () => focus_first_input(),

  "C-h": {
    "?": () => chrome.runtime.sendMessage({action: "options_page"}),
  },

  "C-x": {
    "k": () => chrome.runtime.sendMessage({action: "close_tab"}),
    "C-f": () => chrome.runtime.sendMessage({action: "new_tab"})
  },

  "C-u": {
    "C-x": {
      "k": () => chrome.runtime.sendMessage({action: "close_window"}),
      "C-f": () => chrome.runtime.sendMessage({action: "new_window"})
    }
  }
}

var generated_keybindings = generate_ESC_bindings(body_keybindings);

var textarea_keybindings = {
  "C-g": () => focus_window()
};

/**
 * Turn KeyboardEvent to string.
 * @param {KeyboardEvent} e
 * @returns {String}
 */
const get_key = (e) => {
  var key = e.key,
      ctrl = e.ctrlKey ? "C-" : "",
      meta = e.altKey ? "M-" : "";

  if (e.key == "Escape")
    return "ESC";
  else
    return ctrl + meta + key;
}

/**
 * get current keybindings according to focus state.
 * @param {string} target_type - current focus, either on textarea or window
 * @return {Object} keybindings - keybindings that current page uses
 */
const get_current_bind = (target_type) =>
      (target_type == "input" || target_type == "textarea"
       ? textarea_keybindings : generated_keybindings);

document.addEventListener("keydown", (e) => {
  if (e.key == "Shift" || e.key == "Control" || e.key == "Alt" || e.key == "Meta"){
    chrome.runtime.sendMessage({action: "log", msg: "Ignoring modifier"});
    return;
  }

  var key = get_key(e),
      target_type = e.target.tagName.toLowerCase();

  chrome.runtime.sendMessage({action: "log", msg: `user press key is ${key}, target type is ${target_type}`});

  if (!current_binding) {
    current_binding = get_current_bind(target_type);
  }

  chrome.runtime.sendMessage({action: "log", msg: `current binding is ${Object.keys(current_binding)}`});

  var command = current_binding[key];
  switch (typeof command) {
    case "function":
      command();
      current_binding = null;   // reset keybinding
      e.preventDefault();
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

chrome.runtime.onMessage.addListener((msg) => {
  chrome.runtime.sendMessage({action: "log", msg: `action: ${msg.action}`});
  switch(msg.action) {
    case "focus_window":
      focus_window();
      break;
  }
  return true;
});
