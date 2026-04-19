"""Main Flask application"""
import os
import smtplib
import ssl
import jwt
import threading
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
from flask import Flask, jsonify, request
from flask_cors import CORS
from config import get_config
from models import db, User, ShoppingList, ShoppingItem, PurchaseHistory, CatalogItem, _es_comprado
from auth import create_token, token_required, verify_token

app = Flask(__name__)

# Configuración
config = get_config()
app.config.from_object(config)

# Inicializar extensions
db.init_app(app)
frontend_url = app.config.get('FRONTEND_URL', 'http://localhost:3000')
CORS(app, origins=[frontend_url, 'http://localhost:3000'])


with app.app_context():
    db.create_all()


# ─────────────────────────────────────────────
#  AUTH ROUTES
# ─────────────────────────────────────────────

@app.route('/api/auth/register', methods=['POST'])
def register():
    """Registrar nuevo usuario"""
    data = request.json or {}

    # Validación
    if not all(k in data for k in ('email', 'password', 'username')):
        return jsonify({'error': 'Missing fields'}), 400

    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already exists'}), 409

    # Crear usuario
    user = User(email=data['email'], username=data['username'])
    user.set_password(data['password'])
    db.session.add(user)
    db.session.commit()

    token = create_token(user.id)
    return jsonify({
        'message': 'User registered successfully',
        'token': token,
        'user': user.to_dict()
    }), 201


@app.route('/api/auth/login', methods=['POST'])
def login():
    """Login usuario"""
    data = request.json or {}

    if not all(k in data for k in ('email', 'password')):
        return jsonify({'error': 'Missing fields'}), 400

    user = User.query.filter_by(email=data['email']).first()
    if not user or not user.check_password(data['password']):
        return jsonify({'error': 'Invalid credentials'}), 401

    token = create_token(user.id)
    return jsonify({
        'message': 'Login successful',
        'token': token,
        'user': user.to_dict()
    }), 200


@app.route('/api/auth/me', methods=['GET'])
@token_required
def get_me(user_id):
    """Obtener perfil del usuario autenticado"""
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    return jsonify(user.to_dict()), 200


def _create_reset_token(user_id, pwd_hash):
    """Generar JWT de un solo uso para reseteo de contraseña (expira en 1 hora)"""
    payload = {
        'user_id': user_id,
        'action': 'reset',
        'pwd_fp': pwd_hash[-12:],   # fingerprint: invalida el token si la contraseña ya cambió
        'exp': datetime.utcnow() + timedelta(hours=1),
    }
    return jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')


def _verify_reset_token(token):
    """Verificar token de reseteo. Retorna (user_id, pwd_fingerprint) o (None, None)"""
    try:
        payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        if payload.get('action') != 'reset':
            return None, None
        return payload['user_id'], payload['pwd_fp']
    except jwt.ExpiredSignatureError:
        return None, None
    except jwt.InvalidTokenError:
        return None, None


def _send_reset_email(to_email, username, reset_link):
    """Enviar email con enlace de recuperación de contraseña"""
    remitente = app.config.get('EMAIL_REMITENTE')
    password = app.config.get('EMAIL_PASSWORD')

    if not remitente or not password:
        # En desarrollo sin credenciales, sólo loggear
        app.logger.info(f"[DEV] Enlace de reset para {to_email}: {reset_link}")
        return

    msg = MIMEMultipart('alternative')
    msg['Subject'] = 'Recuperar contraseña - Lista de Compras'
    msg['From'] = remitente
    msg['To'] = to_email

    html_body = f"""
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
      <h2 style="color:#0d6efd">🛒 Lista de Compras</h2>
      <p>Hola <strong>{username}</strong>,</p>
      <p>Recibimos una solicitud para restablecer tu contraseña.
         Haz clic en el botón para crear una nueva:</p>
      <a href="{reset_link}"
         style="display:inline-block;padding:12px 24px;background:#0d6efd;
                color:#fff;text-decoration:none;border-radius:6px;margin:16px 0">
        Restablecer contraseña
      </a>
      <p style="color:#666;font-size:0.85rem">
        Este enlace expira en <strong>1 hora</strong>.<br>
        Si no solicitaste esto, ignora este mensaje.
      </p>
    </div>
    """
    msg.attach(MIMEText(html_body, 'html'))

    context = ssl.create_default_context()
    with smtplib.SMTP_SSL('smtp.gmail.com', 465, context=context, timeout=10) as server:
        server.login(remitente, password)
        server.sendmail(remitente, to_email, msg.as_string())


