import os
import re
from pathlib import Path
import unicodedata

chapter_num = 1

def clean_filename(title):
    # Normalize Unicode characters
    title = unicodedata.normalize('NFKC', title)
    # Remove special characters and convert to lowercase
    cleaned = re.sub(r'[^\w\s-]', '', title.lower())
    # Replace spaces with hyphens
    cleaned = re.sub(r'\s+', '-', cleaned)
    return cleaned

def normalize_title(title):
    # Remove HTML-like formatting
    title = re.sub(r'\{[^}]*\}', '', title)
    # Convert Roman numerals to Arabic numbers (including Unicode variants)
    title = re.sub(r'\bⅠ\b|\bI\b', '1', title)
    title = re.sub(r'\bⅡ\b|\bII\b', '2', title)
    title = re.sub(r'\bⅢ\b|\bIII\b', '3', title)
    title = re.sub(r'\bⅣ\b|\bIV\b', '4', title)
    title = re.sub(r'\bⅤ\b|\bV\b', '5', title)
    title = re.sub(r'\bⅥ\b|\bVI\b', '6', title)
    title = re.sub(r'\bⅰ\b|\bi\b', '1', title, flags=re.IGNORECASE)
    # Normalize decimal numbers
    title = re.sub(r'(\d+)\.(\d+)', r'\1-\2', title)
    # Remove any remaining special characters and convert to lowercase
    title = re.sub(r'[^\w\s-]', '', title.lower())
    # Replace spaces with hyphens and normalize multiple hyphens
    title = re.sub(r'\s+', '-', title.strip())
    title = re.sub(r'-+', '-', title)
    return title

def get_base_title(title):
    # Remove part numbers and similar suffixes
    base = re.sub(r'\s*[-:]\s*(part|chapter).*$', '', title, flags=re.IGNORECASE)
    return base.strip()

def get_chapter_content(chapter, is_interlude=False):
    # Split into lines
    lines = chapter.split('\n')
    
    # Skip empty lines at start
    while lines and not lines[0].strip():
        lines = lines[1:]
        
    # Skip title lines and HTML-like formatting at start
    while lines and (lines[0].strip().startswith('#') or lines[0].strip().startswith('{')):
        lines = lines[1:]
    
    # Process content
    content = []
    in_content = False
    in_quote = False
    quote_buffer = []
    
    for line in lines:
        stripped = line.strip()
        
        # Skip HTML-like formatting markers
        if (stripped.startswith('{') or stripped.startswith('[') or 
            stripped == ':::' or stripped.startswith('.calibre')):
            continue
            
        # Handle blockquotes
        if stripped.startswith('>'):
            if not in_quote:
                in_quote = True
            quote_buffer.append(line)
            continue
        elif in_quote and not stripped:
            in_quote = False
            if quote_buffer:
                content.extend(quote_buffer)
                content.append('')
                quote_buffer = []
            continue
            
        # Stop at next major section marker
        if stripped.startswith('## ') or stripped.startswith('# '):
            if in_content:  # Only break if we've seen actual content
                break
            continue
            
        # Skip chapter notes sections
        if stripped.startswith('Chapter Notes'):
            continue
            
        # Consider this actual content
        if stripped:
            in_content = True
            
        # Add line if it's not just formatting
        if not any(marker in stripped for marker in ['{#', 'userstuff', '.calibre']):
            content.append(line)
    
    # Add any remaining quotes
    if quote_buffer:
        content.extend(quote_buffer)
    
    # Join lines back together
    content = '\n'.join(content)
    
    # Remove any trailing whitespace
    content = content.strip()
    
    return content

def split_chapters(input_file, output_dir):
    global chapter_num
    
    # Read input file
    with open(input_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove lines starting with ::: or []{
    content = re.sub(r'^:::.*\n?', '', content, flags=re.MULTILINE)
    content = re.sub(r'^:::.*\n?', '', content, flags=re.MULTILINE)
    
    # Remove any minimal string wrapped between an opening {. or {# and a closing }
    content = re.sub(r'\{[\.#].*?\}', '', content)
    
    # Remove lines that contain nothing other than blank chars or [ and ], and which has at least one of [ or ]
    content = re.sub(r'\n( *[\[\]] *)+\n', '\n', content)
    
    # Contract consecutive empty lines
    while '\n\n\n' in content:
        content = content.replace('\n\n\n', '\n\n')
    
    # Remove lines starting with "### End" or "#### End" or "## End"
    content = re.sub(r'^### End.*\n?', '', content, flags=re.MULTILINE)
    content = re.sub(r'^#### End.*\n?', '', content, flags=re.MULTILINE)
    content = re.sub(r'^## End.*\n?', '', content, flags=re.MULTILINE)
    
    # Remove isolated new lines, where there is at least one latin letter between it and the previous \n, or between it and the next \n
    old_content = ''
    while old_content != content:
        old_content = content
        content = re.sub(r'([a-zA-Z.,!?:;\"\'])[^a-zA-Z.,!?:;\"\'\n]*\n[^a-zA-Z.,!?:;\"\'\n]*([a-zA-Z.,!?:;\"\'])', r'\1 \2', content)
    
    # Remove a heading line if it is identical to the line after it (separated by a blank line)
    content = re.sub(r'^#.*\n\n(#.*\n?)', r'\1', content, flags=re.MULTILINE)
    
    # Write back to file
    with open(input_file, 'w', encoding='utf-8') as f:
        f.write(content)
    
    # Split on chapter markers
    chapters = re.split(r'(?m)^# |^## ', content)
    
    # Process remaining chapters
    for chapter in chapters:
        if len(chapter.strip()) < 1000:
            continue
        
        # Extract title, handling HTML-like formatting
        title_match = re.search(r'^[^{}\n]+', chapter)
        if title_match:
            title = title_match.group().strip()
            # Normalize title
            normalized_title = normalize_title(title)
            filename = f"{str(chapter_num).zfill(3)}-chapter-{normalized_title}.md"
            filepath = os.path.join(output_dir, filename)
            
            # Get chapter content
            content = get_chapter_content(chapter)
            
            # Write chapter file if there's content
            if content.strip():
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(f"# ")
                    f.write(content)
                
                chapter_num += 1

def main():
    # Create output directories if they don't exist
    for i in range(1, 5):
        if os.path.exists(f'books_en/{str(i).zfill(2)}/text_en.md'):
            input_file = f'books_en/{str(i).zfill(2)}/text_en.md'
            output_dir = f'books_en/{str(i).zfill(2)}'
        else:
            input_file = f'{str(i).zfill(2)}/text_en.md'
            output_dir = f'{str(i).zfill(2)}'
        
        if not os.path.exists(input_file):
            print(f"Input file {input_file} not found")
            continue
            
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
        
        print(f"Processing {input_file}...")
        split_chapters(input_file, output_dir)
        print(f"Finished processing {input_file}")

if __name__ == '__main__':
    main() 