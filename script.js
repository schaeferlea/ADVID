// Verbesserte Suchfunktion für exakte und unscharfe Treffer ohne Textnormalisierung
function searchEntries(searchQuery) {
    if (!searchQuery.trim()) return;
    
    const threshold = 0.4; // Ähnlichkeitsschwelle für unscharfe Suche
    const results = data.filter(entry => {
        const searchFields = [
            entry.theaterstück.titel,
            entry.autor.name,
            entry.figur.name,
            entry.dialekt.dialekt_grossraum,
            entry.abschnitt
        ].join(" ").toLowerCase();
        
        return fuzzyMatch(searchQuery.toLowerCase(), searchFields, threshold);
    });
    
    displayResults(results, searchQuery);
}

// Unscharfe Suche basierend auf Teilzeichenfolgen-Übereinstimmung
function fuzzyMatch(query, text, threshold) {
    if (text.includes(query)) return true; // Exakte Übereinstimmung
    
    const words = text.split(/\s+/);
    return words.some(word => levenshteinDistance(query, word) <= Math.ceil(query.length * threshold));
}

// Berechnet die Levenshtein-Distanz zwischen zwei Strings
function levenshteinDistance(a, b) {
    const matrix = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
    for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
    for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
    
    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j - 1] + cost
            );
        }
    }
    return matrix[a.length][b.length];
}

// Hebt Suchbegriffe in den Ergebnissen hervor
function highlightText(text, searchQuery) {
    const regex = new RegExp(`(${searchQuery})`, "gi");
    return text.replace(regex, '<span class="highlight">$1</span>');
}

// Ergebnisse anzeigen
function displayResults(results, searchQuery) {
    const resultContainer = document.getElementById("results");
    resultContainer.innerHTML = "";
    
    if (results.length === 0) {
        resultContainer.innerHTML = "<p>Keine Treffer gefunden.</p>";
        return;
    }
    
    results.forEach(entry => {
        const entryDiv = document.createElement("div");
        entryDiv.classList.add("result-entry");
        
        entryDiv.innerHTML = `
            <h3>${highlightText(entry.theaterstück.titel, searchQuery)}</h3>
            <p><strong>Autor:</strong> ${highlightText(entry.autor.name, searchQuery)}</p>
            <p><strong>Figur:</strong> ${highlightText(entry.figur.name, searchQuery)}</p>
            <p><strong>Dialekt:</strong> ${highlightText(entry.dialekt.dialekt_grossraum, searchQuery)}</p>
            <p><strong>Ausschnitt:</strong> ${highlightText(entry.abschnitt, searchQuery)}</p>
        `;
        
        resultContainer.appendChild(entryDiv);
    });
}
