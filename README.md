# Website Content Management Guide

This repository contains the source code for Aditya Bandopadhyay's academic website. This guide explains how to update the content (Publications, Patents, Talks) using the provided automated scripts.

## Directory Structure
- `scripts/`: Contains Python scripts for content generation and injection.
  - `generate_content.py`: Reads CSV files and generates HTML snippets.
  - `inject_content.py`: Injects the generated HTML into the main website files.
- `generated_content.html`: Intermediate file containing the generated HTML (can be ignored/deleted).
- `publications.html`: The main publications page.
- `patents.html`: The main patents page.

## How to Update Content

The website content is driven by CSV files located in your shared CV directory.

**CSV Locations (Default):**
- `/home/aditya/shared_folder/CV material/CV Material - Aditya - PapersCV.csv`
- `/home/aditya/shared_folder/CV material/CV Material - Aditya - Patents.csv`
- `/home/aditya/shared_folder/CV material/CV Material - Aditya - Talks & Conferences.csv`

### Step 1: Update the CSV Files
Add your newest papers, patents, or talks to the respective CSV files. Ensure you maintain the existing column structure.

### Step 2: Run the Update Script
I have provided a convenience shell script `update_content.sh` that automates the process.

```bash
./update_content.sh
```

This script performs the following:
1.  Runs `scripts/generate_content.py` to parse the CSVs.
2.  Saves the output to `generated_content.html`.
3.  Runs `scripts/inject_content.py` to safely update `publications.html` and `patents.html` with the new data.

### Manual Update (If needed)
If you prefer to run the steps manually:
```bash
# 1. Generate content
python3 scripts/generate_content.py > generated_content.html

# 2. Inject content
python3 scripts/inject_content.py
```

## Deploying Changes

To push your changes to GitHub (and thus update the live website), use the `deploy.sh` script.

```bash
./deploy.sh "Optional commit message here"
```

If no message is provided, it defaults to "Update website content".

This script will:
1.  Add all changes (`git add .`)
2.  Commit with the provided message.
3.  Push to the `main` branch of the remote repository.

## File and Script Glossary

To help manage the repository, here is a description of the key files and scripts:

### Root Level Scripts
- `deploy.sh`: Automates the Git workflow. It adds all changes, commits with a message (defaults to "Update website content"), and pushes to the `main` branch.
- `update_content.sh`: Orchestrates the transition from raw data to a live site. It runs the content generation and injection scripts in sequence.
- `run_server.sh`: Starts a local Python HTTP server on `http://localhost:8000`. Use this to preview your changes before deploying.

### Directories and Support Files
- `scripts/`: Contains the core logic for content management.
  - `generate_content.py`: Parses CSV files (Papers, Patents, Talks) and creates HTML fragments.
  - `inject_content.py`: Updates `publications.html` and `patents.html` by inserting the generated fragments.
- `teaching/`: Contains teaching-related interactive tools and landing pages.
  - `thermo/`: Dedicated landing page and tools for Thermodynamics (e.g., `steam.html`).
- `scientific_computing/`: Contains resources, code samples, and materials for the Scientific Computing course.
- `styles.css`: The primary CSS file defining the minimalist academic aesthetic of the entire site.
- `teaching_resources.md`: A checklist and set of notes for deploying new interactive tools.
- `index_builder.md`: Reference notes for maintaining the main site navigation and structure.

## Troubleshooting

- **Missing Content?** Check if the CSV file path in `scripts/generate_content.py` is correct.
- **Markers Missing?** The injection script relies on `<!-- PAPERS START -->`, `<!-- PAPERS END -->`, etc. If these markers are accidentally deleted from the HTML files, the injection will fail. You may need to manually restore them or revert the file.
