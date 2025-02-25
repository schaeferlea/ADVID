document.addEventListener('DOMContentLoaded', function() {
  let globalData = [];
  const fuseOptions = {
    includeScore: true,
    threshold: 0.4, // Angepasster Schwellenwert, um auch längere "abschnitt"-Texte zu erfassen
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
  const exportCSVBtn = document.getElementById('export-csv-btn');

  // Gruppiert konkrete Jahreszahlen in 50-Jahres-Intervalle
  function getZeitGroup(zeit) {
    const year = parseInt(zeit, 10);
    if (!isNaN(year)) {
      const lower = Math.floor(year / 50) * 50;
      const upper = lower + 49;
      return `${lower}-${upper}`;
    }
    return zeit;
  }

  // Laden der JSON-Daten
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

  // Befüllt die Dropdown-Filter mit eindeutigen Werten
  function populateFilters(data) {
    populateSelect(filterFigurtyp, data.map(entry => entry.figur.rolle));
    populateSelect(filterZeit, data.map(entry => getZeitGroup(entry.theaterstück.zeit)));
    populateSelect(filterDialektGrossraum, data.map(entry => entry.dialekt.dialekt_grossraum));
    populateSelect(filterHerkunft, data.map(entry => entry.autor.herkunft));
  }

  function populateSelect(selectElement, values) {
    const uniqueValues = [...new Set(values)]
      .filter(v => v && v.trim() !== "")
      .sort();
    uniqueValues.forEach(value => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = value;
      selectElement.appendChild(option);
    });
  }

  // Aktualisiert die Ergebnisse anhand der Filter und der Freitextsuche
  function updateResults() {
    let filteredData = globalData.filter(entry => {
      if (filterAdaption.value && entry.dialekt.adaption !== filterAdaption.value) return false;
      if (filterFigurtyp.value && entry.figur.rolle !== filterFigurtyp.value) return false;
      if (filterZeit.value && getZeitGroup(entry.theaterstück.zeit) !== filterZeit.value) return false;
      if (filterDialektGrossraum.value && entry.dialekt.dialekt_grossraum !== filterDialektGrossraum.value) return false;
      if (filterHerkunft.value && entry.autor.herkunft !== filterHerkunft.value) return false;
      return true;
    });

    const query = searchInput.value.trim();
    if (query !== "") {
      const fuse = new Fuse(filteredData, fuseOptions);
      const fuseResults = fuse.search(query);
      filteredData = fuseResults.map(result => result.item);
    }

    displayResults(filteredData);
  }

  // Erzeugt ein Element für den "abschnitt"-Text, das bei zu langen Texten automatisch gekürzt wird.
  // Mit einem Klick kann der volle Text bzw. die gekürzte Version umgeschaltet werden.
  function createAbschnittElement(text) {
    const threshold = 300; // Zeichenanzahl, ab der gekürzt wird
    const container = document.createElement('div');
    container.classList.add('abschnitt-container');

    const textDiv = document.createElement('div');
    textDiv.classList.add('abschnitt-text');

    if (text.length <= threshold) {
      textDiv.textContent = text;
      container.appendChild(textDiv);
    } else {
      const shortText = text.substring(0, threshold) + '...';
      textDiv.textContent = shortText;
      container.appendChild(textDiv);

      const toggleButton = document.createElement('button');
      toggleButton.classList.add('toggle-button');
      toggleButton.textContent = 'Mehr lesen';

      toggleButton.addEventListener('click', function() {
        if (textDiv.textContent === shortText) {
          textDiv.textContent = text;
          toggleButton.textContent = 'Weniger anzeigen';
        } else {
          textDiv.textContent = shortText;
          toggleButton.textContent = 'Mehr lesen';
        }
      });
      container.appendChild(toggleButton);
    }
    return container;
  }

  // Zeigt die Ergebnisse in der Ergebnis-Div an
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
        <p><strong>Entstehungszeit:</strong> ${entry.theaterstück.zeit} | <strong>Druckort:</strong> ${entry.theaterstück.druckort}</p>
        <p><strong>Aufführungshinweise:</strong> ${entry.theaterstück.auffuehrungshinweise}</p>
        <p><strong>Autor:</strong> ${entry.autor.name} (${entry.autor.lebensdaten}, Herkunft: ${entry.autor.herkunft})</p>
        <p><strong>Figur:</strong> ${entry.figur.name} – ${entry.figur.rolle}</p>
        <p><strong>Dialekt:</strong> ${entry.dialekt.adaption} (${entry.dialekt.dialekt_grossraum})</p>
        <p><strong>Original:</strong> <a href="${entry.original_link}" target="_blank" rel="noopener noreferrer">${entry.original_link}</a></p>
      `;

      const abschnittElement = createAbschnittElement(entry.abschnitt);
      div.appendChild(abschnittElement);

      resultsDiv.appendChild(div);
    });
  }

  // Exportiert die Daten als CSV
  function exportDataAsCSV(data) {
    const csvHeader = [
      "id",
      "titel",
      "zeit",
      "druckort",
      "auffuehrungshinweise",
      "autor",
      "herkunft",
      "orte",
      "lebensdaten",
      "figur",
      "rolle",
      "beschreibung",
      "dialekt_adaption",
      "dialekt_grossraum",
      "abschnitt",
      "original_link"
    ];
    
    const csvRows = [];
    csvRows.push(csvHeader.join(","));
    
    function escapeCSV(str) {
      if (typeof str !== "string") str = String(str);
      str = str.replace(/"/g, '""');
      if (str.search(/("|,|\n)/g) >= 0) {
        str = `"${str}"`;
      }
      return str;
    }
    
    data.forEach(entry => {
      const row = [
        entry.id,
        entry.theaterstück.titel,
        entry.theaterstück.zeit,
        entry.theaterstück.druckort,
        entry.theaterstück.auffuehrungshinweise,
        entry.autor.name,
        entry.autor.herkunft,
        entry.autor.orte.join("; "),
        entry.autor.lebensdaten,
        entry.figur.name,
        entry.figur.rolle,
        entry.figur.beschreibung,
        entry.dialekt.adaption,
        entry.dialekt.dialekt_grossraum,
        entry.abschnitt,
        entry.original_link
      ].map(escapeCSV);
      csvRows.push(row.join(","));
    });
    
    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", url);
    downloadAnchorNode.setAttribute("download", "export.csv");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }

  // Event-Listener für Sucheingabe und Dropdown-Filter
  searchInput.addEventListener('input', updateResults);
  filterAdaption.addEventListener('change', updateResults);
  filterFigurtyp.addEventListener('change', updateResults);
  filterZeit.addEventListener('change', updateResults);
  filterDialektGrossraum.addEventListener('change', updateResults);
  filterHerkunft.addEventListener('change', updateResults);

  // Event-Listener für den CSV-Export-Button
  exportCSVBtn.addEventListener('click', function() {
    exportDataAsCSV(globalData);
  });
});
