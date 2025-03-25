document.addEventListener("DOMContentLoaded", function () {
    let dataset = [];
    let kontextAnzeigen = true;

    fetch("data_segmentiert.json")
        .then(response => response.json())
        .then(data => {
            dataset = data;
            populateDropdowns(dataset);
            displayResults(dataset);
        });

    const searchInput = document.getElementById("search-input");
    searchInput.addEventListener("input", performSearch);

    document.getElementById("export-csv-btn").addEventListener("click", exportToCSV);

    const toggleKontextBtn = document.createElement("button");
    toggleKontextBtn.textContent = "Kontext ausblenden";
    toggleKontextBtn.style.margin = "10px 0";
    toggleKontextBtn.addEventListener("click", () => {
        kontextAnzeigen = !kontextAnzeigen;
        toggleKontextBtn.textContent = kontextAnzeigen ? "Kontext ausblenden" : "Kontext einblenden";
        performSearch();
    });
    document.querySelector(".search-container")?.appendChild(toggleKontextBtn);

    function performSearch() {
        const query = searchInput.value.toLowerCase().trim();
        const filteredData = dataset.filter(entry =>
            entry.abschnitt_segmentiert?.some(segment =>
                segment.typ === "figurtext" && segment.text.toLowerCase().includes(query)
            )
        );
        displayResults(filteredData, query);
    }

    function displayResults(data, query = "") {
        const resultsContainer = document.getElementById("results");
        resultsContainer.innerHTML = "";

        if (data.length === 0) {
            resultsContainer.innerHTML = "<p>Keine Ergebnisse gefunden.</p>";
            return;
        }

        data.forEach(entry => {
            const resultItem = document.createElement("div");
            resultItem.classList.add("result-item");

            const abschnittHTML = entry.abschnitt_segmentiert
                .filter(seg => kontextAnzeigen || seg.typ !== "kontext")
                .map(seg => {
                    const text = formatLineBreaks(query ? highlightText(seg.text, query) : seg.text);
                    return `<div class="${seg.typ === "kontext" ? "kontext" : "figurtext"}">${text}</div>`;
                }).join("\n");

            const previewText = entry.abschnitt_segmentiert
                .filter(seg => seg.typ === "figurtext")
                .map(seg => seg.text)
                .join(" ");

            const previewHTML = formatLineBreaks(shortenText(previewText, 300));

            resultItem.innerHTML = `
                <h3>${entry.theaterstück.titel} (${entry.theaterstück.zeit})</h3>
                <p><strong>Autor:</strong> ${entry.autor.name} (${entry.autor.lebensdaten})</p>
                <p><strong>Herkunft:</strong> ${entry.autor.herkunft}</p>
                <p><strong>Figur:</strong> ${entry.figur.name} (${entry.figur.rolle})</p>
                <p><strong>Adaption:</strong> ${entry.dialekt.adaption} (${entry.dialekt.dialekt_grossraum})</p>
                <p><strong>Abschnitt:</strong></p>
                <div class="abschnitt-preview figurtext">${previewHTML}</div>
                <button class="toggle-abschnitt">Mehr</button>
                <div class="abschnitt-full hidden">${abschnittHTML}</div>
                <p><a href="${entry.original_link}" target="_blank">Quelle</a></p>
            `;

            resultsContainer.appendChild(resultItem);

            const toggleBtn = resultItem.querySelector(".toggle-abschnitt");
            const previewEl = resultItem.querySelector(".abschnitt-preview");
            const fullEl = resultItem.querySelector(".abschnitt-full");

            fullEl.style.display = "none";

            toggleBtn.addEventListener("click", () => {
                const sichtbar = fullEl.style.display === "block";
                fullEl.style.display = sichtbar ? "none" : "block";
                previewEl.style.display = sichtbar ? "block" : "block";
                toggleBtn.textContent = sichtbar ? "Mehr" : "Weniger";
            });
        });
    }

    function highlightText(text, query) {
        if (!query) return text;
        const regex = new RegExp(query, "gi");
        return text.replace(regex, match => `<span class="highlight">${match}</span>`);
    }

    function formatLineBreaks(text) {
        return text.replace(/\n/g, "<br>");
    }

    function shortenText(text, length = 300) {
        const temp = document.createElement("div");
        temp.innerHTML = text;
        const plain = temp.textContent || temp.innerText || "";
        return plain.length <= length ? text : plain.substring(0, length) + "...";
    }

    function populateDropdowns(data) {
        populateDropdown("filter-adaption", data.map(d => d.dialekt.adaption));
        populateDropdown("filter-figurtyp", data.map(d => d.figur.rolle));
        populateDropdown("filter-zeit", data.map(d => d.theaterstück.zeit));
        populateDropdown("filter-dialekt-grossraum", data.map(d => d.dialekt.dialekt_grossraum));
        populateDropdown("filter-herkunft", data.map(d => d.autor.herkunft));
    }

    function populateDropdown(id, values) {
        const dropdown = document.getElementById(id);
        const unique = [...new Set(values)].sort();
        unique.forEach(value => {
            const opt = document.createElement("option");
            opt.value = value;
            opt.textContent = value;
            dropdown.appendChild(opt);
        });
        dropdown.addEventListener("change", filterResults);
    }

    function filterResults() {
        const adaption = document.getElementById("filter-adaption").value;
        const figur = document.getElementById("filter-figurtyp").value;
        const zeit = document.getElementById("filter-zeit").value;
        const dialekt = document.getElementById("filter-dialekt-grossraum").value;
        const herkunft = document.getElementById("filter-herkunft").value;

        const filtered = dataset.filter(entry =>
            (adaption === "" || entry.dialekt.adaption === adaption) &&
            (figur === "" || entry.figur.rolle === figur) &&
            (zeit === "" || entry.theaterstück.zeit === zeit) &&
            (dialekt === "" || entry.dialekt.dialekt_grossraum === dialekt) &&
            (herkunft === "" || entry.autor.herkunft === herkunft)
        );
        displayResults(filtered);
    }

    function exportToCSV() {
        const headers = [
            "ID",
            "Titel",
            "Zeit",
            "Druckort",
            "Aufführung",
            "Autor",
            "Herkunft",
            "Koordinaten Autor",
            "Orte",
            "Lebensdaten",
            "Figur",
            "Rolle",
            "Beschreibung",
            "Adaption",
            "Dialekt",
            "Figurtext",
            "Link",
            "Koordinaten Figur"
        ];
    
        let csvRows = [headers.join(",")];
    
        dataset.forEach(entry => {
            const nurFigurtext = entry.abschnitt_segmentiert
                .filter(seg => seg.typ === "figurtext")
                .map(seg => seg.text.replace(/\n/g, " ").replace(/"/g, '""'))
                .join(" ");
    
            const row = [
                entry.id,
                entry.theaterstück.titel,
                entry.theaterstück.zeit,
                entry.theaterstück.druckort,
                entry.theaterstück.auffuehrungshinweise || "",
                entry.autor.name,
                entry.autor.herkunft,
                entry.geokoordinaten?.herkunft_autor
                    ? `"${entry.geokoordinaten.herkunft_autor.lat}, ${entry.geokoordinaten.herkunft_autor.lng}"`
                    : "",
                entry.autor.orte ? `"${entry.autor.orte.join("; ")}"` : "",
                entry.autor.lebensdaten,
                entry.figur.name,
                entry.figur.rolle,
                entry.figur.beschreibung || "",
                entry.dialekt.adaption,
                entry.dialekt.dialekt_grossraum,
                `"${nurFigurtext}"`,
                entry.original_link || "",
                entry.geokoordinaten?.herkunft_figur
                    ? `"${entry.geokoordinaten.herkunft_figur.lat}, ${entry.geokoordinaten.herkunft_figur.lng}"`
                    : ""
            ].map(val => (val !== undefined ? val : ""));
    
            csvRows.push(row.join(","));
        });
    
        // UTF-8 BOM für Excel-Kompatibilität
        const csvContent = "\uFEFF" + csvRows.join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
    
        const link = document.createElement("a");
        link.href = url;
        link.download = "AdViD_Datenbank_Export.csv";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

});
