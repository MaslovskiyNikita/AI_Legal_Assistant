from sqlalchemy import Column, Integer, BigInteger, String, DateTime, func
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    telegram_id = Column(BigInteger, unique=True, index=True, nullable=False) 

    username = Column(String, nullable=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=True)
    photo_url = Column(String, nullable=True) 

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    documents_analyzed = Column(Integer, default=0)
    consultations_count = Column(Integer, default=0)