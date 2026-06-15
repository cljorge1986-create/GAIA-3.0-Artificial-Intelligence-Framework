from dotenv import load_dotenv
load_dotenv(dotenv_path="config/.env")
from pathlib import Path
from languages.pt import Language as pt
import os

# Exemplo: from config.settings import LLM_API_KEY
class Settings:
    # Language global
    LANG = pt
    # ── Tipos de ficheiro / input ─────────────────────────────────────────────
    FILE_TYPE_TEXT  = "text"
    FILE_TYPE_FILE  = "file"
    FILE_TYPE_IMAGE = "image"
    FILE_TYPE_AUDIO = "audio"

    HF_TOKEN = os.getenv("HF_TOKEN", "")

    # Logos Module
    LLM_API_KEY       = os.getenv("LLM_API_KEY", "")
    LLM_MODEL         = os.getenv("LLM_MODEL", "gpt-4o-mini")
    
    CONFIDENCE_SHOW    = float(os.getenv("CONFIDENCE_SHOW",    "0.70"))
    CONFIDENCE_DISCARD = float(os.getenv("CONFIDENCE_DISCARD", "0.50"))
    MAX_DIFF_RATIO     = float(os.getenv("MAX_DIFF_RATIO",     "0.40"))
    
    ## Thoth module: 
    # ── LLM ──────────────────────────────────────────────────────────────────────
    LLM_TEMPERATURE   = float(os.getenv("LLM_TEMPERATURE", "0.7"))
    LLM_MAX_TOKENS    = int(os.getenv("LLM_MAX_TOKENS", "1024"))
    
    # ── Safety ────────────────────────────────────────────────────────────────────
    MAX_INPUT_LENGTH  = int(os.getenv("MAX_INPUT_LENGTH", "4000"))
    
    # ── Memory ────────────────────────────────────────────────────────────────────
    SHORT_TERM_LIMIT  = int(os.getenv("SHORT_TERM_LIMIT", "20"))   # nº de mensagens
    CHROMA_DB_PATH    = os.getenv("CHROMA_DB_PATH", "db/chroma_db")
    EMBED_MODEL       = os.getenv("EMBED_MODEL", "all-MiniLM-L6-v2")
    
    # ── Web tool ──────────────────────────────────────────────────────────────────
    SEARCH_API_KEY    = os.getenv("SEARCH_API_KEY", "")
    SEARCH_ENGINE_ID  = os.getenv("SEARCH_ENGINE_ID", "")
    
    ## Apollo -- Images module
    LLM_TEMPERATURE   = float(os.getenv("LLM_TEMPERATURE", "0.2"))
    
    CONFIDENCE_MIN      = float(os.getenv("CONFIDENCE_MIN",      "0.55"))
    CONFIDENCE_OPTIONAL = float(os.getenv("CONFIDENCE_OPTIONAL", "0.72"))
    
    MAX_IMAGE_MB  = int(os.getenv("MAX_IMAGE_MB",  "10"))
    MAX_IMAGE_PX  = int(os.getenv("MAX_IMAGE_PX",  "1536"))
    CACHE_MAX_ENTRIES = int(os.getenv("CACHE_MAX_ENTRIES", "200"))
    
    ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
    
    HOST = os.getenv("HOST", "0.0.0.0")
    PORT = int(os.getenv("PORT", "8000"))
    

    # Variaveis globais (não mexer)
    FILE_TYPE_IMAGE = "image"
    FILE_TYPE_AUDIO = "audio"
    FILE_TYPE_FILE  = "file"
    FILE_TYPE_TEXT  = "text"

# ── Anthropic ─────────────────────────────────────────────────────────────
    ANTHROPIC_API_KEY       : str  = os.getenv("ANTHROPIC_API_KEY", "")
    CLAUDE_MODEL            : str  = os.getenv("CLAUDE_MODEL", "claude-sonnet-4-20250514")

# ── Auditoria ─────────────────────────────────────────────────────────────
    AUDIT_LOG_DIR           : Path = Path(os.getenv("AUDIT_LOG_DIR", "logs"))
    AUDIT_DB_PATH           : Path = Path(os.getenv("AUDIT_DB_PATH", "logs/audit.db"))
    
class Lang:
    """Mensagens de utilizador — nunca expõem detalhes técnicos internos."""

    # Hermes
    ERROR_BLOCKED_INPUT                  = "O teu pedido não pôde ser processado."
    ERROR_TEXT_MESSAGE_HERMESCONTROLLER  = "Ocorreu um erro ao processar a mensagem."
    ERROR_EMPTY_MESSAGE                  = "A mensagem não pode estar vazia."
    ERROR_INVALID_FILE                   = "O ficheiro enviado não é suportado ou está danificado."
    ERROR_FILE_TOO_LARGE                 = "O ficheiro excede o tamanho máximo permitido."

    # Orpheus
    ERROR_OUTPUT_PROCESSING              = "Ocorreu um erro ao processar a resposta."

    # Pipeline
    ERROR_PIPELINE_BLOCKED               = "O pedido foi bloqueado por motivos de segurança."