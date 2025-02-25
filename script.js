document.addEventListener("DOMContentLoaded", function () {
    let data = [];
    
    fetch("data.json")
        .then(response => {
            if (!response.ok) {
                throw new Error("Fehler beim Laden der JSON-Datei");
            }
            return response.json();
        })
        .then(jsonData => {
            data = jsonData;
            populateFilters(data);
        })
        .catch(error => console.error("Fehler beim Laden der Daten:", error));
    
    document.getElementById("search-input").addEventListener("input", function () {
        if (data.length > 0) {
            searchAndDisplayResults();
        }
    });

    document.getElementById("export-csv-btn").addEventListener("click", function () {
        if (data.length > 0) {
            exportToCSV(data);
        } else {
            console.error("Keine Daten für den Export verfügbar");
        }
    });
});

function searchAndDisplayResults() {
    let query = document.getElementById("search-input").value.toLowerCase();
    let resultsContainer = document.getElementById("results");
    resultsContainer.innerHTML = "";

    let filteredData = data.filter(entry => 
        JSON.stringify(entry).toLowerCase().includes(query)
    );

    if (filteredData.length === 0) {
        resultsContainer.innerHTML = "<p>Keine Treffer gefunden.</p>";
        return;
    }

    filteredData.forEach(entry => {
        let div = document.createElement("div");
        div.className = "result-item";
        div.innerHTML = `<strong>${entry.theaterstück.titel}</strong> (${entry.theaterstück.zeit})`;
        resultsContainer.appendChild(div);
    });
}

function populateFilters(data) {
    function fillSelect(id, values) {
        let select = document.getElementById(id);
        values.forEach(value => {
            let option = document.createElement("option");
            option.value = value;
            option.textContent = value;
            select.appendChild(option);
        });
    }
    
    let adaptionTypes = [...new Set(data.map(entry => entry.dialekt.adaption))];
    fillSelect("filter-adaption", adaptionTypes);

    let figurTypen = [...new Set(data.map(entry => entry.figur.rolle))];
    fillSelect("filter-figurtyp", figurTypen);

    let entstehungszeiten = [...new Set(data.map(entry => entry.theaterstück.zeit))];
    fillSelect("filter-zeit", entstehungszeiten);

    let dialekte = [...new Set(data.map(entry => entry.dialekt.dialekt_grossraum))];
    fillSelect("filter-dialekt-grossraum", dialekte);
}

function exportToCSV(data) {
    let csvContent = "data:text/csv;charset=utf-8," + 
        Object.keys(data[0]).join(";") + "\n" + 
        data.map(e => Object.values(e).join(";")).join("\n");
    
    let encodedUri = encodeURI(csvContent);
    let link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "datenbank_export.csv");
    document.body.appendChild(link);
    link.click();
}