def _send_reset_email_bg(to_email, username, reset_link):
    """Lanzar envío de email en hilo de fondo para no bloquear el request"""
    def _run():
        try:
            _send_reset_email(to_email, username, reset_link)
        except Exception as e:
            app.logger.error(f"Error enviando email de reset a {to_email}: {e}")

    threading.Thread(target=_run, daemon=True).start()


@app.route('/api/auth/forgot-password', methods=['POST'])
def forgot_password():
    """Solicitar enlace de recuperación de contraseña"""
    data = request.json or {}
    email = data.get('email', '').strip().lower()

    if not email:
        return jsonify({'error': 'El email es requerido'}), 400

    user = User.query.filter_by(email=email).first()

    # Siempre responder 200 para no revelar si el email existe (user enumeration)
    if not user:
        return jsonify({'message': 'Si el email está registrado, recibirás un enlace de recuperación.'}), 200

    token = _create_reset_token(user.id, user.password_hash)
    frontend_url = app.config.get('FRONTEND_URL', 'http://localhost:3000')
    reset_link = f"{frontend_url}/reset-password?token={token}"

    # Enviar en segundo plano: el usuario recibe respuesta inmediata
    _send_reset_email_bg(user.email, user.username, reset_link)

    return jsonify({'message': 'Si el email está registrado, recibirás un enlace de recuperación.'}), 200


@app.route('/api/auth/reset-password', methods=['POST'])
def reset_password():
    """Restablecer contraseña usando token de recuperación"""
    data = request.json or {}
    token = data.get('token', '').strip()
    new_password = data.get('password', '')

    if not token or not new_password:
        return jsonify({'error': 'Token y contraseña son requeridos'}), 400

    if len(new_password) < 6:
        return jsonify({'error': 'La contraseña debe tener al menos 6 caracteres'}), 400

    user_id, pwd_fp = _verify_reset_token(token)
    if not user_id:
        return jsonify({'error': 'El enlace es inválido o ha expirado'}), 400

    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'Usuario no encontrado'}), 404

    # Validar fingerprint: si la contraseña ya cambió, el token no es válido
    if user.password_hash[-12:] != pwd_fp:
        return jsonify({'error': 'El enlace ya fue utilizado o es inválido'}), 400

    user.set_password(new_password)
    db.session.commit()

    return jsonify({'message': 'Contraseña actualizada correctamente. Ya puedes iniciar sesión.'}), 200


# ─────────────────────────────────────────────
#  SHOPPING LISTS ROUTES
# ─────────────────────────────────────────────

@app.route('/api/lists', methods=['GET'])
@token_required
def get_lists(user_id):
    """Obtener todas mis listas"""
    lists = ShoppingList.query.filter_by(user_id=user_id).all()
    result = []
    for lst in lists:
        d = lst.to_dict()
        total = len(lst.items)
        comprados = sum(1 for it in lst.items if it.comprado)
        d['pendientes'] = total - comprados
        d['total'] = total
        result.append(d)
    return jsonify(result), 200


@app.route('/api/lists', methods=['POST'])
@token_required
def create_list(user_id):
    """Crear nueva lista"""
    data = request.json or {}
    name = data.get('name', 'Mi lista')

    lst = ShoppingList(user_id=user_id, name=name)
    db.session.add(lst)
    db.session.commit()

    return jsonify(lst.to_dict()), 201


@app.route('/api/lists/<int:list_id>', methods=['GET'])
@token_required
def get_list(user_id, list_id):
    """Obtener detalle de una lista"""
    lst = ShoppingList.query.get(list_id)
    if not lst or lst.user_id != user_id:
        return jsonify({'error': 'List not found'}), 404

    return jsonify(lst.to_dict(include_items=True)), 200


@app.route('/api/lists/<int:list_id>', methods=['DELETE'])
@token_required
def delete_list(user_id, list_id):
    """Eliminar una lista"""
    lst = ShoppingList.query.get(list_id)
    if not lst or lst.user_id != user_id:
        return jsonify({'error': 'List not found'}), 404

    db.session.delete(lst)
    db.session.commit()

    return jsonify({'message': 'List deleted'}), 200


# ─────────────────────────────────────────────
#  SHOPPING ITEMS ROUTES
# ─────────────────────────────────────────────

