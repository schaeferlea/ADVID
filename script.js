document.addEventListener('DOMContentLoaded', function() {
  let globalData = [];
  const fuseOptions = {
    includeScore: true,
    threshold: 0.3,
    keys: [
      'theaterstück.titel',
      'theaterstück.zeit',
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
  
  const filterZeit = document.getElementById('filter-zeit');
  const filterDruckort = document.getElementById('filter-druckort');
  const filterAutor = document.getElementById('filter-autor');
  const filterDialektAdaption = document.getElementById('filter-dialekt-adaption');
  const filterDialektGrossraum = document.getElementById('filter-dialekt-grossraum');
  
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
  
  // Dynamisches Befüllen der Dropdown-Filter anhand der Daten
  function populateFilters(data) {
    populateSelect(filterZeit, data.map(entry => entry.theaterstück.zeit));
    populateSelect(filterDruckort, data.map(entry => entry.theaterstück.druckort));
    populateSelect(filterAutor, data.map(entry => entry.autor.name));
    populateSelect(filterDialektAdaption, data.map(entry => entry.dialekt.adaption));
    populateSelect(filterDialektGrossraum, data.map(entry => entry.dialekt.dialekt_grossraum));
  }
  
  function populateSelect(selectElement, values) {
    const uniqueValues = [...new Set(values)].sort();
    uniqueValues.forEach(value => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = value;
      selectElement.appendChild(option);
    });
  }
  
  // Funktion, die sowohl die Dropdown-Filter als auch die Freitextsuche berücksichtigt
  function updateResults() {
    let filteredData = globalData.filter(entry => {
      if (filterZeit.value && entry.theaterstück.zeit !== filterZeit.value) return false;
      if (filterDruckort.value && entry.theaterstück.druckort !== filterDruckort.value) return false;
      if (filterAutor.value && entry.autor.name !== filterAutor.value) return false;
      if (filterDialektAdaption.value && entry.dialekt.adaption !== filterDialektAdaption.value) return false;
      if (filterDialektGrossraum.value && entry.dialekt.dialekt_grossraum !== filterDialektGrossraum.value) return false;
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
        <p><strong>Epoche:</strong> ${entry.theaterstück.zeit} | <strong>Druckort:</strong> ${entry.theaterstück.druckort}</p>
        <p><strong>Aufführungshinweise:</strong> ${entry.theaterstück.auffuehrungshinweise}</p>
        <p><strong>Autor:</strong> ${entry.autor.name} (${entry.autor.lebensdaten})</p>
        <p><strong>Figur:</strong> ${entry.figur.name} – ${entry.figur.rolle}</p>
        <p><strong>Dialekt:</strong> ${entry.dialekt.adaption} (${entry.dialekt.dialekt_grossraum})</p>
        <p><strong>Abschnitt:</strong> ${entry.abschnitt}</p>
      `;
      resultsDiv.appendChild(div);
    });
  }
  
  // Event-Listener für alle Filter und die Freitextsuche
  searchInput.addEventListener('input', updateResults);
  filterZeit.addEventListener('change', updateResults);
  filterDruckort.addEventListener('change', updateResults);
  filterAutor.addEventListener('change', updateResults);
  filterDialektAdaption.addEventListener('change', updateResults);
  filterDialektGrossraum.addEventListener('change', updateResults);
});
