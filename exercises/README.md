# Exercise illustrations

Every exercise already has a code-drawn muscle diagram. Add your own illustrations here and LiftLog will show them in the picker, preview and workout screens.

## File layout

```
exercises/<area>/<exercise-id>/thumb.webp    small list image (square, about 160×160)
exercises/<area>/<exercise-id>/start.webp    starting position
exercises/<area>/<exercise-id>/mid.webp      mid-movement
exercises/<area>/<exercise-id>/end.webp      finishing position
exercises/<area>/<exercise-id>/muscles.webp  optional
```

`<area>` is one of: chest, back, shoulders, arms, legs, core, full-body.
Example: `exercises/chest/incline-dumbbell-bench-press/thumb.webp`

The exact folder for every exercise is shown in the app under More → Exercise images.

## After adding images

1. Upload the image folders to GitHub.
2. In LiftLog: More → Exercise images → **Scan for image files**.
3. Tap **Copy assets.json**, then on GitHub open `exercises/assets.json`, click the pencil icon, replace its contents with what you copied, and commit.

The scan also lists any images `assets.json` mentions that are missing, so broken references are easy to spot.

Only use images you created, generated with permission, or have a licence for. Don't copy illustrations from other fitness apps or websites.
