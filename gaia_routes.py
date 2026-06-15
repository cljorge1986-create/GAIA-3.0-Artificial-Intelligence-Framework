import os, io, json, base64, logging, subprocess, tempfile
from datetime import datetime
from functools import wraps
from flask import request, jsonify, session
import requests as req


log = logging.getLogger(__name__)

ANTHROPIC_API_KEY = os.getenv('ANTHROPIC_API_KEY', '')
OPENAI_API_KEY    = os.getenv('OPENAI_API_KEY',    '')
WEATHER_API_KEY   = os.getenv('WEATHER_API_KEY',   '')
ANTHROPIC_MODEL   = os.getenv('ANTHROPIC_MODEL',   'claude-opus-4-5')
OPENAI_MODEL      = os.getenv('OPENAI_MODEL',       'gpt-4o')
DEFAULT_PROFILE   = 'WARM'

GAIA_PROFILES = {
    'WARM':       'És a GAIA, calorosa e empática..',
    'DIRECT':     'És a GAIA. Respostas directas, sem rodeios..',
    'STRICT':     'És a GAIA, formal e rigorosa. Registo formal.',
    'MECHANICAL': 'GAIA AI SYSTEM. Pure information transfer. No emotional language.',
    'ANALYTICAL': 'És a GAIA, analítica. Usa dados, métricas e lógica.',
}

chat_sessions: dict = {}


def register_routes(app):

    @app.route('/api/chat', methods=['POST'])
    def api_chat():
        print("Aqui chat")
        if request.content_type and 'application/json' in request.content_type:
            data = request.get_json(force=True)
            message, profile, lang = data.get('message','').strip(), data.get('profile', DEFAULT_PROFILE), data.get('lang','pt')
            title_id = data.get('title_id')
            print(f"titulo: {title_id} || mensagem: {message} || Profile: {profile}")
        else:
            message, profile, lang = request.form.get('message','').strip(), request.form.get('profile', DEFAULT_PROFILE), request.form.get('lang','pt')
            title_id = request.form.get('title_id')
            print(title_id)
            audio = request.files.get('audio')
            if audio:
                return _handle_voice(audio, profile, lang)
        if not message: return jsonify({'error': 'Mensagem vazia'}), 400
        
        
        reply = message
        
        print(f"resposta: {reply}")
        return jsonify({'response':{'reply':reply},'type':'text'})

    @app.route("/api/titles", methods=["GET"])
    def titles():

        try:
            rows = []
            # 🔒 never is None
            if not rows:
                return jsonify({"titles": []})
            return jsonify({
                    "titles": [
                        {
                            "id": row[0],
                            "title": row[1]
                        }
                        for row in rows
                    ]
                })
        except Exception as e:
            return jsonify({
                "titles": [],
                "error": str(e)
            }), 500
        
    @app.route("/api/titles/action", methods=["POST"])
    def chat_action():
        data = request.get_json()

        action = data.get("action")   # create | rename | delete
        title_id = data.get("id")
        title = data.get("title")

        if action == "create":
            chat_id = title_id
            return jsonify({"id": chat_id})

        elif action == "rename":
            
            return jsonify({"ok": True})

        elif action == "delete":
            
            return jsonify({"ok": True})

        return jsonify({"error": "invalid action"}), 400
    
    @app.route("/api/history/<int:title_id>", methods=["GET"])
    def chat_history(title_id):
        try:
            rows = None
            # never is None
            if not rows:
                return jsonify({"history": []})
            history = [
                    {
                        "user": row[1],
                        "gaia": row[2],
                        "timestamp": row[4]
                    }
                    for row in rows
                ]
        
            return jsonify({"history": history})
        
        except Exception as e:
            return jsonify({
                "history": [],
                "error": str(e)
            }), 500
