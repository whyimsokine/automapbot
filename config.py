import os
from dotenv import load_dotenv
from pathlib import Path

# Загружаем .env
env_path = Path(__file__).parent / '.env'
load_dotenv(dotenv_path=env_path)

# ПРАВИЛЬНО — ищем по ИМЕНИ переменной
BOT_TOKEN = os.getenv('BOT_TOKEN')
YANDEX_MAPS_API_KEY = os.getenv('YANDEX_MAPS_API_KEY')
WEB_APP_URL = os.getenv('WEB_APP_URL')

# Отладочная печать
print(f"🔑 BOT_TOKEN загружен: {BOT_TOKEN is not None}")
print(f"🗺️ YANDEX_MAPS_API_KEY загружен: {YANDEX_MAPS_API_KEY is not None}")
print(f"🌐 WEB_APP_URL: {WEB_APP_URL}")