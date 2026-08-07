# Bench — pocket toolbox PWA

Eight offline-first utility tools in one installable app: color converter + palette,
base converter, text case converter, aspect ratio/resolution calculator,
BMI/calorie/tip calculator, loan EMI/compound interest calculator,
word & character counter, and a QR code generator/scanner.

Pure HTML/CSS/JS — no build step, no backend.

## Run it locally

Any static file server works (service workers require `http://` or `https://`, not `file://`):

```bash
cd toolbox-pwa
python3 -m http.server 8080
# open http://localhost:8080
```

## Deploy to GitHub Pages (same setup as the example you linked)

1. Create a new GitHub repo and push this folder's contents to it.
2. Repo Settings → Pages → Deploy from branch → `main` / `(root)`.
3. Your app will be live at `https://<username>.github.io/<repo>/`.
4. Visit it once online so the service worker installs; after that it works offline
   and shows an "Install" button in supporting browsers (Chrome/Edge/Android).

## Notes

- The QR generator/scanner use two small CDN libraries (qrcode.js, jsQR) loaded from
  cdnjs. They're cached by the service worker after the first online visit, so QR
  features keep working offline too. Swap in local copies under a `vendor/` folder
  if you'd rather not depend on a CDN at all.
- Camera scanning needs HTTPS (or localhost) and camera permission.
- `icons/icon.svg` is a placeholder mark — swap it for your own square icon anytime;
  update the `src` paths in `manifest.json` if you rename it or add PNG fallbacks.
