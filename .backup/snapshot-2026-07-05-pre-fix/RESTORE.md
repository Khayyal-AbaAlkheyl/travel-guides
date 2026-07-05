# Snapshot — 5 Jul 2026 (before HTML/PDF fix pass)

Full copy of the travel guide **before** the comprehensive image, layout, and UX fix pass.

## Restore

From PowerShell, in `travel-guides`:

```powershell
$src = ".backup\snapshot-2026-07-05-pre-fix"
Copy-Item "$src\assets" . -Recurse -Force
Copy-Item "$src\brand" . -Recurse -Force
Copy-Item "$src\cities" . -Recurse -Force
Copy-Item "$src\data" . -Recurse -Force
Copy-Item "$src\scripts" . -Recurse -Force
Copy-Item "$src\themes" . -Recurse -Force
Copy-Item "$src\package.json" . -Force
```

Then hard-refresh the browser or regenerate PDF with `npm run pdf:london`.
