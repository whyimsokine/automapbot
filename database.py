import sqlite3
import json
from pathlib import Path
from datetime import datetime, timedelta

DB_NAME = 'auto_bot.db'

def init_db():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    # === ПОЛЬЗОВАТЕЛИ ===
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            user_id INTEGER PRIMARY KEY,
            username TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # === НАПОМИНАНИЯ О ПАРКОВКЕ ===
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS parking_reminders (
            user_id INTEGER PRIMARY KEY,
            lat REAL,
            lng REAL,
            started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            reminded BOOLEAN DEFAULT FALSE
        )
    ''')
    
    # === ШТРАФСТОЯНКИ ===
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS tow_parks (
            id INTEGER PRIMARY KEY,
            name TEXT,
            address TEXT,
            phone TEXT,
            lat REAL,
            lng REAL,
            city TEXT
        )
    ''')
    
    # === РАСХОДЫ ===
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            category TEXT,
            amount REAL,
            comment TEXT
        )
    ''')
    
    # === НАПОМИНАНИЯ (ОСАГО, ТЕХОСМОТР) ===
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS reminders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            reminder_type TEXT,
            reminder_date DATE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            notified BOOLEAN DEFAULT FALSE
        )
    ''')
    
    # === ЗАПОЛНЯЕМ ШТРАФСТОЯНКИ ===
    cursor.execute('SELECT COUNT(*) FROM tow_parks')
    if cursor.fetchone()[0] == 0:
        data_file = Path(__file__).parent / 'data' / 'tow_parks.json'
        print(f"📂 Загружаю данные из: {data_file}")
        
        if data_file.exists():
            with open(data_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                for p in data['parks']:
                    cursor.execute('''
                        INSERT INTO tow_parks (id, name, address, phone, lat, lng, city)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    ''', (p['id'], p['name'], p['address'], p['phone'], p['lat'], p['lng'], p['city']))
            print("✅ Данные штрафстоянок загружены!")
        else:
            print(f"⚠️ Файл не найден: {data_file}")
    
    conn.commit()
    conn.close()
    print("✅ База данных инициализирована")


# ============================================
# === ПОЛЬЗОВАТЕЛИ ===
# ============================================

def save_user(user_id, username):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute('INSERT OR IGNORE INTO users (user_id, username) VALUES (?, ?)', (user_id, username))
    conn.commit()
    conn.close()


def get_user(user_id):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM users WHERE user_id = ?', (user_id,))
    result = cursor.fetchone()
    conn.close()
    return result


# ============================================
# === НАПОМИНАНИЯ О ПАРКОВКЕ ===
# ============================================

def save_parking_location(user_id, lat, lng):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT OR REPLACE INTO parking_reminders (user_id, lat, lng, started_at, reminded)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP, FALSE)
    ''', (user_id, lat, lng))
    conn.commit()
    conn.close()


def get_users_for_notification():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute('''
        SELECT user_id, lat, lng FROM parking_reminders
        WHERE reminded = FALSE
        AND started_at <= datetime('now', '-30 minutes')
    ''')
    data = cursor.fetchall()
    conn.close()
    return data


def mark_reminder_sent(user_id):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute('UPDATE parking_reminders SET reminded = TRUE WHERE user_id = ?', (user_id,))
    conn.commit()
    conn.close()


# ============================================
# === ШТРАФСТОЯНКИ ===
# ============================================

def get_tow_parks():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM tow_parks')
    data = cursor.fetchall()
    conn.close()
    return data


# ============================================
# === РАСХОДЫ ===
# ============================================

def add_expense(user_id, category, amount, comment=''):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO expenses (user_id, category, amount, comment)
        VALUES (?, ?, ?, ?)
    ''', (user_id, category, amount, comment))
    conn.commit()
    conn.close()


def get_monthly_stats(user_id):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute('''
        SELECT category, SUM(amount) 
        FROM expenses 
        WHERE user_id = ? AND strftime('%Y-%m', date) = strftime('%Y-%m', 'now')
        GROUP BY category
    ''', (user_id,))
    data = cursor.fetchall()
    conn.close()
    return data


def get_expenses(user_id, limit=10):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute('''
        SELECT id, date, category, amount, comment
        FROM expenses
        WHERE user_id = ?
        ORDER BY date DESC
        LIMIT ?
    ''', (user_id, limit))
    data = cursor.fetchall()
    conn.close()
    return data


# ============================================
# === НАПОМИНАНИЯ (ОСАГО, ТЕХОСМОТР) ===
# ============================================

def save_reminder(user_id, reminder_type, reminder_date):
    """Сохраняет напоминание в базу"""
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO reminders (user_id, reminder_type, reminder_date)
        VALUES (?, ?, ?)
    ''', (user_id, reminder_type, reminder_date.strftime('%Y-%m-%d')))
    conn.commit()
    conn.close()


def get_user_reminders(user_id):
    """Получает все напоминания пользователя"""
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute('''
        SELECT id, reminder_type, reminder_date, notified
        FROM reminders
        WHERE user_id = ?
        ORDER BY reminder_date ASC
    ''', (user_id,))
    data = cursor.fetchall()
    conn.close()
    return data


def get_reminders_to_notify():
    """Получает напоминания, которые нужно отправить сегодня"""
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute('''
        SELECT id, user_id, reminder_type, reminder_date
        FROM reminders
        WHERE notified = FALSE
        AND reminder_date = date('now', '+7 days')
    ''')
    data = cursor.fetchall()
    conn.close()
    return data


def mark_reminder_notified(reminder_id):
    """Отмечает напоминание как отправленное"""
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute('UPDATE reminders SET notified = TRUE WHERE id = ?', (reminder_id,))
    conn.commit()
    conn.close()


def delete_reminder(reminder_id):
    """Удаляет напоминание"""
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute('DELETE FROM reminders WHERE id = ?', (reminder_id,))
    conn.commit()
    conn.close()