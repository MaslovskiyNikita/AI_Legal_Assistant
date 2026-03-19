from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, func, Text
from sqlalchemy.orm import relationship
from app.core.database import Base



class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    message_id = Column(Integer, ForeignKey("messages.id", ondelete="CASCADE"), nullable=True)
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    #parsed_text = Column(Text, nullable=True) 
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    

    message = relationship("Message", back_populates="documents")