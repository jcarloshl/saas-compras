"""JWT Authentication middleware"""
import jwt
from functools import wraps
from flask import request, jsonify, current_app
from datetime import datetime, timedelta


def create_token(user_id):
    """Generar JWT token"""
    payload = {
        'user_id': user_id,
        'exp': datetime.utcnow() + current_app.config['JWT_EXPIRATION'],
        'iat': datetime.utcnow()
    }
    return jwt.encode(
        payload,
        current_app.config['SECRET_KEY'],
        algorithm='HS256'
    )


def verify_token(token):
    """Verificar y decodificar JWT token"""
    try:
        payload = jwt.decode(
            token,
            current_app.config['SECRET_KEY'],
            algorithms=['HS256']
        )
        return payload.get('user_id')
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def token_required(f):
    """Decorator para proteger rutas - requiere JWT token válido"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = None

        # Buscar token en Authorization header
        if 'Authorization' in request.headers:
            auth_header = request.headers.get('Authorization', '')
            try:
                token = auth_header.split(' ')[1]
            except IndexError:
                return jsonify({'error': 'Invalid token format'}), 401

        if not token:
            return jsonify({'error': 'Token is missing'}), 401

        user_id = verify_token(token)
        if not user_id:
            return jsonify({'error': 'Token is invalid or expired'}), 401

        return f(user_id, *args, **kwargs)

    return decorated_function


def get_current_user_id():
    """Obtener user_id del token en la petición actual (usar dentro de ruta protegida)"""
    auth_header = request.headers.get('Authorization', '')
    try:
        token = auth_header.split(' ')[1]
        return verify_token(token)
    except (IndexError, ValueError):
        return None
