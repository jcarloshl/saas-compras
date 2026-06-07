import os
from datetime import timedelta

class Config:
    """Base configuration"""
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-change-in-production')
    JWT_EXPIRATION = timedelta(days=30)

    # Database
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = os.environ.get('FLASK_ENV') == 'development'

    # Email — usa Brevo API (HTTP) en Railway; loguea el link en dev si no hay clave
    BREVO_API_KEY = os.environ.get('BREVO_API_KEY')
    EMAIL_REMITENTE = os.environ.get('EMAIL_REMITENTE')
    FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:3000')

    # Edamam Recipe Search API
    EDAMAM_APP_ID  = os.environ.get('EDAMAM_APP_ID')
    EDAMAM_APP_KEY = os.environ.get('EDAMAM_APP_KEY')

    # Mapeo de keywords de ingredientes → categorías del proyecto
    INGREDIENT_CATEGORIES = {
        'Carnes y Pescados': [
            'pollo', 'carne', 'res', 'cerdo', 'cordero', 'pavo', 'pescado',
            'salmon', 'atun', 'camaron', 'chicken', 'beef', 'pork', 'fish',
            'shrimp', 'tuna', 'lamb', 'turkey', 'chorizo', 'jamon', 'bacon',
            'merluza', 'reineta', 'corvina', 'trucha', 'marisco', 'calamar',
        ],
        'Lácteos y Huevos': [
            'leche', 'queso', 'huevo', 'mantequilla', 'crema', 'yogur',
            'milk', 'cheese', 'egg', 'butter', 'cream', 'yogurt', 'nata',
            'ricotta', 'kefir', 'manjar',
        ],
        'Frutas y Verduras': [
            'tomate', 'cebolla', 'ajo', 'lechuga', 'zanahoria', 'pimiento',
            'papa', 'manzana', 'limon', 'espinaca', 'brocoli', 'pepino',
            'tomato', 'onion', 'garlic', 'lettuce', 'carrot', 'pepper',
            'potato', 'lemon', 'lime', 'spinach', 'broccoli', 'cucumber',
            'zucchini', 'mushroom', 'avocado', 'palta', 'zapallo', 'apio',
            'perejil', 'cilantro', 'albahaca', 'verdura', 'fruta',
        ],
        'Panadería': [
            'pan', 'harina', 'flour', 'bread', 'pasta', 'avena', 'maiz',
            'rice', 'arroz', 'tortilla', 'levadura', 'masa',
        ],
        'Almacén / Despensa': [
            'aceite', 'sal', 'azucar', 'vinagre', 'salsa', 'pimienta',
            'canela', 'oregano', 'comino', 'laurel', 'mostaza', 'ketchup',
            'oil', 'salt', 'sugar', 'vinegar', 'sauce', 'spice',
            'herb', 'cinnamon', 'cumin', 'paprika', 'thyme', 'rosemary',
            'soja', 'soya', 'miel', 'mermelada', 'caldo',
        ],
        'Bebidas': [
            'vino', 'cerveza', 'jugo', 'agua', 'limonada',
            'wine', 'beer', 'juice', 'water', 'broth', 'stock',
        ],
        'Snacks y Dulces': [
            'chocolate', 'dulce', 'caramelo', 'galleta', 'nuez', 'almendra',
        ],
        'Congelados': ['frozen', 'congelado'],
    }

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
    # Railway cierra conexiones inactivas; pool_pre_ping verifica antes de reutilizar
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_pre_ping': True,
        'pool_recycle': 280,
    }


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
