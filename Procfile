web: cd backend && waitress-serve --host=0.0.0.0 --port=$PORT app:app
release: cd backend && python -c "from app import app, db; app.app_context().push(); db.create_all()"
