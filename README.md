# 🎄 Calendario dell'Avvento

Sito statico per GitHub Pages, protetto da PIN.

- Testi, birre, sfide ed etichette sono in `contenuto.js`, **criptati** con il PIN (AES-256 + PBKDF2): senza PIN non si leggono, nemmeno guardando il codice del repository.
- Al primo accesso si inserisce il PIN. Con "Ricorda su questo telefono" spuntato, le volte dopo si entra direttamente.
- 5 PIN sbagliati di fila: blocco di 30 secondi.
- Anteprima per controllare tutto: aggiungi `?anteprima` al link (dopo il PIN).

Su GitHub vanno caricati **solo i file di questa cartella**.
