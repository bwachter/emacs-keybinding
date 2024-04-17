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
    return;
  } catch (error) {
    chrome.runtime.sendMessage({action: "log", msg: `Search not working: ${error}`});
  }

  // this will open the search in a new tab, unless tab ID is provided
  try {
    browser.search.search({
      query: urlbar.value,
    });
    return;
  } catch (error) {
    chrome.runtime.sendMessage({action: "log", msg: `Search not working: ${error}`});
  }
}

async function loadTopSites(){
  let topSites = await browser.topSites.get({
    includeFavicon: !options.nt_top_nofavicons,
    includeBlocked: options.nt_top_blocked,
    includePinned: options.nt_top_pinned,
    includeSearchShortcuts: options.nt_top_searchshortcuts,
    newtab: options.nt_top_newtab
  });
  let container = document.getElementById("top-site-group");

  for (const topSite of topSites){
    var groupItem = document.createElement("div");

    if (options.nt_top_nofavicons){
      groupItem.className = "group-list-item";
      groupItem.innerHTML = `<a href="${topSite.url}">${topSite.title}</a>`
    } else {
      groupItem.className = "group-item";
      groupItem.innerHTML = `<a href="${topSite.url}"><div class="group-item-img"><img src="${topSite.favicon}"></div><br />${topSite.title}</a>`
    }

    container.appendChild(groupItem);

    chrome.runtime.sendMessage({action: "log", msg: `Title: ${topSite.title}, URL: ${topSite.url}`});
  }
}

async function loadSearchEngines(){
    let engines = await browser.search.get();
    let table = document.getElementById("search_engine_table");

    let keys = Object.keys(engines);

    chrome.runtime.sendMessage({action: "log", msg: `Table: ${keys}`});

    // filling the table is a bit more complicated as we start with one empty
    // row for getting proper formatting exported from org-mode
    for (const engine of engines){
        let keys = Object.keys(engine);
        chrome.runtime.sendMessage({action: "log", msg: `Table: ${keys}`});

        chrome.runtime.sendMessage({action: "log", msg: `Search engine: ${engine.name} in ${table.rows.length}`});
        let row, cell0, cell1, cell2;
        if (table.rows.length == 2){
            row = table.rows[1];
            new_row = table.insertRow(table.rows.length);
        } else {
            row = table.rows[table.rows.length - 1];
            cell0 = row.insertCell(0);
            cell1 = row.insertCell(1);
            cell2 = row.insertCell(2);

            if (table.rows.length <= engines.length)
                new_row = table.insertRow(table.rows.length);
        }

        row.cells[0].innerHTML = engine.alias;
        row.cells[1].innerHTML = engine.name;
        if (engine.isDefault)
            row.cells[2].innerHTML = "x";
    }
}

async function loadOptions(){
  browser.runtime.sendMessage({
    action: "options"
  }).then((message) => {
    state.options_ready = true;
    options = message.response;
    updatePage();
  });
}

function updatePage(){
  if (state.options_ready == true && state.dom_ready == true){
    if (options.nt_hide_title == true){
      document.getElementsByClassName("title")[0].style.display = "none";
    }
    if (options.nt_hide_intro == true){
      document.getElementById("introduction").style.display = "none";
    }
    if (options.nt_hide_input_label == true){
      document.getElementById("input_label").style.display = "none";
    }
    if (options.nt_hide_url_instructions == true){
      document.getElementById("url_instructions").style.display = "none";
    }
    if (options.nt_hide_search_engines == true){
      document.getElementById("search_engines").style.display = "none";
    } else {
      loadSearchEngines();
    }
    if (options.nt_hide_top_sites == true){
      document.getElementById("top_sites").style.display = "none";
    } else {
      loadTopSites();
    }
  }
}

var options = {};
var state = { dom_ready: false,
              options_ready: false };

loadOptions();
const form = document.getElementById("form");
form.addEventListener("submit", urlOrSearch);

document.addEventListener("DOMContentLoaded", () => { state.dom_ready = true; updatePage });