@app.route('/api/lists/<int:list_id>/items', methods=['GET'])
@token_required
def get_items(user_id, list_id):
    """Obtener items de una lista"""
    lst = ShoppingList.query.get(list_id)
    if not lst or lst.user_id != user_id:
        return jsonify({'error': 'List not found'}), 404

    items = [item.to_dict() for item in lst.items]

    # Apilar estadísticas
    total = len(items)
    comprados = sum(1 for it in items if it['comprado'])
    pendientes = total - comprados
    porcentaje = round(comprados / total * 100) if total > 0 else 0

    return jsonify({
        'items': items,
        'stats': {
            'total': total,
            'comprados': comprados,
            'pendientes': pendientes,
            'porcentaje': porcentaje,
        }
    }), 200


@app.route('/api/lists/<int:list_id>/items', methods=['POST'])
@token_required
def add_item(user_id, list_id):
    """Agregar item a lista"""
    lst = ShoppingList.query.get(list_id)
    if not lst or lst.user_id != user_id:
        return jsonify({'error': 'List not found'}), 404

    data = request.json or {}

    # Validación
    if not data.get('articulo'):
        return jsonify({'error': 'Articulo is required'}), 400

    articulo = data.get('articulo')
    categoria = data.get('categoria', 'Otros')

    item = ShoppingItem(
        list_id=list_id,
        articulo=articulo,
        cantidad=data.get('cantidad', '1'),
        categoria=categoria,
        agregado_por=data.get('agregado_por', ''),
    )
    db.session.add(item)

    # Upsert en catálogo: si ya existe el artículo actualiza categoría, sino lo crea
    catalog_entry = CatalogItem.query.filter_by(user_id=user_id, articulo=articulo).first()
    if catalog_entry:
        catalog_entry.categoria = categoria
    else:
        db.session.add(CatalogItem(user_id=user_id, articulo=articulo, categoria=categoria))

    db.session.commit()

    return jsonify(item.to_dict()), 201


@app.route('/api/lists/<int:list_id>/items/<int:item_id>', methods=['PUT'])
@token_required
def update_item(user_id, list_id, item_id):
    """Actualizar item (toggle comprado o editar)"""
    lst = ShoppingList.query.get(list_id)
    if not lst or lst.user_id != user_id:
        return jsonify({'error': 'List not found'}), 404

    item = ShoppingItem.query.get(item_id)
    if not item or item.list_id != list_id:
        return jsonify({'error': 'Item not found'}), 404

    data = request.json or {}

    # Permitir actualizar: comprado, cantidad, categoria, agregado_por
    if 'comprado' in data:
        was_comprado = item.comprado
        item.comprado = data['comprado']
        if data['comprado'] and not was_comprado:
            db.session.add(PurchaseHistory(
                user_id=user_id,
                list_id=list_id,
                list_name=lst.name,
                articulo=item.articulo,
                cantidad=item.cantidad,
                categoria=item.categoria,
                agregado_por=item.agregado_por,
            ))
    if 'cantidad' in data:
        item.cantidad = data['cantidad']
    if 'categoria' in data:
        item.categoria = data['categoria']
    if 'agregado_por' in data:
        item.agregado_por = data['agregado_por']

    db.session.commit()

    return jsonify(item.to_dict()), 200


@app.route('/api/lists/<int:list_id>/items/<int:item_id>', methods=['DELETE'])
@token_required
def delete_item(user_id, list_id, item_id):
    """Eliminar item de lista"""
    lst = ShoppingList.query.get(list_id)
    if not lst or lst.user_id != user_id:
        return jsonify({'error': 'List not found'}), 404

    item = ShoppingItem.query.get(item_id)
    if not item or item.list_id != list_id:
        return jsonify({'error': 'Item not found'}), 404

    db.session.delete(item)
    db.session.commit()

    return jsonify({'message': 'Item deleted'}), 200


@app.route('/api/lists/<int:list_id>/reset', methods=['POST'])
@token_required
def reset_list(user_id, list_id):
    """Limpiar todos los items de una lista"""
    lst = ShoppingList.query.get(list_id)
    if not lst or lst.user_id != user_id:
        return jsonify({'error': 'List not found'}), 404

    # Eliminar todos los items
    ShoppingItem.query.filter_by(list_id=list_id).delete()
    db.session.commit()

    return jsonify({'message': 'List reset'}), 200


