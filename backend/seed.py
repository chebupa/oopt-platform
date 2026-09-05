from sqlalchemy.orm import Session
from database import SessionLocal
from models import User, RoleEnum
import auth

DEFAULT_USERS = [
    ("inspector@example.com", "password", RoleEnum.inspector),
    ("volunteer@example.com", "password", RoleEnum.volunteer),
    ("citizen@example.com", "password", RoleEnum.citizen),
]

def seed_users():
    db: Session = SessionLocal()
    try:
        for email, password, role in DEFAULT_USERS:
            existing = db.query(User).filter(User.email == email).first()
            if not existing:
                hashed = auth.get_password_hash(password)
                user = User(email=email, hashed_password=hashed, role=role)
                db.add(user)
                print(f"Created default user: {email} ({role})")
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error seeding users: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_users()
