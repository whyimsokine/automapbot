from aiogram import types, Router
from aiogram.filters import Command
from config import WEB_APP_URL
from database import save_user, save_parking_location
from keyboards import main_menu, back_button
from datetime import datetime, timedelta
import json

router = Router()

@router.message(Command("add_reminder"))
async def add_reminder(message: types.Message):
    # Пример: /add_reminder ОСАГО 2025-12-31
    args = message.text.split()
    if len(args) < 3:
        await message.answer("❌ Формат: /add_reminder <тип> <дата>\nНапример: /add_reminder ОСАГО 2025-12-31")
        return
    
    reminder_type = args[1]
    try:
        date = datetime.strptime(args[2], "%Y-%m-%d")
    except ValueError:
        await message.answer("❌ Неверный формат даты. Используйте ГГГГ-ММ-ДД")
        return
    
    # Сохраняем в базу
    save_reminder(message.from_user.id, reminder_type, date)
    await message.answer(f"✅ Напоминание о {reminder_type} до {date.strftime('%d.%m.%Y')} сохранено!")

@router.message(Command("start"))
async def start(message: types.Message):
    save_user(message.from_user.id, message.from_user.username)
    await message.answer(
        "🚗 **АвтоПомощник**\n\nНажми на кнопку, чтобы открыть приложение.",
        reply_markup=main_menu(),
        parse_mode="Markdown"
    )

@router.message(Command("help"))
async def help_cmd(message: types.Message):
    await message.answer("📖 Помощь: Нажми 'Открыть приложение' для доступа ко всем функциям.", reply_markup=back_button())

@router.callback_query(lambda c: c.data == "back")
async def back(callback: types.CallbackQuery):
    await callback.message.edit_text("Главное меню", reply_markup=main_menu())
    await callback.answer()

@router.message(lambda msg: msg.web_app_data is not None)
async def web_app_handler(message: types.Message):
    data = json.loads(message.web_app_data.data)
    action = data.get('action')
    
    if action == 'parking_reminder':
        save_parking_location(message.from_user.id, data['lat'], data['lng'])
        await message.answer("✅ Напоминание включено! Я пришлю уведомление через 30 минут.")
    
    elif action == 'emergency_call':
        await message.answer("📞 Звони в ГАИ по номеру 102")
    
    elif action == 'check_fines':
        car_number = data.get('car_number', '')
        await message.answer(
            f"🔍 Проверка штрафов для {car_number}\n\n"
            f"👉 Перейдите на официальный портал e-pasluga.by\n"
            f"и выполните поиск по номеру автомобиля."
        )