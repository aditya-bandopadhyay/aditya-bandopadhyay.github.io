# FSD: Steam Property Quiz Module

## 1. Objective
Interactive quiz where students solve for missing steam properties.
Full tables provided on demand - students determine phase and interpolate.

## 2. Scope
- **Regions:** Saturated and Superheated only.
- **Data:** Pre-generated JSON (IAPWS-IF97 origin).

## 3. Technical Specs
- **Theme:** Plain UI with white background (gray in dark mode). Use Times New Roman font for all text.
- **Validation:** +/- 0.5% tolerance.
- **Code Style:** Descriptive function names, physics-focused comments.

## 4. Answer Interface
Single-row table:
| Phase | P | T | v | h | s | u | x |
|-------|---|---|---|---|---|---|---|
| [dropdown] | [given/input] | ... | ... | ... | ... | ... | [if sat] |
## 6. User Guidance

- **Instruction:** Enter the unknown properties in the input fields, select the phase, and click **Check** to validate or **Submit** to view the correct answers. Refer to the property tables for reference.
- **Bug Reporting:** If you encounter any issues, please email aditya-at-mech-dot-iitkgp-dot-ac-dot-in.

## 5. Property Tables (Sonntag-style)

### Saturation Tables
Two sub-tabs:
- **By Temperature:** 5°C increments (0, 5, 10, ... 370°C)
- **By Pressure:** Nice values: 1, 5, 10, 25, 50, 75, 100, 150, 200, 300, 400, 500, 750, 1000, 1500, 2000, 3000, 5000, 7500, 10000 kPa

**Table Styling:**
- Modal width: 90vw (max-width: 1200px) for better readability
- Alternating row colors for easy lookup and to prevent parallax errors

### Superheated Table
Grouped by pressure with header rows:
```
P = 10 kPa (T_sat = 45.8°C)
  T    v       h       s       u
  50   ...     ...     ...     ...
  100  ...     ...     ...     ...
  ...

P = 100 kPa (T_sat = 99.6°C)
  T    v       h       s       u
  ...
```

Pressure values: 10, 50, 100, 200, 300, 400, 500, 750, 1000, 1500, 2000, 3000, 5000, 7500, 10000 kPa

Temperature increments: 50°C steps within each pressure block.

## 6. Files
```
web_app_properties_pure_substance/
  index.html
  styles.css
  app.js
  data/
    saturation_tables.json
    property_grid.json
```