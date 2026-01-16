import os

BASE_DIR = '/home/aditya/github_website/'
GENERATED_FILE = os.path.join(BASE_DIR, 'generated_content.html')
PUB_FILE = os.path.join(BASE_DIR, 'publications.html')
PAT_FILE = os.path.join(BASE_DIR, 'patents.html')

def get_section(content, start_marker, end_marker):
    start = content.find(start_marker)
    end = content.find(end_marker)
    if start == -1 or end == -1:
        return ""
    # Include the content inside markers, but maybe exclude markers themselves? 
    # The markers are <!-- ... -->. Let's include them for clarity or exclude. 
    # Current script prints markers.
    return content[start:end+len(end_marker)]

def inject_publications():
    with open(GENERATED_FILE, 'r') as f:
        gen_content = f.read()
    
    papers_html = get_section(gen_content, '<!-- PAPERS START -->', '<!-- PAPERS END -->')
    talks_html = get_section(gen_content, '<!-- TALKS START -->', '<!-- TALKS END -->')
    
    with open(PUB_FILE, 'r') as f:
        pub_content = f.read()
    
    # Target insertion point in publications.html
    # We want to keep <h1> and the intro <p>.
    # We want to replace "<h3>Recent Highlights</h3>...<p>For a full list...</p>"
    
    # Strategy: Check if we have already injected content.
    if '<!-- PAPERS START -->' in pub_content:
        # Replacement mode
        start_marker = '<!-- PAPERS START -->'
        end_marker = '<!-- TALKS END -->'
        
        start_idx = pub_content.find(start_marker)
        if start_idx == -1: return
        
        # We need to find end of text.
        end_idx = pub_content.find(end_marker)
        if end_idx == -1: return
        
        end_cut = end_idx + len(end_marker)
        
        # We replace the entire block with new generated content
        # Note: generated content contains the markers, so this is safe.
        new_content = pub_content[:start_idx] + papers_html + "\n<hr>\n" + talks_html + pub_content[end_cut:]
        
    else:
        # Initial injection mode
        start_marker = '<h3>Recent Highlights</h3>'
    
        if start_marker not in pub_content:
            print("Could not find start marker in publications.html")
            return

        # Construct new content
        start_idx = pub_content.find(start_marker)
        
        end_marker_text = 'Google Scholar</a>.</p>'
        end_marker_idx = pub_content.find(end_marker_text)
        
        if end_marker_idx == -1:
            print("Could not find end marker in publications.html")
            return
            
        end_cut = end_marker_idx + len(end_marker_text)
        
        new_content = pub_content[:start_idx] + papers_html + "\n<hr>\n" + talks_html + pub_content[end_cut:]
    
    with open(PUB_FILE, 'w') as f:
        f.write(new_content)
    print("Updated publications.html")

def inject_patents():
    with open(GENERATED_FILE, 'r') as f:
        gen_content = f.read()
    
    patents_html = get_section(gen_content, '<!-- PATENTS START -->', '<!-- PATENTS END -->')
    
    with open(PAT_FILE, 'r') as f:
        pat_content = f.read()
        
    # Strategy: Check if already injected
    if '<!-- PATENTS START -->' in pat_content:
        start_marker = '<!-- PATENTS START -->'
        end_marker = '<!-- PATENTS END -->'
        
        start_idx = pat_content.find(start_marker)
        end_idx = pat_content.find(end_marker)
        
        if start_idx == -1 or end_idx == -1:
            print("Markers corrupted in patents.html")
            return
            
        end_cut = end_idx + len(end_marker)
        
        # We also need to be careful about what comes after.
        # Original: ... <ul> ... </ul> </div>
        # Generated: ... <!-- PATENTS END -->
        # In my initial injection, I replaced from '<h3>Granted Patents</h3>' to a '</div>'.
        # And replaced it with patents_html (which includes markers).
        
        # So we just replace the block between markers (inclusive).
        new_content = pat_content[:start_idx] + patents_html + pat_content[end_cut:]
        
    else:
        start_marker = '<h3>Granted Patents</h3>'
        # End marker: The last </ul> in the file? 
        # The file has: <h3>Filed Applications</h3> ... </ul> </div>
        # We want to replace from '<h3>Granted Patents</h3>' to the end of the lists.
        
        if start_marker not in pat_content:
            print("Could not find start marker in patents.html")
            return
            
        start_idx = pat_content.find(start_marker)
        
        # Determine where the content ends. It ends at </div> showing the end of card.
        # We can search for the last </div> in the file, which closes .container? No.
        # Structure: <div class="card"> ... </div> </div> <footer>
        # So we look for </div>\n    </div>
        
        # To be safe, let's look for the text immediately preceding the closing div in the original file.
        # The original file ends with:
        # <ul>
        #   <li>[App No./Title] ...</li>
        # </ul>
        # </div>
        
        # Let's just find '</div>' after start_marker. Since no divs inside, the first </div> is the card closer.
        end_idx = pat_content.find('</div>', start_idx)
        
        if end_idx == -1:
            print("Could not find closing div in patents.html")
            return
            
        new_content = pat_content[:start_idx] + patents_html + '\n' + pat_content[end_idx:]
    
    with open(PAT_FILE, 'w') as f:
        f.write(new_content)
    print("Updated patents.html")

if __name__ == "__main__":
    inject_publications()
    inject_patents()
