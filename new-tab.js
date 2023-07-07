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

const form = document.getElementById("form");
form.addEventListener("submit", urlOrSearch);

document.addEventListener("DOMContentLoaded", loadSearchEngines);
