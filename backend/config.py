import os
from datetime import timedelta

class Config:
    """Base configuration"""
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-change-in-production')
    JWT_EXPIRATION = timedelta(days=30)

    # Database
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = os.environ.get('FLASK_ENV') == 'development'

    # Email (mantenido del proyecto original)
    EMAIL_REMITENTE = os.environ.get('EMAIL_REMITENTE')
    EMAIL_PASSWORD = os.environ.get('EMAIL_PASSWORD')

    # Categorías (del proyecto original)
    CATEGORIAS = [
        "Frutas y Verduras",
        "Carnes y Pescados",
        "Lácteos y Huevos",
        "Panadería",
        "Almacén / Despensa",
        "Bebidas",
        "Limpieza del Hogar",
        "Higiene Personal",
        "Snacks y Dulces",
        "Congelados",
        "Otros",
    ]


class DevelopmentConfig(Config):
    """Development configuration - SQLite local"""
    DEBUG = True
    TESTING = False
    SQLALCHEMY_DATABASE_URI = 'sqlite:///compras_local.db'


class ProductionConfig(Config):
    """Production configuration - Railway PostgreSQL"""
    DEBUG = False
    TESTING = False
    # Railway proporciona DATABASE_URL automáticamente
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        'DATABASE_URL',
        'postgresql://user:pass@localhost/compras'
    )
    # Reemplazar postgres:// con postgresql:// si es necesario (SQLAlchemy 1.4+)
    if SQLALCHEMY_DATABASE_URI.startswith('postgres://'):
        SQLALCHEMY_DATABASE_URI = SQLALCHEMY_DATABASE_URI.replace('postgres://', 'postgresql://', 1)


class TestingConfig(Config):
    """Testing configuration"""
    DEBUG = True
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'


config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}


def get_config():
    """Return config object based on environment"""
    env = os.environ.get('FLASK_ENV', 'development')
    return config.get(env, config['default'])
