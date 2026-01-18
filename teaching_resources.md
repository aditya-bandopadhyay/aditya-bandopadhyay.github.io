Deploy the Steam Property Lookup Tool to GitHub Pages

Copy the following files from /home/aditya/Thermodynamics related/Ch1_properties_pure_substances/ to my GitHub Pages repository:

Files to copy:

index.html
styles.css
app.js
data/saturation_dome.json
data/saturation_tables.json
data/property_grid.json
Deployment location: Place these in a subdirectory called steam-properties/ (or at root if preferred).

After copying:

Commit with message: "Add interactive steam property lookup tool"
Push to the repository
Verify the tool is accessible at https://aditya-bandopadhyay.github.io/steam-properties/
Note: The data/ folder structure must be preserved. The JSON files are loaded via fetch at runtime.
