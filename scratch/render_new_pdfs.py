import pypdfium2 as pdfium
import os

pdfs = [
    r"C:\Users\Administrator\Downloads\EmadHFFpaperCyprus.pdf",
    r"C:\Users\Administrator\Downloads\INTEGRATING_GIS_AND_PHOTOGRAMMETRIC_RECORDING_FOR_.pdf"
]
output_base = r"C:\Users\Administrator\Downloads\Alexandria_Survey_App\artifacts"

for pdf_path in pdfs:
    name = os.path.basename(pdf_path).replace(".pdf", "")
    output_dir = os.path.join(output_base, f"{name}_images")
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    pdf = pdfium.PdfDocument(pdf_path)
    for i in range(len(pdf)):
        page = pdf[i]
        bitmap = page.render(scale=2)
        pil_image = bitmap.to_pil()
        pil_image.save(os.path.join(output_dir, f"page_{i+1}.png"))
        print(f"Saved {name} page {i+1}")
    pdf.close()
