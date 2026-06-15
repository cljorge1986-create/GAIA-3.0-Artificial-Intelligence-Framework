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

    @app.route('/api/status')
    def api_status():
        print("Aqui api")
        return jsonify({'status':'online','version':'2.0.0','timestamp':datetime.now().isoformat(),
            'llm': 'anthropic' if ANTHROPIC_API_KEY else ('openai' if OPENAI_API_KEY else 'none'),
            'weather': bool(WEATHER_API_KEY)})

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

    def _handle_voice(audio_file, profile, lang):
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp:
            audio_file.save(tmp.name); tmp_path = tmp.name
        try:
            text = '[Transcrição indisponível — configure OPENAI_API_KEY]'
            if OPENAI_API_KEY:
                with open(tmp_path,'rb') as f:
                    r = req.post('https://api.openai.com/v1/audio/transcriptions',
                        headers={'Authorization':f'Bearer {OPENAI_API_KEY}'},
                        files={'file':('voice.wav',f,'audio/wav')}, data={'model':'whisper-1','language':lang}, timeout=30)
                    text = r.json().get('text','')
            
            return jsonify({'type':'voice','response':{'reply':text}})
        finally: os.unlink(tmp_path)
#========================================
# Chat Titles or Ids
#=========================================
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
#========================================
# END of Chat Titles or Ids
#=========================================

    @app.route('/api/analyse_image', methods=['POST'])
    def api_analyse_image():
        print("Aqui lê imagem")
        img = request.files.get('image')
        if not img: return jsonify({'error':'Nenhuma imagem'}), 400
        b64 = base64.b64encode(img.read()).decode()
        desc = 'Analisa esta imagem em detalhe.'
        cats = [l for kw,l in {'pessoa':'Pessoas','animal':'Animais','paisagem':'Paisagem',
            'edificio':'Arquitectura','texto':'Texto','gráfico':'Gráfico','comida':'Alimentação',
            'veículo':'Transporte','natureza':'Natureza'}.items() if kw in desc.lower()][:5]
        return jsonify({'description':desc,'categories':cats,'confidence':0.92})

    @app.route('/api/generate_article', methods=['POST'])
    def api_generate_article():
        print("Aqui Gera artigo")
        d = request.get_json(force=True)
        cat, lang = d.get('category','Tecnologia'), d.get('lang','pt')
        reply = f'Escreve um artigo completo sobre {cat}.'
        return jsonify({'title': cat, 'content':reply, 'category':cat, 'date':datetime.now().strftime('%d/%m/%Y'), 'words':len(reply.split())})

    @app.route('/api/articles')
    def api_articles(): 
        print("Aqui lê artigo")
        return jsonify({'articles':[]})

    @app.route('/api/books')
    def api_books():
        print("Aqui gera livro")
        q = request.args.get('q','').strip()
        if not q: return jsonify({'books':[]})
        try:
            r = req.get(f'https://openlibrary.org/search.json?q={req.utils.quote(q)}&limit=8', timeout=10)
            r.raise_for_status()
            books = [{'title':doc.get('title',''),'author':', '.join(doc.get('author_name',[])[:2]),
                'year':str(doc.get('first_publish_year','')),'summary':''} for doc in r.json().get('docs',[])[:8]]
            return jsonify({'books':books})
        except Exception:
            reply = f'Lista 5 livros sobre {q}'
            try: return jsonify(json.loads(reply.strip().strip('```json').strip('```')))
            except Exception: return jsonify({'books':[]})

    @app.route('/api/analyse_book', methods=['POST'])
    def api_analyse_book():
        print("Aqui lê livros")
        f = request.files.get('file')
        if not f: return jsonify({'error':'Nenhum ficheiro'}), 400
        content = ''
        if f.filename.lower().endswith('.txt'):
            content = f.read().decode('utf-8', errors='ignore')[:8000]
        elif f.filename.lower().endswith('.pdf'):
            try:
                import pdfplumber
                with pdfplumber.open(io.BytesIO(f.read())) as pdf:
                    content = '\n'.join(p.extract_text() or '' for p in pdf.pages[:10])[:8000]
            except ImportError: content = '[pip install pdfplumber para suporte PDF]'
        else: content = f.read().decode('utf-8', errors='ignore')[:8000]
        reply = f'Analisa:\n\n{content}'
        return jsonify({'title':reply.split('\n')[0].lstrip('#').strip() or f.filename,'summary':reply})

    @app.route('/api/generate_history', methods=['POST'])
    def api_generate_history():
        print("Aqui gera história")
        d = request.get_json(force=True)
        era, region, lang = d.get('era','Idade Média'), d.get('region','Europa'), d.get('lang','pt')
        reply = f'Narrativa histórica: {era} em {region}. 4-6 parágrafos.'
        return jsonify({'title':f'{era} — {region}','content':reply,'era':era,'region':region})

    @app.route('/api/generate_mail', methods=['POST'])
    def api_generate_mail():
        print("Aqui gera email")
        d = request.get_json(force=True)
        context = d.get('context','').strip()
        if not context: return jsonify({'error':'Contexto obrigatório'}), 400
        tone_map = {'Formal':'formal','Informal':'informal','Profissional':'profissional','Amigável':'amigável','Urgente':'urgente'}
        reply = f'Email {tone_map.get(d.get("tone","Formal"),"formal")}. Contexto: {context}. Inclui saudação, corpo e despedida.'
        return jsonify({'email':reply,'subject':d.get('subject','')})

    @app.route('/api/generate_image', methods=['POST'])
    def api_generate_image():
        print("Aqui gera imagem 3D")
        d = request.get_json(force=True)
        prompt = d.get('prompt','').strip()
        if not prompt: return jsonify({'error':'Prompt obrigatório'}), 400
        if not OPENAI_API_KEY: return jsonify({'error':'OPENAI_API_KEY necessária'}), 400
        size = {'1:1':'1024x1024','16:9':'1792x1024','9:16':'1024x1792'}.get(d.get('ratio','1:1'),'1024x1024')
        styles = {'Realista':'photorealistic','Anime':'anime style','Pintura':'oil painting',
                  'Sketch':'pencil sketch','3D Render':'3D CGI render','Pixel Art':'pixel art 16-bit'}
        full_prompt = f"{prompt}, {styles.get(d.get('style','Realista'),'')}"
        r = req.post('https://api.openai.com/v1/images/generations',
            headers={'Authorization':f'Bearer {OPENAI_API_KEY}','Content-Type':'application/json'},
            json={'model':'dall-e-3','prompt':full_prompt,'n':1,'size':size}, timeout=60)
        r.raise_for_status()
        return jsonify({'url':r.json()['data'][0]['url'],'prompt':full_prompt})

    @app.route('/api/generate_video', methods=['POST'])
    def api_generate_video():
        print("Aqui gera video")
        d = request.get_json(force=True)
        return jsonify({'status':'pending','message':f"Integra RunwayML/Kling API. Prompt: '{d.get('prompt','')}'"}), 202

    @app.route('/api/run_code', methods=['POST'])
    def api_run_code():
        print("Aqui gera codigo")
        d = request.get_json(force=True)
        code, lang = d.get('code','').strip(), d.get('language','python').lower()
        if not code: return jsonify({'error':'Código vazio'}), 400
        if lang == 'python':
            blocked = ['os.system','subprocess.','shutil.rmtree','__import__']
            for b in blocked:
                if b in code: return jsonify({'error':f'Bloqueado: {b}'}), 403
            with tempfile.NamedTemporaryFile(suffix='.py',mode='w',delete=False,encoding='utf-8') as tmp:
                tmp.write(code); tmp_path = tmp.name
            try:
                res = subprocess.run(['python3',tmp_path],capture_output=True,text=True,timeout=10)
                return jsonify({'output':(res.stdout or res.stderr or 'Sem output').strip(),'error':bool(res.returncode)})
            except subprocess.TimeoutExpired: return jsonify({'output':'Timeout (10s)','error':True})
            finally: os.unlink(tmp_path)
        else:
            reply = f'```{lang}\n{code}\n```'
            return jsonify({'output':reply,'simulated':True})

    @app.route('/api/weather')
    def api_weather():
        print("Aqui lê tempo")
        city  = request.args.get('city','Lisboa')
        units = request.args.get('units','metric')
        if not WEATHER_API_KEY:
            return jsonify({'name':city,'sys':{'country':'PT'},'main':{'temp':22,'feels_like':21,'humidity':65,'pressure':1013},
                'weather':[{'main':'Clear','description':'céu limpo (simulado)'}],'wind':{'speed':3.5},'_simulated':True})
        r = req.get(f'https://api.openweathermap.org/data/2.5/weather?q={req.utils.quote(city)}&units={units}&appid={WEATHER_API_KEY}&lang=pt', timeout=10)
        if r.status_code == 404: return jsonify({'error':f"Cidade '{city}' não encontrada"}), 404
        r.raise_for_status(); return jsonify(r.json())

    @app.route('/correct', methods=['POST'])
    def api_correct():
        print("Aqui lê texto e corrige")
        d = request.get_json(force=True)
        text, mode, translate_to = d.get('text','').strip(), d.get('mode','standard'), d.get('translate_to')
        if not text: return jsonify({'error':'Texto vazio'}), 400
        modes = {'standard':'Corriges erros ortográficos e gramaticais.','formal':'Reformulas em registo formal.',
                 'casual':'Corriges mantendo tom casual.','creative':'Enriqueces o vocabulário.','technical':'Corriges mantendo terminologia técnica.'}
        system = ('Corrector de texto. ' + modes.get(mode, modes['standard']) +
            ' Devolve APENAS JSON: {"corrected_text":"","suggestions":[{"type":"grammar|spelling|style|punctuation|clarity",'
            '"original":"","corrected":"","reason":"","confidence":0.9,"is_optional":false}],'
            '"language_detected":"pt","overall_confidence":0.95,'
            '"diff_tokens":[{"text":"","op":"keep|delete|insert"}],"stats":{"accepted":0,"optional":0}}')
        raw = f'Corrige:\n\n{text}'
        try:
            clean = raw.strip()
            if clean.startswith('```'): clean = clean.split('```')[1]; clean = clean[4:] if clean.startswith('json') else clean
            result = json.loads(clean.strip())
        except json.JSONDecodeError:
            result = {'corrected_text':raw,'suggestions':[],'language_detected':'pt','overall_confidence':0.8,
                'diff_tokens':[{'text':raw,'op':'keep'}],'stats':{'accepted':0,'optional':0},
                'fallback_used':True,'fallback_reason':'Parser JSON falhou.'}
        if translate_to:
            names = {'en':'Inglês','es':'Espanhol','fr':'Francês','de':'Alemão','it':'Italiano','pt':'Português'}
            t_reply = result.get('corrected_text',text)
            result['translation'] = {'translated_text':t_reply,'target_language':translate_to}
        return jsonify(result)

    @app.route('/api/settings', methods=['GET','POST'])
    def api_settings():
        print("altera Setings")
        defaults = {'theme':'green-blue','profile':'WARM','lang':'pt','voiceEnabled':False,'memoryEnabled':True,'canvasEnabled':True}
        if request.method == 'GET': return jsonify(session.get('gaia_settings', defaults))
        session['gaia_settings'] = request.get_json(force=True); return jsonify({'status':'saved'})

    @app.route('/api/memory', methods=['GET','POST','DELETE'])
    def api_memory():
        print("verifica memoria")
        if request.method == 'GET': return jsonify({'short':[],'medium':[],'long':[]})
        if request.method == 'DELETE': return jsonify({'status':'cleared'})
        return jsonify({'status':'saved'})
