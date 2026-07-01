from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo
from config import WEB_APP_URL

def main_menu():
    """Главное меню с кнопкой открытия Mini App"""
    
    # Проверяем, что URL загрузился
    if not WEB_APP_URL:
        print("⚠️ WEB_APP_URL не загружен! Проверьте .env файл.")
        # Если URL нет, показываем кнопку без WebApp
        keyboard = InlineKeyboardMarkup(
            inline_keyboard=[
                [
                    InlineKeyboardButton(
                        text="⚠️ Ошибка: приложение не настроено",
                        callback_data="error"
                    )
                ]
            ]
        )
        return keyboard
    
    keyboard = InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="🚗 Открыть приложение",
                    web_app=WebAppInfo(url=WEB_APP_URL)
                )
            ]
        ]
    )
    return keyboard

def back_button():
    """Кнопка возврата назад"""
    keyboard = InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="← Назад",
                    callback_data="back"
                )
            ]
        ]
    )
    return keyboard