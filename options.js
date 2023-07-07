$(function() {
  $("input").click(function () {
    var key=$(this).attr("id");
    var value=$(this).get(0).checked;
    chrome.runtime.sendMessage(
      {action: "option", key: key, value: value});
    chrome.storage.sync.set({[key]: value});
  });
});

function restoreOptions() {
  $("input").each(function () {
    var key = $(this).attr("id");
    // to add keys without default value of false check a lookup table here
    var value = false;
    chrome.storage.sync.get(key, function (setting) {
      if (Object.keys(setting).length) {
        value = setting[key];
        $("#"+key).get(0).checked = value ? "checked" : undefined;
      } else {
        chrome.storage.sync.set({[key]: value});
      }
      chrome.runtime.sendMessage(
        {action: "option", key: key, value: value});
    });
  });
}

document.addEventListener("DOMContentLoaded", restoreOptions);
