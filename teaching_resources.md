# Teaching Resources Deployment Guide

## Steam Property Lookup Tool

Deployed from: `/home/aditya/Thermodynamics related/Ch1_properties_pure_substances/`

Files copied to: `teaching/thermo/tools/steam_property_lookup/`

Files:
- index.html
- styles.css
- app.js
- data/saturation_dome.json
- data/saturation_tables.json
- data/property_grid.json

Accessible at: https://aditya-bandopadhyay.github.io/teaching/thermo/tools/steam_property_lookup/

## Steam Property Quiz

Deployed from: `/home/aditya/Thermodynamics related/Pure_substances/web_app_properties_pure_substance/`

Files copied to: `teaching/thermo/tools/steam_property_quiz/`

Files:
- index.html
- styles.css
- app.js
- data/property_grid.json
- data/saturation_dome.json
- data/saturation_tables.json

Accessible at: https://aditya-bandopadhyay.github.io/teaching/thermo/tools/steam_property_quiz/

## Directory Structure

```
teaching/thermo/
├── index.html                          (Landing page listing all tools)
└── tools/                              (All interactive tools)
    ├── steam_property_lookup/
    └── steam_property_quiz/
```

## Deployment Steps

After making changes:

1. Commit with descriptive message
2. Push to the repository
3. Verify tools are accessible at the URLs above

Note: The data/ folder structure must be preserved. The JSON files are loaded via fetch at runtime.
