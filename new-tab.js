async function urlOrSearch(event){
  event.preventDefault();
  var protocols = [ "https", "http" ];

  try {
    new URL(urlbar.value);
    document.location.href = urlbar.value;
    return;
  } catch (error){
    chrome.runtime.sendMessage({action: "log", msg: `Not a valid URL: ${error}`});
  }

  // TODO: check if this works with proxies
  //       add better handling of http errors
  for (i in protocols) {
    var url = protocols[i] + "://" + urlbar.value;
    chrome.runtime.sendMessage({action: "log", msg: `Trying: ${url}`});
    try {
      // all network errors should throw an exception -> probably we don't care much about what the fetch is doing here
      const result = await fetch(url, {
        method: "GET",
        mode: "no-cors",
        cache: "no-cache",
        credentials: "same-origin",
        redirect: "follow",
        referrerPolicy: "no-referrer"
      });
      chrome.runtime.sendMessage({action: "log", msg: `Going to: ${url}`});
      document.location.href = url;
      return;
    } catch (error) {
      chrome.runtime.sendMessage({action: "log", msg: `Error looking up URL: ${error}`});
    }
  }

  // disposition came with version 111
  try {
    browser.search.search({
      query: urlbar.value,
      disposition: "CURRENT_TAB"
    });
  } catch (error) {
    chrome.runtime.sendMessage({action: "log", msg: `Search not working: ${error}`});
  }

  // this will open the search in a new tab, unless tab ID is provided
  try {
    browser.search.search({
      query: urlbar.value,
    });
  } catch (error) {
    chrome.runtime.sendMessage({action: "log", msg: `Search not working: ${error}`});
  }
}

const form = document.getElementById("form");
form.addEventListener("submit", urlOrSearch);
