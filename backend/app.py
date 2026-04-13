"""Main Flask application"""
import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from config import get_config
from models import db, User, ShoppingList, ShoppingItem, _es_comprado
from auth import create_token, token_required, verify_token

app = Flask(__name__)

# Configuración
config = get_config()
app.config.from_object(config)

# Inicializar extensions
db.init_app(app)
CORS(app)


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


# ─────────────────────────────────────────────
#  SHOPPING LISTS ROUTES
# ─────────────────────────────────────────────

@app.route('/api/lists', methods=['GET'])
@token_required
def get_lists(user_id):
    """Obtener todas mis listas"""
    lists = ShoppingList.query.filter_by(user_id=user_id).all()
    return jsonify([lst.to_dict() for lst in lists]), 200


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

    item = ShoppingItem(
        list_id=list_id,
        articulo=data.get('articulo'),
        cantidad=data.get('cantidad', '1'),
        categoria=data.get('categoria', 'Otros'),
        agregado_por=data.get('agregado_por', ''),
    )
    db.session.add(item)
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
        item.comprado = data['comprado']
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
    """Obtener catálogo de artículos para autocompletar"""
    lst = ShoppingList.query.get(list_id)
    if not lst or lst.user_id != user_id:
        return jsonify({'error': 'List not found'}), 404

    # Crear catálogo único de todos los items
    catalog = []
    seen = set()

    for item in lst.items:
        key = (item.articulo.lower(), item.categoria)
        if key not in seen:
            catalog.append({
                'articulo': item.articulo,
                'categoria': item.categoria,
            })
            seen.add(key)

    # Ordenar alfabéticamente
    catalog.sort(key=lambda x: x['articulo'].lower())

    return jsonify(catalog), 200


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
