$(function() {
  $("input").click(function () {
    var key=$(this).attr("id");
    var value=$(this).get(0).checked;
    browser.runtime.sendMessage(
      {action: "option", key: key, value: value});
    browser.storage.sync.set({[key]: value});
  });
});

function restoreOptions() {
  $("input").each(function () {
    var key = $(this).attr("id");
    // to add keys without default value of false check a lookup table here
    var value = false;
    browser.storage.sync.get(key, function (setting) {
      if (Object.keys(setting).length) {
        value = setting[key];
        $("#"+key).get(0).checked = value ? "checked" : undefined;
      } else {
        browser.storage.sync.set({[key]: value});
      }
      browser.runtime.sendMessage(
        {action: "option", key: key, value: value});
    });
  });
}

document.addEventListener("DOMContentLoaded", restoreOptions);
