"""Database models"""
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

db = SQLAlchemy()


class User(db.Model):
    """Usuario del sistema"""
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    username = db.Column(db.String(100), nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relaciones
    lists = db.relationship('ShoppingList', backref='owner', lazy=True, cascade='all, delete-orphan')

    def set_password(self, password):
        """Hash y almacenar contraseña"""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        """Verificar contraseña"""
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'username': self.username,
            'created_at': self.created_at.isoformat(),
        }


class ShoppingList(db.Model):
    """Lista de compras del usuario"""
    __tablename__ = 'shopping_lists'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    name = db.Column(db.String(200), default='Mi lista')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relaciones
    items = db.relationship('ShoppingItem', backref='list', lazy=True, cascade='all, delete-orphan')

    def to_dict(self, include_items=False):
        data = {
            'id': self.id,
            'name': self.name,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
        }
        if include_items:
            data['items'] = [item.to_dict() for item in self.items]
        return data


class ShoppingItem(db.Model):
    """Artículo en una lista de compras"""
    __tablename__ = 'shopping_items'

    id = db.Column(db.Integer, primary_key=True)
    list_id = db.Column(db.Integer, db.ForeignKey('shopping_lists.id'), nullable=False, index=True)
    articulo = db.Column(db.String(200), nullable=False)
    cantidad = db.Column(db.String(50), default='1')
    categoria = db.Column(db.String(100), default='Otros')
    comprado = db.Column(db.Boolean, default=False)
    agregado_por = db.Column(db.String(100), default='')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'articulo': self.articulo,
            'cantidad': self.cantidad,
            'categoria': self.categoria,
            'comprado': self.comprado,
            'agregado_por': self.agregado_por,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
        }


class PurchaseHistory(db.Model):
    """Historial de artículos comprados"""
    __tablename__ = 'purchase_history'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    list_id = db.Column(db.Integer, nullable=False)
    list_name = db.Column(db.String(200))
    articulo = db.Column(db.String(200), nullable=False)
    cantidad = db.Column(db.String(50), default='1')
    categoria = db.Column(db.String(100), default='Otros')
    agregado_por = db.Column(db.String(100), default='')
    fecha_compra = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    def to_dict(self):
        return {
            'id': self.id,
            'list_id': self.list_id,
            'list_name': self.list_name,
            'articulo': self.articulo,
            'cantidad': self.cantidad,
            'categoria': self.categoria,
            'agregado_por': self.agregado_por,
            'fecha_compra': self.fecha_compra.isoformat(),
        }


def _es_comprado(valor) -> bool:
    """Centraliza la comparación del estado 'Comprado'"""
    return valor in (True, "TRUE", "✓")
