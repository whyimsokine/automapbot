import asyncio
import logging
import os
from dotenv import load_dotenv
from pathlib import Path

# Загружаем .env
env_file = Path(__file__).parent / '.env'
load_dotenv(dotenv_path=env_file)

# ПРОВЕРКА — читаем токен напрямую из файла
try:
    with open(env_file, 'r', encoding='utf-8') as f:
        content = f.read()
        print(f"📄 Содержимое .env:\n{content}")
except Exception as e:
    print(f"❌ Не удалось прочитать файл: {e}")

# ПРАВИЛЬНО — ищем по ИМЕНИ переменной
BOT_TOKEN = os.getenv('BOT_TOKEN')
YANDEX_MAPS_API_KEY = os.getenv('YANDEX_MAPS_API_KEY')
WEB_APP_URL = os.getenv('WEB_APP_URL')

print(f"🔑 BOT_TOKEN: {BOT_TOKEN is not None}")
print(f"🗺️ YANDEX_MAPS_API_KEY: {YANDEX_MAPS_API_KEY is not None}")
print(f"🌐 WEB_APP_URL: {WEB_APP_URL}")

if not BOT_TOKEN:
    print("❌ Токен НЕ НАЙДЕН! Давайте проверим файл вручную.")
    print(f"Файл существует: {env_file.exists()}")
    print(f"Полный путь: {env_file.absolute()}")
    exit(1)

print("✅ Токен загружен!")

from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from handlers import router
from database import init_db
from utils import check_parking_reminders

logging.basicConfig(level=logging.INFO)

bot = Bot(token=BOT_TOKEN, default=DefaultBotProperties(parse_mode=ParseMode.MARKDOWN))
dp = Dispatcher()
dp.include_router(router)

async def main():
    init_db()
    asyncio.create_task(check_parking_reminders(bot))
    print("🚗 Бот АвтоПомощник запущен!")
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())