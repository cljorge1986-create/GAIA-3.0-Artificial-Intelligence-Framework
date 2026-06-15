import os
from flask import Flask, render_template
from config.settings import Settings

# Importa as rotas do servidor (mantidas em gaia_server.py)
# Usamos app factory para separar rotas do entry point
from gaia_routes import register_routes

app = Flask(__name__, static_folder="web/static", template_folder="web/templates")
app.secret_key = os.getenv('SECRET_KEY', 'XXXXXXXX')

# Regista todas as rotas API
register_routes(app)

# Rota principal — renderiza o template
@app.route('/')
def index():
    return render_template('index.html')

if __name__ == '__main__':
    port  = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_DEBUG', 'false').lower() == 'true'
    print(f'\n  GAIA 2.0 — http://localhost:{port}\n')
    app.run(host='0.0.0.0', port=port, debug=debug)
