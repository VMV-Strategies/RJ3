# LiftLog

A personal workout and body-composition tracker that installs on your iPhone Home Screen and works offline. No account, no server, no build step.

## What's in this folder

| Path | What it is |
|---|---|
| `index.html` | The app shell |
| `css/app.css` | All styling (light and dark mode, iPhone safe areas) |
| `js/app.js` | Screens, workout logging, templates, progress, backup |
| `js/db.js` | On-device database (IndexedDB) with versioned migrations |
| `js/data.js` | Exercise database: 250 exercises with families, variations, muscles, instructions |
| `js/musclemap.js` | Original front/back muscle diagrams, drawn in code |
| `js/charts.js` | Charts (no outside library) |
| `sw.js` | Service worker: makes LiftLog work offline |
| `manifest.webmanifest`, `icons/` | Home Screen install settings and icons |
| `exercises/` | Where your exercise illustrations go (see `exercises/README.md`) |

## Put it on GitHub (no terminal needed)

1. Sign in at github.com, click **+** (top right), then **New repository**.
2. Name it `liftlog`, choose **Public**, and click **Create repository**.
3. On the new page, click **uploading an existing file**.
4. Unzip `liftlog.zip` on your computer. Open the `liftlog` folder, select **everything inside it** (including the `css`, `js`, `icons` and `exercises` folders), and drag it into the browser window.
5. Click **Commit changes**.
6. Go to **Settings**, then **Pages** (left sidebar). Under **Build and deployment**, set **Source** to **Deploy from a branch**, **Branch** to `main`, folder `/ (root)`, and click **Save**.
7. Wait 1–2 minutes. Your app will be at `https://YOUR-USERNAME.github.io/liftlog/`.

> The hidden `.nojekyll` file tells GitHub to serve files as-is. If your computer hides it and it doesn't upload, that's fine; LiftLog works without it.

### If you prefer the terminal
```
cd liftlog
git init && git add . && git commit -m "LiftLog 1.0"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/liftlog.git
git push -u origin main
```
Then do step 6 above. No GitHub Actions workflow is needed because there's nothing to build.

## Install on your iPhone

1. Open **Safari** (it must be Safari) and go to `https://YOUR-USERNAME.github.io/liftlog/`.
2. Tap the **Share** button, then **Add to Home Screen**, then **Add**.
3. Open LiftLog from its Home Screen icon from now on.

Open it once while online so everything is saved for offline use. After that it works at the gym with no signal.

## Updating the app

Upload the changed files to GitHub the same way (drag them in, **Commit changes**). On your iPhone, open LiftLog while online, then fully close it (swipe it away) and reopen. The new version loads on that second launch. Your data is not affected by updates.

## Where your data lives

Everything is stored **only on your iPhone**, inside the installed LiftLog app (IndexedDB). It is not uploaded anywhere.

Important:
- The Home Screen app and the Safari tab keep **separate** data. Always use the Home Screen icon.
- Deleting LiftLog from your Home Screen deletes its data.
- **Back up regularly:** More → Data & backup → **Export full backup**. Save the file to iCloud Drive or Files. To restore, choose **Import backup**. LiftLog shows what the file contains and asks before replacing anything, and keeps a copy of your previous data so you can undo the import.
- CSV exports (body measurements, workout history, every set) open in Excel or Numbers.

## Trying it out

More → **Load demo data** adds 6 weeks of sample workouts, measurements and templates. **Remove demo data** deletes only those records.

## Local testing on a computer (optional)

Any static web server works, for example `python3 -m http.server` inside the folder, then open `http://localhost:8000`. Opening `index.html` directly as a file won't work, because browsers block modules and offline caching on `file://`.

## Known iPhone web-app limits

- No push notifications or background timers; the workout clock is based on start time, so it stays correct even if iOS suspends the app.
- In light mode the status bar text is white (iOS sets this at install), so LiftLog adds a thin tint behind it.
- Export uses the iPhone Share sheet; choose **Save to Files**.
- If you don't open LiftLog for a long time, iOS usually keeps Home Screen app data, but backups are your safety net.
