// Funktion, um Daten als CSV zu exportieren (flacht verschachtelte Objekte)
function exportDataAsCSV(data) {
  // CSV-Header (Spaltennamen)
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

  // Hilfsfunktion, um Felder für CSV zu escapen
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

// Beispiel: Füge einen Event-Listener zu einem Button mit der ID 'export-csv-btn' hinzu:
document.getElementById('export-csv-btn').addEventListener('click', function() {
  // Hier kannst du z. B. globalData oder filteredData exportieren
  exportDataAsCSV(globalData);
});
