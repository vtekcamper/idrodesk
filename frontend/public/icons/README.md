# PWA Icons

Questa cartella deve contenere le icone per la PWA.

Dimensioni richieste:
- 72x72
- 96x96
- 128x128
- 144x144
- 152x152
- 192x192
- 384x384
- 512x512

Per generare le icone:
1. Crea un'icona 512x512 (PNG)
2. Usa uno strumento online come https://realfavicongenerator.net/
3. Oppure usa ImageMagick:
   ```bash
   convert icon-512x512.png -resize 72x72 icon-72x72.png
   convert icon-512x512.png -resize 96x96 icon-96x96.png
   # ... etc
   ```

Per ora, l'app funzionerà anche senza icone (userà il favicon di default).

