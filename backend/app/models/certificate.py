from datetime import datetime, timezone
import uuid
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from app.core.database import Base


class Certificate(Base):
    __tablename__ = "certificates"

    id = Column(Integer, primary_key=True, index=True)
    attempt_id = Column(Integer, ForeignKey("attempts.id", ondelete="CASCADE"), unique=True, nullable=False)
    certificate_code = Column(
        String,
        unique=True,
        index=True,
        default=lambda: f"QF-{uuid.uuid4().hex[:8].upper()}",
        nullable=False
    )
    issued_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relationships
    attempt = relationship("Attempt", back_populates="certificate")
