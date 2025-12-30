"""
PDF Processor

Core PDF manipulation logic using PyMuPDF (fitz).
Handles coordinate conversion and text/data injection.
"""

import base64
import fitz  # PyMuPDF
from typing import Any
from datetime import datetime


class PDFProcessor:
    """
    Processes PDFs by injecting data at specified field locations.
    
    Field positions are stored as percentages (0.0 - 1.0) of page dimensions.
    This ensures consistent placement regardless of the viewer's zoom/DPI.
    """
    
    # Default text settings
    DEFAULT_FONT = "helv"  # Helvetica
    DEFAULT_FONTSIZE = 11
    DEFAULT_TEXT_COLOR = (0, 0, 0)  # Black
    
    # Checkbox markers
    CHECKBOX_CHECKED = "☑"
    CHECKBOX_UNCHECKED = "☐"
    
    def __init__(
        self,
        font: str = DEFAULT_FONT,
        fontsize: int = DEFAULT_FONTSIZE,
        text_color: tuple[float, float, float] = DEFAULT_TEXT_COLOR,
    ):
        self.font = font
        self.fontsize = fontsize
        self.text_color = text_color
    
    def get_page_count(self, pdf_base64: str) -> int:
        """Get the number of pages in a PDF."""
        pdf_bytes = base64.b64decode(pdf_base64)
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        count = len(doc)
        doc.close()
        return count
    
    def process(
        self,
        pdf_base64: str,
        template: Any,  # Template Pydantic model
        data: dict[str, Any],
    ) -> bytes:
        """
        Process a PDF by injecting data at field locations.
        
        Args:
            pdf_base64: Base64-encoded PDF binary
            template: Template object with field definitions
            data: Dictionary of field_key -> value to inject
            
        Returns:
            Processed PDF as bytes
        """
        # Decode PDF
        pdf_bytes = base64.b64decode(pdf_base64)
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        
        try:
            # Process each field
            for field in template.fields:
                value = data.get(field.key)
                
                # Skip if no value provided (blank fields allowed)
                if value is None or value == "":
                    continue
                
                # Get the page (0-indexed internally, 1-indexed in template)
                page_index = field.page_number - 1
                if page_index < 0 or page_index >= len(doc):
                    continue
                    
                page = doc[page_index]
                page_rect = page.rect
                
                # Convert percentage coordinates to PDF coordinates
                # PDF coordinates: origin is top-left in PyMuPDF
                x0 = field.rect.x * page_rect.width
                y0 = field.rect.y * page_rect.height
                x1 = (field.rect.x + field.rect.w) * page_rect.width
                y1 = (field.rect.y + field.rect.h) * page_rect.height
                
                # Create the text box rectangle
                text_rect = fitz.Rect(x0, y0, x1, y1)
                
                # Handle different field types
                if field.type == "checkbox":
                    self._inject_checkbox(page, text_rect, bool(value))
                elif field.type == "date":
                    self._inject_date(page, text_rect, str(value))
                else:  # text
                    self._inject_text(page, text_rect, str(value))
            
            # Save to bytes
            output = doc.tobytes()
            return output
            
        finally:
            doc.close()
    
    def _inject_text(self, page: fitz.Page, rect: fitz.Rect, text: str) -> None:
        """
        Inject text into a rectangular area with automatic wrapping.
        
        Uses insert_textbox for proper text wrapping within the field bounds.
        """
        # Calculate font size that fits the height if default is too big
        fontsize = min(self.fontsize, rect.height * 0.8)
        
        page.insert_textbox(
            rect,
            text,
            fontname=self.font,
            fontsize=fontsize,
            color=self.text_color,
            align=fitz.TEXT_ALIGN_LEFT,
        )
    
    def _inject_date(self, page: fitz.Page, rect: fitz.Rect, date_str: str) -> None:
        """
        Inject a date value, attempting to format it nicely.
        """
        # Try to parse and format the date
        formatted_date = date_str
        try:
            # Try ISO format first
            dt = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
            formatted_date = dt.strftime("%m/%d/%Y")
        except (ValueError, AttributeError):
            # Keep original if parsing fails
            pass
        
        self._inject_text(page, rect, formatted_date)
    
    def _inject_checkbox(self, page: fitz.Page, rect: fitz.Rect, checked: bool) -> None:
        """
        Inject a checkbox marker.
        
        Uses Unicode checkbox characters centered in the field.
        """
        marker = self.CHECKBOX_CHECKED if checked else self.CHECKBOX_UNCHECKED
        
        # Center the checkbox marker
        fontsize = min(rect.height * 0.9, rect.width * 0.9)
        
        page.insert_textbox(
            rect,
            marker,
            fontname=self.font,
            fontsize=fontsize,
            color=self.text_color,
            align=fitz.TEXT_ALIGN_CENTER,
        )


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# STANDALONE TESTING
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


if __name__ == "__main__":
    # Test with a sample PDF
    print("PDF Processor initialized successfully")
    print(f"PyMuPDF version: {fitz.version}")
