import sys
import re
import json
from fpdf import FPDF

FONT_DIR = '/usr/share/fonts/truetype/dejavu'

def clean_text(text):
    if not isinstance(text, str):
        text = str(text)
    text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]', '', text)
    text = re.sub(r'[\ud800-\udfff\ufdd0-\ufdef\ufffe\uffff]', '', text)
    text = text.replace('\r\n', '\n').replace('\r', '\n')
    return text

class ArticlePDF(FPDF):
    def header(self):
        pass
    def footer(self):
        self.set_y(-15)
        self.set_font('DejaVu', 'I', 8)
        self.cell(0, 10, f'Page {self.page_no()}/{{nb}}', 0, 0, 'C')

def make_pdf(title, authors, source, doi, abstract, text_pages, output_path):
    pdf = ArticlePDF()
    pdf.add_font('DejaVu', '', f'{FONT_DIR}/DejaVuSans.ttf')
    pdf.add_font('DejaVu', 'B', f'{FONT_DIR}/DejaVuSans-Bold.ttf')
    pdf.add_font('DejaVu', 'I', f'{FONT_DIR}/DejaVuSans-Oblique.ttf')
    pdf.add_font('DejaVu', 'BI', f'{FONT_DIR}/DejaVuSans-BoldOblique.ttf')

    pdf.alias_nb_pages()
    pdf.set_auto_page_break(auto=True, margin=20)
    pdf.add_page()

    pdf.set_font('DejaVu', 'B', 14)
    pdf.multi_cell(0, 7, clean_text(title))
    pdf.ln(3)

    if authors:
        pdf.set_font('DejaVu', '', 10)
        pdf.multi_cell(0, 5, 'Authors: ' + clean_text(authors))
        pdf.ln(2)

    pdf.set_font('DejaVu', '', 9)
    meta = 'Source: ' + clean_text(source)
    if doi:
        meta += ' | DOI: ' + clean_text(doi)
    pdf.multi_cell(0, 5, meta)
    pdf.ln(3)

    if abstract:
        pdf.set_font('DejaVu', 'B', 12)
        pdf.cell(0, 7, 'Abstract')
        pdf.ln()
        pdf.set_font('DejaVu', '', 9)
        pdf.multi_cell(0, 5, clean_text(abstract))
        pdf.ln(3)

    if text_pages:
        pdf.set_font('DejaVu', 'B', 12)
        pdf.cell(0, 7, 'Full Text')
        pdf.ln()
        pdf.set_font('DejaVu', '', 9)
        for page in text_pages:
            pdf.multi_cell(0, 5, clean_text(page))
            pdf.add_page()

    pdf.output(output_path)

if __name__ == '__main__':
    data = json.loads(sys.stdin.read())
    make_pdf(
        data.get('title', ''),
        data.get('authors', ''),
        data.get('source', ''),
        data.get('doi', ''),
        data.get('abstract', ''),
        data.get('text_pages', []),
        data.get('output', '/tmp/article.pdf')
    )
