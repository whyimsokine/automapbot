import asyncio
from database import get_users_for_notification, mark_reminder_sent

async def check_parking_reminders(bot):
    """Фоновая задача: проверяет каждые 30 секунд, кому пора напомнить"""
    while True:
        users = get_users_for_notification()
        for user_id, lat, lng in users:
            try:
                await bot.send_message(
                    user_id,
                    f"⏰ Напоминание о парковке!\n\nТы припарковался в районе {lat}, {lng}.\nПроверь, оплатил ли ты парковку."
                )
                mark_reminder_sent(user_id)
                await asyncio.sleep(1)
            except:
                pass
        await asyncio.sleep(30)