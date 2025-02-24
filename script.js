// Sobald das DOM geladen ist, laden wir die Daten und initialisieren die Suche
document.addEventListener('DOMContentLoaded', function() {
  // JSON-Daten laden
  fetch('data.json')
    .then(response => response.json())
    .then(data => {
      // Konfiguration für Fuse.js: Definierte Felder, die durchsucht werden sollen
      const options = {
        includeScore: true,
        threshold: 0.3, // Empfindlichkeit der Suche
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

      // Fuse.js Instanz erstellen
      const fuse = new Fuse(data, options);

      // Elemente abrufen
      const searchInput = document.getElementById('search-input');
      const resultsDiv = document.getElementById('results');

      // Funktion zur Darstellung der Ergebnisse
      function displayResults(results) {
        resultsDiv.innerHTML = "";
        if (results.length === 0) {
          resultsDiv.innerHTML = "<p>Keine Ergebnisse gefunden.</p>";
          return;
        }
        results.forEach(result => {
          const entry = result.item;
          const div = document.createElement('div');
          div.classList.add('entry');
          div.innerHTML = `
            <h2>${entry.theaterstück.titel}</h2>
            <p><strong>Zeit:</strong> ${entry.theaterstück.zeit} | <strong>Druckort:</strong> ${entry.theaterstück.druckort}</p>
            <p><strong>Aufführungshinweise:</strong> ${entry.theaterstück.auffuehrungshinweise}</p>
            <p><strong>Autor:</strong> ${entry.autor.name} (${entry.autor.lebensdaten})</p>
            <p><strong>Figur:</strong> ${entry.figur.name} – ${entry.figur.rolle}</p>
            <p><strong>Dialekt:</strong> ${entry.dialekt.adaption} (${entry.dialekt.dialekt_grossraum})</p>
            <p><strong>Abschnitt:</strong> ${entry.abschnitt}</p>
          `;
          resultsDiv.appendChild(div);
        });
      }

      // Event-Listener für die Suchabfrage
      searchInput.addEventListener('input', function() {
        const query = searchInput.value.trim();
        if(query === "") {
          resultsDiv.innerHTML = "<p>Bitte Suchbegriff eingeben.</p>";
        } else {
          const results = fuse.search(query);
          displayResults(results);
        }
      });
    })
    .catch(error => {
      console.error('Fehler beim Laden der JSON-Daten:', error);
      document.getElementById('results').innerHTML = "<p>Fehler beim Laden der Daten.</p>";
    });
});
