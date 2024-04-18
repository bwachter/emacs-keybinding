$(function() {
  // this might trigger a bunch of superfluous sync.set directly after
  // installation - but that's probably not worth bothering with.
  $("input").on("change", function(){
    var key=$(this).attr("id");
    var type = $(this).attr("type");
    var value;

    if (type == "checkbox")
      value = $(this).get(0).checked;
    else
      value = $(this).get(0).value;

    //chrome.runtime.sendMessage({action: "log", msg: `Element: changed ${key}:${value}`});
    chrome.runtime.sendMessage(
      {action: "option", key: key, value: value});
    chrome.storage.sync.set({[key]: value});
  });
});

function restoreOptions() {
  $("input").each(function () {
    var key = $(this).attr("id");
    var type = $(this).attr("type");
    // to add keys without default value of false check a lookup table here
    var value = false;
    chrome.storage.sync.get(key, function (setting) {
      if (Object.keys(setting).length) {
        value = setting[key];
        if (type == "checkbox")
          $("#"+key).get(0).checked = value ? "checked" : undefined;
        else
          $("#"+key).get(0).value = value;
      } else {
        chrome.storage.sync.set({[key]: value});
      }
      //chrome.runtime.sendMessage({action: "log", msg: `Option: ${key}:${value} (${type})`});
      chrome.runtime.sendMessage(
        {action: "option", key: key, value: value});
    });
  });
}

document.addEventListener("DOMContentLoaded", restoreOptions);
