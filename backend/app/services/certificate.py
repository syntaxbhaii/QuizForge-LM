import io
from datetime import datetime
from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER
from reportlab.pdfgen import canvas


class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.pages = []

    def showPage(self):
        self.pages.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        page_count = len(self.pages)
        for page in self.pages:
            self.__dict__.update(page)
            self.draw_certificate_border()
            super().showPage()
        super().save()

    def draw_certificate_border(self):
        # We are in landscape(letter) -> 792 x 612
        width, height = 792, 612
        
        # Outer Border
        self.setStrokeColor(colors.HexColor("#1e293b"))  # Slate-800
        self.setLineWidth(8)
        self.rect(20, 20, width - 40, height - 40)
        
        # Inner Gold Border
        self.setStrokeColor(colors.HexColor("#d97706"))  # Amber-600 (Gold)
        self.setLineWidth(2)
        self.rect(28, 28, width - 56, height - 56)
        
        # Decorative corners
        self.setFillColor(colors.HexColor("#d97706"))
        # Top-Left
        self.rect(28, height - 38, 10, 10, fill=True, stroke=False)
        self.rect(38, height - 28, 10, 10, fill=True, stroke=False)
        # Top-Right
        self.rect(width - 38, height - 38, 10, 10, fill=True, stroke=False)
        self.rect(width - 48, height - 28, 10, 10, fill=True, stroke=False)
        # Bottom-Left
        self.rect(28, 28, 10, 10, fill=True, stroke=False)
        self.rect(38, 38, 10, 10, fill=True, stroke=False)
        # Bottom-Right
        self.rect(width - 38, 28, 10, 10, fill=True, stroke=False)
        self.rect(width - 48, 38, 10, 10, fill=True, stroke=False)


def generate_certificate_pdf(
    student_name: str,
    quiz_title: str,
    score_percentage: float,
    completion_date: datetime,
    certificate_code: str
) -> bytes:
    """
    Generates an elegant certificate PDF in landscape and returns the bytes.
    """
    buffer = io.BytesIO()
    
    # Page size: 792 x 612 (landscape letter)
    doc = SimpleDocTemplate(
        buffer,
        pagesize=landscape(letter),
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )
    
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        name="CertTitle",
        fontName="Helvetica-Bold",
        fontSize=32,
        leading=38,
        textColor=colors.HexColor("#1e293b"),
        alignment=TA_CENTER
    )
    
    subtitle_style = ParagraphStyle(
        name="CertSubTitle",
        fontName="Helvetica-Oblique",
        fontSize=14,
        leading=18,
        textColor=colors.HexColor("#475569"),
        alignment=TA_CENTER
    )
    
    name_style = ParagraphStyle(
        name="CertName",
        fontName="Helvetica-Bold",
        fontSize=26,
        leading=32,
        textColor=colors.HexColor("#0f172a"),  # Slate-900
        alignment=TA_CENTER
    )
    
    body_style = ParagraphStyle(
        name="CertBody",
        fontName="Helvetica",
        fontSize=14,
        leading=20,
        textColor=colors.HexColor("#334155"),
        alignment=TA_CENTER
    )
    
    quiz_style = ParagraphStyle(
        name="CertQuiz",
        fontName="Helvetica-Bold",
        fontSize=18,
        leading=22,
        textColor=colors.HexColor("#d97706"),  # Amber-600
        alignment=TA_CENTER
    )
    
    meta_style = ParagraphStyle(
        name="CertMeta",
        fontName="Helvetica",
        fontSize=11,
        leading=15,
        textColor=colors.HexColor("#64748b"),
        alignment=TA_CENTER
    )
    
    story = []
    
    # Logo / Top Brand
    story.append(Paragraph("Q U I Z F O R G E", subtitle_style))
    story.append(Spacer(1, 20))
    
    # Main Header
    story.append(Paragraph("CERTIFICATE OF COMPLETION", title_style))
    story.append(Spacer(1, 15))
    
    # Presentation Line
    story.append(Paragraph("PROUDLY PRESENTED TO", subtitle_style))
    story.append(Spacer(1, 15))
    
    # Student Name
    story.append(Paragraph(student_name.upper(), name_style))
    story.append(Spacer(1, 10))
    
    # Body text
    story.append(Paragraph("for successfully demonstrating competence and passing the assessment", body_style))
    story.append(Spacer(1, 12))
    
    # Quiz Title
    story.append(Paragraph(quiz_title, quiz_style))
    story.append(Spacer(1, 15))
    
    # Details: Score & Date
    date_str = completion_date.strftime("%B %d, %Y")
    story.append(Paragraph(
        f"Achieved a passing score of <b>{score_percentage:.1f}%</b> on <b>{date_str}</b>", 
        body_style
    ))
    story.append(Spacer(1, 40))
    
    # Footer Metadata: Certificate Code & Issuer Signature line
    metadata_text = (
        f"Verification Code: <b>{certificate_code}</b> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; "
        f"Authorized by: <b>QuizForge Administration</b>"
    )
    story.append(Paragraph(metadata_text, meta_style))
    
    # Build Document using NumberedCanvas which draws borders
    doc.build(story, canvasmaker=NumberedCanvas)
    
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
