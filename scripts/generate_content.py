import csv
import os

# Define file paths
BASE_DIR = '/home/aditya/shared_folder/CV material/'
PAPERS_CSV = os.path.join(BASE_DIR, 'CV Material - Aditya - PapersCV.csv')
PATENTS_CSV = os.path.join(BASE_DIR, 'CV Material - Aditya - Patents.csv')
TALKS_CSV = os.path.join(BASE_DIR, 'CV Material - Aditya - Talks & Conferences.csv')

def generate_papers_html():
    print("<!-- PAPERS START -->")
    print("<h3>Journal Publications</h3>")
    print("<ol reversed>") # Use reversed ordered list for chronological order if CSV is sorted that way, or just standard ranking
    
    with open(PAPERS_CSV, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        # Skip header (it seems to span multiple lines or be weird, so we'll inspect)
        # Based on inspection: 
        # Line 1: Name of all Authors,...
        # Line 2: the paper",No. of papers
        # Line 3: Actual data
        
        lines = list(reader)
        # Find start of data. Line 3 (index 2) usually.
        # Let's inspect the first few rows to be safe?
        # The user file view showed data starting at line 3 (index 2).
        
        data_rows = lines[1:] 
        
        # Reverse to show newest first if they are ordered 1..N in CSV
        # The CSV has a "No. of papers" column at the end, counting up.
        # So last row is newest. We probably want newest first.
        for row in reversed(data_rows):
            if not row or len(row) < 5: continue
            
            # Map columns based on inspection
            # 0: Authors
            # 1: Title
            # 2: Journal
            # 3: ISSN
            # 4: Vol, Date, PP
            # 5: DOI
            
            authors = row[0].strip()
            title = row[1].strip()
            journal = row[2].strip()
            details = row[4].strip()
            doi_link = row[5].strip()
            
            # Formatting authors: Make "Bandopadhyay, A." or "Bandopadhyay Aditya" bold?
            # User didn't ask, but it's nice. Let's keep it simple first.
            
            html_entry = f'<li>{authors}, "<strong>{title}</strong>", <em>{journal}</em>, {details}. <a href="{doi_link}" target="_blank">[DOI]</a></li>'
            print(html_entry)
            
    print("</ol>")
    print("<!-- PAPERS END -->")

def generate_patents_html():
    print("<!-- PATENTS START -->")
    print("<h3>Granted Patents</h3>")
    print("<ul>")
    
    pending_html = []
    
    with open(PATENTS_CSV, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        next(reader) # Skip header
        
        for row in reader:
            if not row: continue
            # 0: Index, 1: Title, 2: Applicants, 3: Patent No, 4: Date, 5: Agency, 6: Status
            
            if len(row) < 7: continue
            
            title = row[1].strip()
            applicants = row[2].strip()
            patent_no = row[3].strip()
            status = row[6].strip()
            
            if "Granted" in status:
                print(f'<li><strong>{title}</strong><br>Applicants: {applicants}<br>Patent No: {patent_no} ({status})</li>')
            else:
                pending_html.append(f'<li><strong>{title}</strong><br>Applicants: {applicants}<br>Status: {status} ({patent_no})</li>')

    print("</ul>")
    
    if pending_html:
        print("<h3>Filed Applications</h3>")
        print("<ul>")
        for entry in pending_html:
            print(entry)
        print("</ul>")
        
    print("<!-- PATENTS END -->")

def generate_talks_html():
    print("<!-- TALKS START -->")
    print("<h3>Talks and Conferences</h3>")
    print("<ul>")
    
    with open(TALKS_CSV, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        # Header seems missing or empty line 1
        
        for row in reader:
            if not row: continue
            # Check if it's a valid data row
            if len(row) < 5: continue
            
            # Based on inspection:
            # 0: Empty?
            # 1: Authors/Speaker
            # 2: Title
            # 3: Conference
            # 4: Date
            
            # Simple heuristic to skip empty or header-like rows
            if "Bandopadhyay" not in row[1] and "Speaker" not in row[1]:
                # potentially a header or garbage
                # But looking at line 1: ,"Bikash Mohanty, Aditya Bandopadhyay"...
                # So if col 1 has content, it's likely a row.
                pass
            
            if not row[1].strip(): continue
            
            authors = row[1].strip()
            title = row[2].strip()
            conf = row[3].strip()
            date = row[4].strip()
            
            # Heuristic for unstructured rows (common in the bottom of that CSV)
            # If title is empty, but authors field is long, it might be a full citation.
            if not title and len(authors) > 20:
                print(f'<li>{authors}</li>')
            else:
                 print(f'<li>{authors}, "<strong>{title}</strong>", <em>{conf}</em>, {date}.</li>')

    print("</ul>")
    print("<!-- TALKS END -->")

if __name__ == "__main__":
    generate_papers_html()
    print("\n" + "="*50 + "\n")
    generate_patents_html()
    print("\n" + "="*50 + "\n")
    generate_talks_html()
