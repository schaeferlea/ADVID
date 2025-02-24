document.addEventListener('DOMContentLoaded', function() {
  let globalData = [];
  const fuseOptions = {
    includeScore: true,
    threshold: 0.3,
    keys: [
      'theaterstück.titel',
      'theaterstück.druckort',
      'theaterstück.auffuehrungshinweise',
      'autor.name',
      'autor.herkunft',
      'autor.orte',
      'autor.lebensdaten',
      'figur.name',
      'figur.rolle',
      'figur.beschreibung',
      'dialekt.adaption',
      'dialekt.dialekt_grossraum',
      'abschnitt'
    ]
  };

  const searchInput = document.getElementById('search-input');
  const resultsDiv = document.getElementById('results');

  const filterAdaption = document.getElementById('filter-adaption');
  const filterFigurtyp = document.getElementById('filter-figurtyp');
  const filterZeit = document.getElementById('filter-zeit');
  const filterDialektGrossraum = document.getElementById('filter-dialekt-grossraum');
  const filterHerkunft = document.getElementById('filter-herkunft');

  // Funktion, die eine 50-Jahres-Gruppe berechnet, falls ein konkretes Jahr vorliegt.
  function getZeitGroup(zeit) {
    // Versuche, eine 4-stellige Jahreszahl zu parsen.
    const year = parseInt(zeit, 10);
    if (!isNaN(year)) {
      const lower = Math.floor(year / 50) * 50;
      const upper = lower + 49;
      return `${lower}-${upper}`;
    }
    // Falls keine Jahreszahl ermittelt werden kann, Originalwert zurückgeben.
    return zeit;
  }

  // JSON-Daten laden
  fetch('data.json')
    .then(response => response.json())
    .then(data => {
      globalData = data;
      populateFilters(data);
      updateResults();
    })
    .catch(error => {
      console.error('Fehler beim Laden der JSON-Daten:', error);
      resultsDiv.innerHTML = "<p>Fehler beim Laden der Daten.</p>";
    });

  // Dropdowns dynamisch befüllen (außer Adaption, da hier feste Optionen definiert sind)
  function populateFilters(data) {
    populateSelect(filterFigurtyp, data.map(entry => entry.figur.rolle));
    populateSelect(filterZeit, data.map(entry => getZeitGroup(entry.theaterstück.zeit)));
    populateSelect(filterDialektGrossraum, data.map(entry => entry.dialekt.dialekt_grossraum));
    populateSelect(filterHerkunft, data.map(entry => entry.autor.herkunft));
  }

  function populateSelect(selectElement, values) {
    const uniqueValues = [...new Set(values)].filter(v => v && v.trim() !== "").sort();
    uniqueValues.forEach(value => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = value;
      selectElement.appendChild(option);
    });
  }

  // Filter- und Suchabfrage: Zuerst werden anhand der Dropdowns gefiltert,
  // dann wird, falls ein Freitext eingegeben wurde, Fuse.js angewandt.
  function updateResults() {
    let filteredData = globalData.filter(entry => {
      // Filter: Adaptionstyp
      if (filterAdaption.value && entry.dialekt.adaption !== filterAdaption.value) return false;
      // Filter: Figurtyp (rolle)
      if (filterFigurtyp.value && entry.figur.rolle !== filterFigurtyp.value) return false;
      // Filter: Entstehungszeit (über getZeitGroup)
      if (filterZeit.value && getZeitGroup(entry.theaterstück.zeit) !== filterZeit.value) return false;
      // Filter: Adaptierte Varietät
      if (filterDialektGrossraum.value && entry.dialekt.dialekt_grossraum !== filterDialektGrossraum.value) return false;
      // Filter: Herkunft Autor:in
      if (filterHerkunft.value && entry.autor.herkunft !== filterHerkunft.value) return false;
      return true;
    });

    const query = searchInput.value.trim();
    if(query !== "") {
      const fuse = new Fuse(filteredData, fuseOptions);
      const fuseResults = fuse.search(query);
      filteredData = fuseResults.map(result => result.item);
    }

    displayResults(filteredData);
  }

  function displayResults(results) {
    resultsDiv.innerHTML = "";
    if (results.length === 0) {
      resultsDiv.innerHTML = "<p>Keine Ergebnisse gefunden.</p>";
      return;
    }
    results.forEach(entry => {
      const div = document.createElement('div');
      div.classList.add('entry');
      div.innerHTML = `
        <h2>${entry.theaterstück.titel}</h2>
        <p><strong>Entstehungszeit:</strong> ${entry.theaterstück.zeit} (Gruppe: ${getZeitGroup(entry.theaterstück.zeit)}) | <strong>Druckort:</strong> ${entry.theaterstück.druckort}</p>
        <p><strong>Aufführungshinweise:</strong> ${entry.theaterstück.auffuehrungshinweise}</p>
        <p><strong>Autor:</strong> ${entry.autor.name} (${entry.autor.lebensdaten}, Herkunft: ${entry.autor.herkunft})</p>
        <p><strong>Figur:</strong> ${entry.figur.name} – ${entry.figur.rolle}</p>
        <p><strong>Dialekt:</strong> ${entry.dialekt.adaption} (${entry.dialekt.dialekt_grossraum})</p>
        <p><strong>Abschnitt:</strong> ${entry.abschnitt}</p>
      `;
      resultsDiv.appendChild(div);
    });
  }

  // Event-Listener für alle Filter und die Freitextsuche
  searchInput.addEventListener('input', updateResults);
  filterAdaption.addEventListener('change', updateResults);
  filterFigurtyp.addEventListener('change', updateResults);
  filterZeit.addEventListener('change', updateResults);
  filterDialektGrossraum.addEventListener('change', updateResults);
  filterHerkunft.addEventListener('change', updateResults);
});