@app.route('/api/lists/<int:list_id>/catalog', methods=['GET'])
@token_required
def get_catalog(user_id, list_id):
    """Obtener catálogo de artículos para autocompletar (global: todas las listas del usuario)"""
    lst = ShoppingList.query.get(list_id)
    if not lst or lst.user_id != user_id:
        return jsonify({'error': 'List not found'}), 404

    # Primero: entradas del catálogo persistido del usuario
    catalog_entries = CatalogItem.query.filter_by(user_id=user_id).all()
    catalog = {e.articulo.lower(): {'articulo': e.articulo, 'categoria': e.categoria}
               for e in catalog_entries}

    # Fallback: artículos de ShoppingItems no presentes aún en el catálogo
    all_items = (
        ShoppingItem.query
        .join(ShoppingList, ShoppingItem.list_id == ShoppingList.id)
        .filter(ShoppingList.user_id == user_id)
        .all()
    )
    for item in all_items:
        key = item.articulo.lower()
        if key not in catalog:
            catalog[key] = {'articulo': item.articulo, 'categoria': item.categoria}

    result = sorted(catalog.values(), key=lambda x: x['articulo'].lower())
    return jsonify(result), 200


# ─────────────────────────────────────────────
# ─────────────────────────────────────────────
#  HISTORIAL DE COMPRAS
# ─────────────────────────────────────────────

@app.route('/api/history', methods=['GET'])
@token_required
def get_history(user_id):
    """Historial de artículos comprados, filtrable por período (YYYY-MM) o 'all'"""
    period = request.args.get('period', 'all')
    query = PurchaseHistory.query.filter_by(user_id=user_id)

    if period != 'all':
        try:
            year, month = map(int, period.split('-'))
            start = datetime(year, month, 1)
            end = datetime(year + 1, 1, 1) if month == 12 else datetime(year, month + 1, 1)
            query = query.filter(
                PurchaseHistory.fecha_compra >= start,
                PurchaseHistory.fecha_compra < end
            )
        except (ValueError, AttributeError):
            return jsonify({'error': 'Período inválido. Usar formato YYYY-MM'}), 400

    items = query.order_by(PurchaseHistory.fecha_compra.desc()).all()
    return jsonify({
        'items': [i.to_dict() for i in items],
        'total': len(items),
        'periodo': period,
    }), 200


# ─────────────────────────────────────────────
#  CATÁLOGO DE ARTÍCULOS
# ─────────────────────────────────────────────

@app.route('/api/catalog', methods=['GET'])
@token_required
def get_catalog_items(user_id):
    """Listar todas las entradas del catálogo del usuario"""
    entries = CatalogItem.query.filter_by(user_id=user_id).order_by(CatalogItem.articulo).all()
    return jsonify([e.to_dict() for e in entries]), 200


@app.route('/api/catalog/<int:entry_id>', methods=['PUT'])
@token_required
def update_catalog_item(user_id, entry_id):
    """Editar artículo o categoría de una entrada del catálogo"""
    entry = CatalogItem.query.get(entry_id)
    if not entry or entry.user_id != user_id:
        return jsonify({'error': 'Entrada no encontrada'}), 404

    data = request.json or {}
    if 'articulo' in data and data['articulo'].strip():
        # Verificar que el nuevo nombre no duplique otro existente
        nuevo = data['articulo'].strip()
        existing = CatalogItem.query.filter_by(user_id=user_id, articulo=nuevo).first()
        if existing and existing.id != entry_id:
            return jsonify({'error': 'Ya existe un artículo con ese nombre'}), 409
        entry.articulo = nuevo
    if 'categoria' in data:
        entry.categoria = data['categoria']

    db.session.commit()
    return jsonify(entry.to_dict()), 200


@app.route('/api/catalog/<int:entry_id>', methods=['DELETE'])
@token_required
def delete_catalog_item(user_id, entry_id):
    """Eliminar una entrada del catálogo"""
    entry = CatalogItem.query.get(entry_id)
    if not entry or entry.user_id != user_id:
        return jsonify({'error': 'Entrada no encontrada'}), 404

    db.session.delete(entry)
    db.session.commit()
    return jsonify({'message': 'Eliminado'}), 200


# ─────────────────────────────────────────────
#  HEALTH CHECK & ERROR HANDLERS
# ─────────────────────────────────────────────

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'ok', 'message': 'SaaS Compras API running'}), 200


@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404


@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return jsonify({'error': 'Internal server error'}), 500


if __name__ == '__main__':
    with app.app_context():
        db.create_all()

    # En producción, usar gunicorn:
    # gunicorn app:app

    # En desarrollo:
    app.run(
        host='0.0.0.0',
        port=int(os.environ.get('PORT', 5000)),
        debug=os.environ.get('FLASK_ENV') == 'development'
    )
