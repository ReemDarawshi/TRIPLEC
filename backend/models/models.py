# קובץ זה מגדיר את כל מודלי הנתונים של מערכת TRIPLE באמצעות SQLAlchemy.
# כולל את מבני הטבלאות לעסקים, משתמשים, אנשי קשר, קבוצות, הגדרות מותג, קמפיינים ושליחות.
# כל טבלה מקושרת ל־Business ומייצגת רכיב משמעותי בתהליך האוטומציה של דיוור שיווקי.
# המודלים כוללים קשרים, תכונות נלוות (כמו to_dict) והגדרות למחיקת שרשרת ומבנה נתונים מלא.

from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Business(db.Model):
    __tablename__ = 'businesses'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), unique=True, nullable=False)
    users = db.relationship('User', back_populates='business', cascade='all, delete', lazy=True)
    contacts = db.relationship('Contact', back_populates='business', cascade='all, delete', lazy=True)
    groups = db.relationship('Group', back_populates='business', cascade='all, delete', lazy=True)
    brand_settings = db.relationship('BrandSettings', back_populates='business', uselist=False)
    campaigns = db.relationship('Campaign', back_populates='business', cascade='all, delete', lazy=True)

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column('user_id', db.Integer, primary_key=True)
    full_name = db.Column('name', db.String(100), nullable=False)
    email = db.Column(db.String(100), nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='viewer')
    business_id = db.Column(db.Integer, db.ForeignKey('businesses.id'), nullable=False)
    business = db.relationship('Business', back_populates='users')
    phone = db.Column(db.String(20))  



class Group(db.Model):
    __tablename__ = 'groups_table'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    description = db.Column(db.String(255))
    color_class = db.Column(db.String(50))
    
    business_id = db.Column(db.Integer, db.ForeignKey('businesses.id'), nullable=False)
    business = db.relationship('Business', back_populates='groups')

    contacts = db.relationship('ContactGroup', back_populates='group', cascade="all, delete-orphan")

class Contact(db.Model):
    __tablename__ = 'contacts'
    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(20), nullable=True)
    email = db.Column(db.String(255), nullable=True, unique=True)
    role = db.Column(db.String(50), nullable=True)
    vip = db.Column(db.Boolean, nullable=False, default=False)
    created_at = db.Column(db.DateTime, server_default=db.func.current_timestamp())
    business_id = db.Column(db.Integer, db.ForeignKey('businesses.id'), nullable=False)
    business = db.relationship('Business', back_populates='contacts')
    groups = db.relationship('ContactGroup', back_populates='contact', cascade="all, delete-orphan")

class ContactGroup(db.Model):
    __tablename__ = 'contact_group'
    id = db.Column(db.Integer, primary_key=True)
    group_id = db.Column(db.Integer, db.ForeignKey('groups_table.id'), nullable=False)
    contact_id = db.Column(db.Integer, db.ForeignKey('contacts.id'), nullable=False)

    group = db.relationship('Group', back_populates='contacts')
    contact = db.relationship('Contact')

class BrandSettings(db.Model):
    __tablename__ = 'brand_settings'
    id = db.Column(db.Integer, primary_key=True)
    business_id = db.Column(db.Integer, db.ForeignKey('businesses.id'), nullable=False)
    business = db.relationship('Business', back_populates='brand_settings')
    business_name = db.Column(db.String(120), nullable=False)
    business_name_localized = db.Column(db.String(120), nullable=True)
    description = db.Column(db.Text)
    main_image = db.Column(db.String(255))
    logos = db.Column(db.Text)
    gallery = db.Column(db.Text)
    primary_color = db.Column(db.String(20))
    palette = db.Column(db.Text)
    font_title = db.Column(db.String(50))
    font_subtitle = db.Column(db.String(50))
    font_paragraph = db.Column(db.String(50))
    location = db.Column(db.String(255))
    business_category = db.Column(db.String(100))
    target_audience = db.Column(db.Text)
    tone_of_voice = db.Column(db.Text)
    unique_value_proposition = db.Column(db.Text)
    main_products_services = db.Column(db.Text)
    marketing_goals = db.Column(db.Text)
    preferred_language = db.Column(db.String(50))
    preferred_cta = db.Column(db.String(255))
    preferred_phrases = db.Column(db.Text)
    avoid_phrases = db.Column(db.Text)

class Delivery(db.Model):
    __tablename__ = 'deliveries'

    id = db.Column(db.Integer, primary_key=True)
    campaign_name = db.Column(db.String(255), nullable=False)
    sender_name = db.Column(db.String(100), nullable=False)
    campaign_type = db.Column(db.String(100), nullable=False)
    audience = db.Column(db.String(255), nullable=True)  
    prompt = db.Column(db.Text, nullable=True)
    design_image = db.Column(db.String(500), nullable=True)
    message_text = db.Column(db.Text, nullable=True)
    channel = db.Column(db.String(50), nullable=True)
    status = db.Column(db.String(50), nullable=True, default='pending')
    created_at = db.Column(db.DateTime, nullable=True)


class Campaign(db.Model):
    __tablename__ = 'campaigns'
    campaign_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(200), nullable=False)
    content_description = db.Column(db.Text)
    sender_id = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.Enum('draft', 'scheduled', 'sent'), default='draft', nullable=False)
    type = db.Column(db.String(50), nullable=False)
    target_groups = db.Column(db.JSON)
    target_roles = db.Column(db.JSON)
    selected_template = db.Column(db.Text)
    ai_prompt = db.Column(db.Text)
    ai_template_id = db.Column(db.String(100))
    design_id = db.Column(db.String(100))
    message_text = db.Column(db.Text)
    ai_text_options = db.Column(db.JSON)
    poster_options = db.Column(db.JSON, nullable=True)  # Last complete set and its selected text
    channel = db.Column(db.String(50))
    scheduled_at = db.Column(db.DateTime)
    image_path = db.Column(db.String(255))
    business_id = db.Column(db.Integer, db.ForeignKey('businesses.id'), nullable=False)
    business = db.relationship('Business', back_populates='campaigns')

    @property
    def id(self):
        return self.campaign_id


    def to_dict(self):
        return {
            "campaign_id": self.campaign_id,
            "name": self.name,
            "content_description": self.content_description,
            "sender_id": self.sender_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "status": self.status,
            "type": self.type,
            "target_groups": self.target_groups,
            "target_roles": self.target_roles,
            "selected_template": self.selected_template,
            "ai_prompt": self.ai_prompt,
            "ai_template_id": self.ai_template_id,
            "design_id": self.design_id,
            "message_text": self.message_text,
            "channel": self.channel,
            "scheduled_at": self.scheduled_at.isoformat() if self.scheduled_at else None,
            "image_path": self.image_path
        }
