import os
import sys
import json
import webview
import sqlite3
import logging
import pandas as pd
import subprocess
from datetime import datetime, timedelta
from pathlib import Path
import platform
import threading
import ctypes

# Windows平台特定模块导入
if platform.system() == 'Windows':
    import winreg
    try:
        import win32event
        import win32api
        import winerror
        import win32gui
        import win32con
        import win32process
        PYWIN32_AVAILABLE = True
    except ImportError:
        print("警告: pywin32模块导入失败，单例检测和窗口操作将不可用")
        PYWIN32_AVAILABLE = False

# 单例实现 - 创建互斥锁
def create_mutex(mutex_name="PPMS_SINGLETON_MUTEX"):
    """创建一个互斥锁确保程序只有一个实例运行"""
    # 如果不是Windows平台或pywin32不可用，返回假值
    if platform.system() != 'Windows' or not PYWIN32_AVAILABLE:
        return None, True  # 不执行单例检查，总是允许程序运行
    
    try:    
        mutex = win32event.CreateMutex(None, False, mutex_name)
        last_error = win32api.GetLastError()
        
        # 如果互斥锁已存在，则尝试查找并激活已有窗口
        if last_error == winerror.ERROR_ALREADY_EXISTS:
            try:
                hwnd = win32gui.FindWindow(None, 'PPMS项目管理系统')
                if hwnd:
                    # 如果窗口最小化，则恢复
                    if win32gui.IsIconic(hwnd):
                        win32gui.ShowWindow(hwnd, win32con.SW_RESTORE)
                    # 前置窗口
                    win32gui.SetForegroundWindow(hwnd)
                    win32gui.SetActiveWindow(hwnd)
                    # 通过pywebview刷新内容（防止空白）
                    # 这里无法直接拿到window对象，但可通过窗口消息通知主进程刷新
                return mutex, False
            except Exception as e:
                print(f"激活已有窗口失败: {e}")
                return mutex, True  # 如果无法激活已有窗口，则允许运行新实例
        return mutex, True
    except Exception as e:
        print(f"创建互斥锁失败: {e}")
        return None, True  # 如果创建互斥锁失败，则允许运行新实例

class PPMS:
    def __init__(self):
        self.window = None
        # 确保数据库文件在项目根目录下
        self.db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'ppms.db')
        self.init_database()
        self._should_quit = False
        self._tray_icon = None

    def init_database(self):
        """Initialize the SQLite database with required tables."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # Tasks table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            deadline TEXT,
            status TEXT DEFAULT 'pending',
            priority TEXT DEFAULT 'medium',
            created_at TEXT,
            updated_at TEXT,
            notes TEXT,
            client TEXT,
            category TEXT
        )
        ''')

        # Task progress table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS task_progress (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            task_id INTEGER,
            progress_text TEXT,
            timestamp TEXT,
            FOREIGN KEY (task_id) REFERENCES tasks(id)
        )
        ''')

        # Accounts/URLs table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS accounts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            website_name TEXT NOT NULL,
            url TEXT,
            username TEXT,
            password TEXT,
            notes TEXT,
            tag TEXT,
            account TEXT,
            row TEXT,
            created_at TEXT
        )
        ''')
        
        # Websites table (新增)
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS websites (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            url TEXT,
            description TEXT,
            created_at TEXT
        )
        ''')

        # Completed projects table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            type TEXT,
            quantity INTEGER,
            completion_date TEXT,
            payment_status TEXT DEFAULT 'unpaid',
            notes TEXT,
            archived INTEGER DEFAULT 0,
            task_id INTEGER
        )
        ''')

        # Payments table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER,
            amount REAL,
            date TEXT,
            notes TEXT,
            FOREIGN KEY (project_id) REFERENCES projects(id)
        )
        ''')

        # Settings table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS settings (
            id INTEGER PRIMARY KEY,
            theme TEXT DEFAULT 'light',
            password TEXT,
            last_backup TEXT,
            window_width INTEGER DEFAULT 1260,
            window_height INTEGER DEFAULT 900,
            min_width INTEGER DEFAULT 800,
            min_height INTEGER DEFAULT 600,
            autostart INTEGER DEFAULT 0,
            minimize_to_tray INTEGER DEFAULT 0
        )
        ''')
        
        # Clients list table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS clients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            created_at TEXT
        )
        ''')
        
        # Categories list table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            created_at TEXT
        )
        ''')

        # Insert default settings if not exists
        cursor.execute('''
        INSERT OR IGNORE INTO settings (id, theme, autostart, minimize_to_tray) VALUES (1, 'light', 0, 0)
        ''')

        # 执行数据库迁移
        self.migrate_database(cursor)

        conn.commit()
        conn.close()

    def migrate_database(self, cursor):
        """执行数据库迁移，添加新字段到现有表"""
        try:
            # 检查tasks表是否有client和category字段
            cursor.execute("PRAGMA table_info(tasks)")
            columns = [column[1] for column in cursor.fetchall()]
            
            # 如果没有client字段，添加它
            if 'client' not in columns:
                print("正在添加client字段到tasks表...")
                cursor.execute("ALTER TABLE tasks ADD COLUMN client TEXT")
            
            # 如果没有category字段，添加它
            if 'category' not in columns:
                print("正在添加category字段到tasks表...")
                cursor.execute("ALTER TABLE tasks ADD COLUMN category TEXT")
                
                # 使用description字段的值填充category字段
                cursor.execute("UPDATE tasks SET category = description WHERE category IS NULL")
            
            # 如果没有quantity字段，添加它
            if 'quantity' not in columns:
                print("正在添加quantity字段到tasks表...")
                cursor.execute("ALTER TABLE tasks ADD COLUMN quantity INTEGER DEFAULT 1")
            
            # 检查accounts表是否有account和row字段
            cursor.execute("PRAGMA table_info(accounts)")
            accounts_columns = [column[1] for column in cursor.fetchall()]
            
            # 如果没有account字段，添加它
            if 'account' not in accounts_columns:
                print("正在添加account字段到accounts表...")
                cursor.execute("ALTER TABLE accounts ADD COLUMN account TEXT")
            
            # 如果没有row字段，添加它
            if 'row' not in accounts_columns:
                print("正在添加row字段到accounts表...")
                cursor.execute("ALTER TABLE accounts ADD COLUMN row TEXT")
            
            # 检查projects表是否有task_id字段
            cursor.execute("PRAGMA table_info(projects)")
            project_columns = [column[1] for column in cursor.fetchall()]
            
            # 如果没有task_id字段，添加它
            if 'task_id' not in project_columns:
                print("正在添加task_id字段到projects表...")
                cursor.execute("ALTER TABLE projects ADD COLUMN task_id INTEGER")
            
            # 检查settings表是否有window_width、window_height等字段
            cursor.execute("PRAGMA table_info(settings)")
            settings_columns = [column[1] for column in cursor.fetchall()]
            
            if 'window_width' not in settings_columns:
                print("正在添加window_width字段到settings表...")
                cursor.execute("ALTER TABLE settings ADD COLUMN window_width INTEGER DEFAULT 1260")
                cursor.execute("UPDATE settings SET window_width = 1260 WHERE id = 1")
            
            if 'window_height' not in settings_columns:
                print("正在添加window_height字段到settings表...")
                cursor.execute("ALTER TABLE settings ADD COLUMN window_height INTEGER DEFAULT 900")
                cursor.execute("UPDATE settings SET window_height = 900 WHERE id = 1")
            
            if 'min_width' not in settings_columns:
                print("正在添加min_width字段到settings表...")
                cursor.execute("ALTER TABLE settings ADD COLUMN min_width INTEGER DEFAULT 800")
                cursor.execute("UPDATE settings SET min_width = 800 WHERE id = 1")
            
            if 'min_height' not in settings_columns:
                print("正在添加min_height字段到settings表...")
                cursor.execute("ALTER TABLE settings ADD COLUMN min_height INTEGER DEFAULT 600")
                cursor.execute("UPDATE settings SET min_height = 600 WHERE id = 1")
            
            # 检查是否有clients表和categories表
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='clients'")
            has_clients_table = cursor.fetchone() is not None
            
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='categories'")
            has_categories_table = cursor.fetchone() is not None
            
            if not has_clients_table:
                print("创建客户列表表...")
                cursor.execute('''
                CREATE TABLE clients (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL UNIQUE,
                    created_at TEXT
                )
                ''')
            
            if not has_categories_table:
                print("创建项目类型表...")
                cursor.execute('''
                CREATE TABLE categories (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL UNIQUE,
                    created_at TEXT
                )
                ''')
            
            # 新增：自动添加autostart和minimize_to_tray字段
            if 'autostart' not in settings_columns:
                print("正在添加autostart字段到settings表...")
                cursor.execute("ALTER TABLE settings ADD COLUMN autostart INTEGER DEFAULT 0")
                cursor.execute("UPDATE settings SET autostart = 0 WHERE id = 1")
            if 'minimize_to_tray' not in settings_columns:
                print("正在添加minimize_to_tray字段到settings表...")
                cursor.execute("ALTER TABLE settings ADD COLUMN minimize_to_tray INTEGER DEFAULT 0")
                cursor.execute("UPDATE settings SET minimize_to_tray = 0 WHERE id = 1")
            
            print("数据库迁移完成")
        except Exception as e:
            print(f"数据库迁移错误: {e}")
            
    # === Client Management APIs ===
    def get_clients(self):
        """获取所有客户列表"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("SELECT id, name, created_at FROM clients ORDER BY name")
        clients = cursor.fetchall()
        conn.close()
        
        columns = ['id', 'name', 'created_at']
        return [dict(zip(columns, client)) for client in clients]
    
    def add_client(self, name):
        """添加新客户"""
        if not name or not name.strip():
            return {"error": "客户名称不能为空"}
            
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        try:
            cursor.execute("INSERT INTO clients (name, created_at) VALUES (?, ?)", (name.strip(), now))
            client_id = cursor.lastrowid
            conn.commit()
            conn.close()
            return {"id": client_id, "name": name.strip(), "created_at": now}
        except sqlite3.IntegrityError:
            conn.close()
            return {"error": "客户名称已存在"}
        except Exception as e:
            conn.close()
            return {"error": str(e)}
    
    def delete_client(self, client_id):
        """删除客户"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            cursor.execute("DELETE FROM clients WHERE id = ?", (client_id,))
            affected_rows = cursor.rowcount
            conn.commit()
            conn.close()
            
            if affected_rows > 0:
                return {"success": True}
            else:
                return {"error": "客户不存在"}
        except Exception as e:
            conn.close()
            return {"error": str(e)}
    
    # === Category Management APIs ===
    def get_categories(self):
        """获取所有项目类型列表"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("SELECT id, name, created_at FROM categories ORDER BY name")
        categories = cursor.fetchall()
        conn.close()
        
        columns = ['id', 'name', 'created_at']
        return [dict(zip(columns, category)) for category in categories]
    
    def add_category(self, name):
        """添加新项目类型"""
        if not name or not name.strip():
            return {"error": "项目类型名称不能为空"}
            
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        try:
            cursor.execute("INSERT INTO categories (name, created_at) VALUES (?, ?)", (name.strip(), now))
            category_id = cursor.lastrowid
            conn.commit()
            conn.close()
            return {"id": category_id, "name": name.strip(), "created_at": now}
        except sqlite3.IntegrityError:
            conn.close()
            return {"error": "项目类型名称已存在"}
        except Exception as e:
            conn.close()
            return {"error": str(e)}
    
    def delete_category(self, category_id):
        """删除项目类型"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            cursor.execute("DELETE FROM categories WHERE id = ?", (category_id,))
            affected_rows = cursor.rowcount
            conn.commit()
            conn.close()
            
            if affected_rows > 0:
                return {"success": True}
            else:
                return {"error": "项目类型不存在"}
        except Exception as e:
            conn.close()
            return {"error": str(e)}

    # === Task Management APIs ===
    def get_tasks(self, status=None, priority=None):
        """Get tasks with optional filters."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        query = "SELECT * FROM tasks"
        params = []
        
        if status and priority:
            query += " WHERE status = ? AND priority = ?"
            params = [status, priority]
        elif status:
            query += " WHERE status = ?"
            params = [status]
        elif priority:
            query += " WHERE priority = ?"
            params = [priority]
            
        query += " ORDER BY deadline ASC"
        
        cursor.execute(query, params)
        tasks = cursor.fetchall()
        conn.close()
        
        columns = ['id', 'title', 'description', 'deadline', 'status', 
                  'priority', 'created_at', 'updated_at', 'notes', 'client', 'category', 'quantity']
        
        return [dict(zip(columns, task)) for task in tasks]

    def add_task(self, title, description=None, deadline=None, priority="medium", notes=None, client=None, quantity=1):
        """Add a new task."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        # 使用description字段作为category字段
        category = description
        
        cursor.execute('''
        INSERT INTO tasks (title, description, deadline, status, priority, created_at, updated_at, notes, client, category, quantity)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (title, None, deadline, 'pending', priority, now, now, notes, client, category, quantity))
        
        task_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return task_id

    def update_task(self, task_id, updates_dict):
        """Update a task with provided fields."""
        valid_fields = ['title', 'description', 'deadline', 'status', 'priority', 'notes', 'client', 'category', 'quantity']
        
        updates = {k: v for k, v in updates_dict.items() if k in valid_fields}
        if not updates:
            return False
            
        updates['updated_at'] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        set_clause = ", ".join([f"{k} = ?" for k in updates.keys()])
        params = list(updates.values()) + [task_id]
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute(f"UPDATE tasks SET {set_clause} WHERE id = ?", params)
        conn.commit()
        conn.close()
        
        return True
        
    def add_task_progress(self, task_id, progress_text):
        """Add progress update to a task."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        cursor.execute('''
        INSERT INTO task_progress (task_id, progress_text, timestamp)
        VALUES (?, ?, ?)
        ''', (task_id, progress_text, now))
        
        conn.commit()
        conn.close()
        
        return True
        
    def get_task_progress(self, task_id):
        """Get progress updates for a task."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
        SELECT * FROM task_progress WHERE task_id = ? ORDER BY timestamp DESC
        ''', (task_id,))
        
        progress = cursor.fetchall()
        conn.close()
        
        columns = ['id', 'task_id', 'progress_text', 'timestamp']
        return [dict(zip(columns, p)) for p in progress]

    # === Account Management APIs ===
    def get_accounts(self, tag=None):
        """Get accounts with optional tag filter."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # 直接通过字段名获取数据，不依赖字段顺序
        query = """
        SELECT 
            id,
            website_name,
            url,
            username,
            password,
            notes,
            tag,
            account,
            row,
            created_at
        FROM accounts
        """
        params = []
        
        if tag:
            query += " WHERE tag = ?"
            params = [tag]
            
        query += " ORDER BY website_name ASC"
        
        cursor.execute(query, params)
        accounts = cursor.fetchall()
        conn.close()
        
        # 列名与查询返回的字段顺序保持一致
        columns = ['id', 'website_name', 'url', 'username', 'password', 'notes', 'tag', 'account', 'row', 'created_at']
        result = []
        
        for account in accounts:
            # 创建账号字典
            account_dict = dict(zip(columns, account))
            
            # 清理数据，确保None值不会显示为"null"或"undefined"
            for key in account_dict:
                if account_dict[key] is None:
                    account_dict[key] = ''
                    
            # 打印调试信息到服务器控制台
            print(f"从数据库读取账号: {account_dict}")
                    
            result.append(account_dict)
            
        return result

    def add_account(self, website_name, url=None, username=None, password=None, notes=None, tag=None, account=None, row=None):
        """Add a new account."""
        print(f"添加账号参数: website_name={website_name}, url={url}, username={username}, password={password}, notes={notes}, tag={tag}, account={account}, row={row}")
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        # 确保row为None或有实际值
        if row == '':
            row = None
            
        # 直接使用命名参数，避免位置参数的顺序混淆
        cursor.execute('''
        INSERT INTO accounts 
        (website_name, url, username, password, notes, tag, account, row, created_at) 
        VALUES 
        (:website_name, :url, :username, :password, :notes, :tag, :account, :row, :created_at)
        ''', {
            'website_name': website_name,
            'url': url,
            'username': username,
            'password': password,
            'notes': notes,
            'tag': tag, 
            'account': account,
            'row': row,
            'created_at': now
        })
        
        account_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        # 返回完整的账号对象以便检查数据
        return {
            'id': account_id,
            'website_name': website_name,
            'url': url,
            'username': username,
            'password': password,
            'notes': notes,
            'tag': tag,
            'account': account,
            'row': row,
            'created_at': now
        }
        
    def update_account(self, account_id, updates_dict):
        """Update an account with provided fields."""
        print(f"更新账号 {account_id} 参数: {updates_dict}")
        
        valid_fields = ['website_name', 'url', 'username', 'password', 'notes', 'tag', 'account', 'row']
        
        updates = {k: v for k, v in updates_dict.items() if k in valid_fields}
        if not updates:
            return False
        
        # 处理row字段，确保空值被存储为NULL
        if 'row' in updates and (updates['row'] == '' or updates['row'] is None):
            updates['row'] = None
            
        # 使用命名参数构建SQL语句
        set_clauses = []
        for field in updates.keys():
            set_clauses.append(f"{field} = :{field}")
            
        set_sql = ", ".join(set_clauses)
        
        # 将account_id添加到参数字典中
        params = dict(updates)
        params['account_id'] = account_id
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # 使用命名参数执行更新
        cursor.execute(f"UPDATE accounts SET {set_sql} WHERE id = :account_id", params)
        
        # 检查是否成功更新
        rows_affected = cursor.rowcount
        
        conn.commit()
        conn.close()
        
        # 返回详细结果
        return {
            'success': rows_affected > 0,
            'rows_affected': rows_affected,
            'updated_fields': list(updates.keys())
        }
    
    def delete_account(self, account_id):
        """Delete an account."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("DELETE FROM accounts WHERE id = ?", (account_id,))
        conn.commit()
        conn.close()
        
        return True
        
    # === Project Management APIs ===
    def get_projects(self, archived=False):
        """Get projects with archive filter."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
        SELECT * FROM projects WHERE archived = ? ORDER BY completion_date DESC
        ''', (1 if archived else 0,))
        
        projects = cursor.fetchall()
        conn.close()
        
        columns = ['id', 'name', 'type', 'quantity', 'completion_date', 'payment_status', 'notes', 'archived', 'task_id']
        return [dict(zip(columns, project)) for project in projects]

    def delete_project(self, project_id):
        """删除项目，如果已结算则返回错误"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            # 首先检查项目是否存在
            cursor.execute("SELECT payment_status FROM projects WHERE id = ?", (project_id,))
            result = cursor.fetchone()
            
            if not result:
                conn.close()
                return {"success": False, "error": "项目不存在"}
            
            payment_status = result[0]
            
            # 检查项目是否已结算
            if payment_status == 'paid':
                # 检查是否有关联的支付记录
                cursor.execute("SELECT id FROM payments WHERE project_id = ?", (project_id,))
                payment_records = cursor.fetchall()
                
                if payment_records:
                    conn.close()
                    return {"success": False, "error": "项目已结算，请先删除关联的结算记录", "payment_ids": [p[0] for p in payment_records]}
            
            # 删除项目
            cursor.execute("DELETE FROM projects WHERE id = ?", (project_id,))
            
            conn.commit()
            conn.close()
            
            return {"success": True}
        
        except Exception as e:
            conn.rollback()
            conn.close()
            return {"success": False, "error": str(e)}

    def add_project(self, name, type=None, quantity=None, completion_date=None, payment_status="unpaid", notes=None, task_id=None):
        """Add a new project."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
        INSERT INTO projects (name, type, quantity, completion_date, payment_status, notes, task_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (name, type, quantity, completion_date, payment_status, notes, task_id))
        
        project_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return project_id
        
    def update_project(self, project_id, updates_dict):
        """Update a project with provided fields."""
        valid_fields = ['name', 'type', 'quantity', 'completion_date', 'payment_status', 'notes', 'archived']
        
        updates = {k: v for k, v in updates_dict.items() if k in valid_fields}
        if not updates:
            return False
            
        set_clause = ", ".join([f"{k} = ?" for k in updates.keys()])
        params = list(updates.values()) + [project_id]
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute(f"UPDATE projects SET {set_clause} WHERE id = ?", params)
        conn.commit()
        conn.close()
        
        return True

    # === Payment Management APIs ===
    def get_payments(self, project_id=None):
        """Get payments with optional project filter."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        query = "SELECT * FROM payments"
        params = []
        
        if project_id:
            query += " WHERE project_id = ?"
            params = [project_id]
            
        query += " ORDER BY date DESC"
        
        cursor.execute(query, params)
        payments = cursor.fetchall()
        conn.close()
        
        columns = ['id', 'project_id', 'amount', 'date', 'notes']
        return [dict(zip(columns, payment)) for payment in payments]

    def add_payment(self, project_id, amount, date=None, notes=None):
        """Add a new payment."""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            if not date:
                date = datetime.now().strftime("%Y-%m-%d")
            
            # 检查项目是否存在
            cursor.execute("SELECT id FROM projects WHERE id = ?", (project_id,))
            project = cursor.fetchone()
            if not project:
                conn.close()
                return {"error": "项目不存在"}
            
            # 检查该项目是否已经有结算记录
            cursor.execute("SELECT id FROM payments WHERE project_id = ?", (project_id,))
            existing_payment = cursor.fetchone()
            if existing_payment:
                conn.close()
                return {"error": "该项目已有结算记录，不能重复结算"}
            
            cursor.execute('''
            INSERT INTO payments (project_id, amount, date, notes)
            VALUES (?, ?, ?, ?)
            ''', (project_id, amount, date, notes))
            
            payment_id = cursor.lastrowid
            
            # Update project payment status
            cursor.execute('''
            UPDATE projects SET payment_status = 'paid' WHERE id = ?
            ''', (project_id,))
            
            conn.commit()
            conn.close()
            
            print(f"成功添加结算记录: ID={payment_id}, 项目ID={project_id}, 金额={amount}")
            return payment_id
        except sqlite3.Error as e:
            print(f"数据库错误: {e}")
            try:
                if conn:
                    conn.rollback()
                    conn.close()
            except:
                pass
            return {"error": f"数据库错误: {str(e)}"}
        except Exception as e:
            print(f"添加结算记录时发生错误: {e}")
            try:
                if conn:
                    conn.rollback()
                    conn.close()
            except:
                pass
            return {"error": f"添加结算记录失败: {str(e)}"}
        
    def delete_payment(self, payment_id):
        """Delete a payment record and update related project."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            # 首先查找该结算关联的项目
            cursor.execute("SELECT project_id FROM payments WHERE id = ?", (payment_id,))
            result = cursor.fetchone()
            
            if not result:
                conn.close()
                return {"success": False, "error": "结算记录不存在"}
                
            project_id = result[0]
            
            # 删除结算记录
            cursor.execute("DELETE FROM payments WHERE id = ?", (payment_id,))
            
            # 检查该项目是否还有其他结算记录
            cursor.execute("SELECT COUNT(*) FROM payments WHERE project_id = ?", (project_id,))
            count = cursor.fetchone()[0]
            
            # 如果没有其他结算记录，将项目状态更新为未结算
            if count == 0:
                cursor.execute("UPDATE projects SET payment_status = 'unpaid' WHERE id = ?", (project_id,))
            
            conn.commit()
            conn.close()
            
            return {"success": True}
        
        except Exception as e:
            conn.rollback()
            conn.close()
            return {"success": False, "error": str(e)}

    # === Settings APIs ===
    def get_settings(self):
        """Get application settings."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        try:
            cursor.execute("PRAGMA table_info(settings)")
            columns_info = cursor.fetchall()
            column_names = [col[1] for col in columns_info]
            cursor.execute("SELECT * FROM settings WHERE id = 1")
            settings_row = cursor.fetchone()
            if settings_row:
                settings_dict = {}
                for i, col in enumerate(column_names):
                    if i < len(settings_row):
                        settings_dict[col] = settings_row[i]
                # 默认值
                if 'window_width' not in settings_dict or settings_dict['window_width'] is None:
                    settings_dict['window_width'] = 1260
                if 'window_height' not in settings_dict or settings_dict['window_height'] is None:
                    settings_dict['window_height'] = 900
                if 'min_width' not in settings_dict or settings_dict['min_width'] is None:
                    settings_dict['min_width'] = 800
                if 'min_height' not in settings_dict or settings_dict['min_height'] is None:
                    settings_dict['min_height'] = 600
                if 'autostart' not in settings_dict or settings_dict['autostart'] is None:
                    settings_dict['autostart'] = 0
                if 'minimize_to_tray' not in settings_dict or settings_dict['minimize_to_tray'] is None:
                    settings_dict['minimize_to_tray'] = 0
                conn.close()
                return settings_dict
            else:
                conn.close()
                return {'id': 1, 'theme': 'light', 'window_width': 1260, 'window_height': 900, 'min_width': 800, 'min_height': 600, 'autostart': 0, 'minimize_to_tray': 0}
        except Exception as e:
            conn.close()
            return {'id': 1, 'theme': 'light', 'window_width': 1260, 'window_height': 900, 'min_width': 800, 'min_height': 600, 'autostart': 0, 'minimize_to_tray': 0}
        
    def update_settings(self, updates_dict):
        """更新应用程序设置"""
        valid_fields = ['password', 'theme', 'window_width', 'window_height', 'min_width', 'min_height', 'autostart', 'minimize_to_tray']
        updates = {k: v for k, v in updates_dict.items() if k in valid_fields}
        if not updates:
            return {"error": "没有有效的更新字段"}
        set_clauses = []
        for field in updates.keys():
            set_clauses.append(f"{field} = :{field}")
        set_sql = ", ".join(set_clauses)
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        try:
            cursor.execute(f"UPDATE settings SET {set_sql} WHERE id = 1", updates)
            conn.commit()
            rows_affected = cursor.rowcount
            conn.close()
            
            # 如果主题被更新，立即应用新主题
            if 'theme' in updates and self.window:
                try:
                    # 通过JavaScript应用新主题
                    js_code = f'''
                    (function() {{
                        console.log("[Python注入] theme=", "{updates["theme"]}");
                        document.body.setAttribute("data-theme", "{updates["theme"]}");
                        document.body.className = "{updates["theme"]}";
                        window.dispatchEvent(new Event("themeChanged"));
                    }})();
                    '''
                    self.window.evaluate_js(js_code)
                except Exception as e:
                    print(f"应用主题时出错: {e}")
            
            return {
                "success": rows_affected > 0,
                "rows_affected": rows_affected,
                "updated_fields": list(updates.keys())
            }
        except Exception as e:
            conn.close()
            return {"error": str(e)}
            
    def get_window_property(self, property_name):
        """获取窗口属性"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute(f"SELECT {property_name} FROM settings WHERE id = 1")
            result = cursor.fetchone()
            conn.close()
            
            if result:
                return result[0]
            else:
                return None
        except Exception as e:
            return None
            
    def get_window_size(self):
        """获取当前窗口大小设置"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute("SELECT window_width, window_height FROM settings WHERE id = 1")
            result = cursor.fetchone()
            conn.close()
            
            if result:
                width, height = result
                return {
                    "width": width,
                    "height": height,
                    "size": f"{width}x{height}"
                }
            else:
                return {
                    "width": 1260,
                    "height": 900,
                    "size": "1260x900"
                }
        except Exception as e:
            return {
                "width": 1260,
                "height": 900,
                "size": "1260x900",
                "error": str(e)
            }
            
    def restart_application(self):
        """Restart the application."""
        try:
            # 关闭当前窗口
            if self.window:
                self.window.destroy()
            
            # 获取当前脚本路径
            script_path = sys.argv[0]
            
            # 如果是Python文件，使用python命令重启
            if script_path.endswith('.py'):
                executable = sys.executable
                args = [executable] + sys.argv
                subprocess.Popen(args)
            # 如果是可执行文件，直接重启
            else:
                subprocess.Popen(sys.argv)
            
            # 退出当前进程
            sys.exit(0)
            
        except Exception as e:
            return {"error": str(e)}
        
    # === Data Export APIs ===
    def export_data(self, data_type, format="excel"):
        """Export data to Excel or CSV format."""
        conn = sqlite3.connect(self.db_path)
        
        if data_type == "accounts":
            # 账号数据导出
            df = pd.read_sql_query("SELECT * FROM accounts", conn)
            # 重命名列为中文
            df = df.rename(columns={
                'id': '编号',
                'website_name': '网站类型',
                'url': '网址',
                'username': '用户名',
                'account': '账号',
                'row': '扩展行',
                'password': '密码',
                'tag': '项目类型',
                'created_at': '创建时间',
                'notes': '备注'
            })
            # 调整列顺序
            columns_order = ['编号', '网站类型', '网址', '用户名', '账号', '扩展行', '密码', '项目类型', '创建时间', '备注']
            df = df[columns_order]
        elif data_type == "projects":
            # 项目数据导出
            query = """
            SELECT 
                id,
                name,
                CASE 
                    WHEN name LIKE '[%]%' THEN trim(substr(name, 2, instr(name, ']') - 2))
                    ELSE ''
                END as client_name,
                CASE 
                    WHEN name LIKE '[%]%' THEN trim(substr(name, instr(name, ']') + 1))
                    ELSE name
                END as project_description,
                type,
                quantity,
                completion_date,
                payment_status,
                notes,
                archived,
                task_id
            FROM projects
            """
            df = pd.read_sql_query(query, conn)
            # 重命名列为中文
            df = df.rename(columns={
                'id': '编号',
                'name': '项目名称',
                'client_name': '客户名称',
                'project_description': '项目描述',
                'type': '项目类型',
                'quantity': '数量',
                'completion_date': '完成日期',
                'payment_status': '结算状态',
                'notes': '备注',
                'archived': '已归档',
                'task_id': '关联任务'
            })
            # 转换结算状态为中文
            df['结算状态'] = df['结算状态'].map({'paid': '已结算', 'unpaid': '未结算'})
            # 转换归档状态为中文
            df['已归档'] = df['已归档'].map({0: '否', 1: '是'})
            # 调整列顺序
            columns_order = ['编号', '项目名称', '客户名称', '项目描述', '项目类型', '数量', '完成日期', '结算状态', '备注', '已归档', '关联任务']
            df = df[columns_order]
        elif data_type == "payments":
            # 结算数据导出（优化版）
            query = """
            SELECT 
                p.id as payment_id,
                pr.name as project_name,
                CASE 
                    WHEN pr.name LIKE '[%]%' THEN trim(substr(pr.name, 2, instr(pr.name, ']') - 2))
                    ELSE ''
                END as client_name,
                CASE 
                    WHEN pr.name LIKE '[%]%' THEN trim(substr(pr.name, instr(pr.name, ']') + 1))
                    ELSE pr.name
                END as project_description,
                pr.type as project_type,
                pr.quantity as quantity,
                p.amount as amount,
                p.date as payment_date,
                p.notes as notes
            FROM payments p
            JOIN projects pr ON p.project_id = pr.id
            ORDER BY p.date DESC
            """
            df = pd.read_sql_query(query, conn)
            # 重命名列为中文
            df = df.rename(columns={
                'payment_id': '编号',
                'project_name': '项目名称',
                'client_name': '客户名称',
                'project_description': '项目描述',
                'project_type': '项目类型',
                'quantity': '数量',
                'amount': '结算金额',
                'payment_date': '结算日期',
                'notes': '备注'
            })
        else:
            conn.close()
            return {"error": "无效的数据类型"}
            
        conn.close()
        
        # 创建导出目录 - 使用data文件夹而不是exports文件夹
        export_dir = os.path.join(os.path.dirname(self.db_path), "data")
        os.makedirs(export_dir, exist_ok=True)
        
        # 生成文件名
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        file_name = f"{data_type}_{timestamp}"
        
        try:
            if format == "excel":
                file_path = os.path.join(export_dir, f"{file_name}.xlsx")
                # 创建ExcelWriter对象
                with pd.ExcelWriter(file_path, engine='openpyxl') as writer:
                    sheet_name = {
                        "accounts": "账号数据",
                        "projects": "项目数据",
                        "payments": "结算数据"
                    }.get(data_type, data_type.capitalize())
                    
                    df.to_excel(writer, index=False, sheet_name=sheet_name)
                    # 自动调整列宽
                    worksheet = writer.sheets[sheet_name]
                    for idx, col in enumerate(df.columns):
                        # 计算最大宽度，考虑中文字符
                        max_len = 0
                        for value in df[col].astype(str):
                            # 计算字符串宽度，中文字符计为2
                            char_width = sum(2 if ord(c) > 127 else 1 for c in value)
                            max_len = max(max_len, char_width)
                        # 列名的宽度
                        col_width = sum(2 if ord(c) > 127 else 1 for c in str(col))
                        # 取最大值并增加一点空间
                        max_len = max(max_len, col_width) + 2
                        # 限制最大宽度
                        max_len = min(max_len, 50)
                        worksheet.column_dimensions[chr(65 + idx)].width = max_len
                
                # 获取相对路径，用于显示
                try:
                    # 获取应用根目录
                    app_dir = os.path.dirname(self.db_path)
                    # 计算相对路径
                    rel_path = os.path.relpath(file_path, app_dir)
                    # 如果是在data文件夹下，简化显示
                    if rel_path.startswith('data\\'):
                        display_path = rel_path
                    else:
                        display_path = file_path
                except:
                    display_path = file_path
                
                return {"success": True, "file_path": file_path, "display_path": display_path}
            elif format == "csv":
                file_path = os.path.join(export_dir, f"{file_name}.csv")
                df.to_csv(file_path, index=False, encoding='utf-8-sig')  # 使用带BOM的UTF-8编码以支持中文
                
                # 获取相对路径，用于显示
                try:
                    # 获取应用根目录
                    app_dir = os.path.dirname(self.db_path)
                    # 计算相对路径
                    rel_path = os.path.relpath(file_path, app_dir)
                    # 如果是在data文件夹下，简化显示
                    if rel_path.startswith('data\\'):
                        display_path = rel_path
                    else:
                        display_path = file_path
                except:
                    display_path = file_path
                
                return {"success": True, "file_path": file_path, "display_path": display_path}
            else:
                return {"error": "无效的格式"}
        except Exception as e:
            return {"error": str(e)}
            
    # === Statistics APIs ===
    def get_task_stats(self, period="week"):
        """Get task statistics for a period."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        today = datetime.now().strftime("%Y-%m-%d")
        
        if period == "week":
            # Get stats for the last 7 days
            cursor.execute('''
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                COUNT(DISTINCT date(created_at)) as active_days
            FROM tasks
            WHERE date(created_at) >= date(?, '-7 days')
            ''', (today,))
        elif period == "month":
            # Get stats for the last 30 days
            cursor.execute('''
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                COUNT(DISTINCT date(created_at)) as active_days
            FROM tasks
            WHERE date(created_at) >= date(?, '-30 days')
            ''', (today,))
        
        stats = cursor.fetchone()
        conn.close()
        
        if stats:
            total, completed, active_days = stats
            completion_rate = (completed / total) * 100 if total > 0 else 0
            
            return {
                "total": total,
                "completed": completed,
                "active_days": active_days,
                "completion_rate": round(completion_rate, 2)
            }
        
        return {
            "total": 0,
            "completed": 0,
            "active_days": 0,
            "completion_rate": 0
        }

    def get_payment_stats(self, period="month"):
        """Get payment statistics for a period."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        today = datetime.now().strftime("%Y-%m-%d")
        
        if period == "month":
            # Get stats for the current month
            cursor.execute('''
            SELECT 
                SUM(amount) as total_amount,
                COUNT(*) as payment_count
            FROM payments
            WHERE strftime('%Y-%m', date) = strftime('%Y-%m', ?)
            ''', (today,))
        elif period == "year":
            # Get stats for the current year
            cursor.execute('''
            SELECT 
                SUM(amount) as total_amount,
                COUNT(*) as payment_count
            FROM payments
            WHERE strftime('%Y', date) = strftime('%Y', ?)
            ''', (today,))
        
        stats = cursor.fetchone()
        conn.close()
        
        if stats:
            total_amount, payment_count = stats
            return {
                "total_amount": total_amount or 0,
                "payment_count": payment_count or 0
            }
        
        return {
            "total_amount": 0,
            "payment_count": 0
        }

    # === Website Management APIs ===
    def get_websites(self):
        """获取所有网站类型列表"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("SELECT id, name, url, description, created_at FROM websites ORDER BY name")
        websites = cursor.fetchall()
        conn.close()
        
        columns = ['id', 'name', 'url', 'description', 'created_at']
        return [dict(zip(columns, website)) for website in websites]
    
    def add_website(self, name, url=None, description=None):
        """添加新网站类型"""
        if not name or not name.strip():
            return {"error": "网站类型名称不能为空"}
            
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        try:
            cursor.execute(
                "INSERT INTO websites (name, url, description, created_at) VALUES (?, ?, ?, ?)", 
                (name.strip(), url, description, now)
            )
            website_id = cursor.lastrowid
            conn.commit()
            conn.close()
            return {
                "id": website_id, 
                "name": name.strip(), 
                "url": url, 
                "description": description, 
                "created_at": now
            }
        except sqlite3.IntegrityError:
            conn.close()
            return {"error": "网站类型名称已存在"}
        except Exception as e:
            conn.close()
            return {"error": str(e)}
    
    def update_website(self, website_id, updates_dict):
        """更新网站类型信息"""
        valid_fields = ['name', 'url', 'description']
        
        updates = {k: v for k, v in updates_dict.items() if k in valid_fields}
        if not updates:
            return {"error": "没有有效的更新字段"}
        
        # 检查name字段是否为空
        if 'name' in updates and (not updates['name'] or not updates['name'].strip()):
            return {"error": "网站类型名称不能为空"}
            
        # 如果name字段有值，确保它被去除首尾空格
        if 'name' in updates:
            updates['name'] = updates['name'].strip()
        
        # 使用命名参数构建SQL语句
        set_clauses = []
        for field in updates.keys():
            set_clauses.append(f"{field} = :{field}")
            
        set_sql = ", ".join(set_clauses)
        
        # 将website_id添加到参数字典中
        params = dict(updates)
        params['website_id'] = website_id
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            # 使用命名参数执行更新
            cursor.execute(f"UPDATE websites SET {set_sql} WHERE id = :website_id", params)
            
            # 检查是否成功更新
            rows_affected = cursor.rowcount
            
            conn.commit()
            conn.close()
            
            return {
                "success": rows_affected > 0,
                "rows_affected": rows_affected,
                "updated_fields": list(updates.keys())
            }
        except sqlite3.IntegrityError:
            conn.close()
            return {"error": "网站类型名称已存在"}
        except Exception as e:
            conn.close()
            return {"error": str(e)}
    
    def delete_website(self, website_id):
        """删除网站类型"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            # 检查是否有账号使用此网站类型
            cursor.execute("SELECT COUNT(*) FROM accounts WHERE website_name = (SELECT name FROM websites WHERE id = ?)", (website_id,))
            count = cursor.fetchone()[0]
            
            if count > 0:
                conn.close()
                return {"error": f"无法删除，有{count}个账号正在使用该网站类型"}
            
            cursor.execute("DELETE FROM websites WHERE id = ?", (website_id,))
            affected_rows = cursor.rowcount
            conn.commit()
            conn.close()
            
            if affected_rows > 0:
                return {"success": True}
            else:
                return {"error": "网站类型不存在"}
        except Exception as e:
            conn.close()
            return {"error": str(e)}

    def open_file_explorer(self, path):
        """打开文件浏览器到指定路径"""
        try:
            if os.path.exists(path):
                if sys.platform == 'win32':
                    os.startfile(path)
                elif sys.platform == 'darwin':  # macOS
                    subprocess.Popen(['open', path])
                else:  # Linux
                    subprocess.Popen(['xdg-open', path])
                return {"success": True}
            else:
                return {"error": "路径不存在"}
        except Exception as e:
            return {"error": str(e)}

def get_resource_path(relative_path):
    """Get absolute path to resource, works for dev and for PyInstaller."""
    try:
        # PyInstaller creates a temp folder and stores path in _MEIPASS
        base_path = sys._MEIPASS
    except Exception:
        base_path = os.path.abspath(".")

    return os.path.join(base_path, relative_path)

def set_autostart(enable):
    if platform.system() != 'Windows':
        return False
    key = r'Software\\Microsoft\\Windows\\CurrentVersion\\Run'
    app_name = 'PPMS项目管理系统'
    exe_path = sys.executable if getattr(sys, 'frozen', False) else sys.argv[0]
    try:
        with winreg.OpenKey(winreg.HKEY_CURRENT_USER, key, 0, winreg.KEY_ALL_ACCESS) as regkey:
            if enable:
                winreg.SetValueEx(regkey, app_name, 0, winreg.REG_SZ, exe_path)
            else:
                try:
                    winreg.DeleteValue(regkey, app_name)
                except FileNotFoundError:
                    pass
        return True
    except Exception as e:
        print('设置开机自启失败:', e)
        return False

def show_tray_icon(window, on_quit):
    # 仅Windows实现
    import pystray
    from PIL import Image
    import ctypes
    import os
    icon_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'web', 'favicon.ico')
    try:
        image = Image.open(icon_path)
    except Exception:
        image = Image.new('RGBA', (64, 64), (67, 97, 238, 255))
    def on_open(icon, item=None):
        window.show()
        window.restore()
        # 强制刷新页面（只在内容空白时）
        try:
            window.evaluate_js('if (document.body && document.body.innerHTML.trim() === "") { location.reload(); }')
        except Exception:
            pass
        # 让窗口前置
        try:
            ctypes.windll.user32.SetForegroundWindow(window.gui.window_handle)
        except Exception:
            pass
    def on_exit(icon, item):
        icon.visible = False
        icon.stop()
        on_quit()
    menu = pystray.Menu(
        pystray.MenuItem('打开主界面', on_open),
        pystray.MenuItem('退出', on_exit)
    )
    icon = pystray.Icon('PPMS', image, 'PPMS项目管理系统', menu=menu)
    threading.Thread(target=icon.run, daemon=True).start()
    icon.visible = True
    return icon

def main():
    # 创建互斥锁确保程序只运行一个实例
    mutex, is_first_instance = create_mutex()
    if not is_first_instance and platform.system() == 'Windows' and PYWIN32_AVAILABLE:
        # 如果不是第一个实例，直接退出
        sys.exit(0)
        
    app = PPMS()
    settings = app.get_settings()
    html_path = get_resource_path('web/index.html')
    theme = settings.get('theme', 'light')
    if platform.system() == 'Windows':
        set_autostart(bool(settings.get('autostart', 0)))

    try:
        window = webview.create_window(
            'PPMS项目管理系统',
            html_path,
            js_api=app,
            width=int(settings.get('window_width', 1260)),
            height=int(settings.get('window_height', 900)), 
            min_size=(int(settings.get('min_width', 1000)), int(settings.get('min_height', 680)))
        )
        app.window = window
    except Exception as e:
        print(f"创建窗口时出错: {e}")
        sys.exit(1)
    
    # 设置初始主题
    app.window.initial_theme = theme
    
    # 在窗口加载完成后立即应用主题
    def on_loaded():
        try:
            theme = settings.get('theme', 'light')
            js_code = f'''
            (function() {{
                console.log("[Python注入] theme=", "{theme}");
                document.body.setAttribute("data-theme", "{theme}");
                document.body.className = "{theme}";
                window.dispatchEvent(new Event("themeChanged"));
            }})();
            '''
            app.window.evaluate_js(js_code)
            print("主题已通过Python注入")
        except Exception as e:
            print(f"应用主题时出错: {e}")
    
    # 注册窗口加载完成事件
    app.window.events.loaded += on_loaded
    
    def on_quit():
        # 退出时先销毁托盘
        if app._tray_icon:
            try:
                app._tray_icon.visible = False
                app._tray_icon.stop()
            except Exception:
                pass
            app._tray_icon = None
        app._should_quit = True
        # 释放互斥锁
        if platform.system() == 'Windows' and PYWIN32_AVAILABLE and mutex:
            try:
                win32api.CloseHandle(mutex)
            except Exception:
                pass

    if platform.system() == 'Windows' and settings.get('minimize_to_tray', 0):
        def on_minimize():
            app.window.hide()
            if not app._tray_icon:
                app._tray_icon = show_tray_icon(app.window, on_quit)
        app.window.events.minimized += on_minimize
        def on_closing():
            result = ctypes.windll.user32.MessageBoxW(0, "确定要关闭PPMS项目管理系统吗？", "确认关闭", 1)
            if result == 1:
                on_quit()
                return True
            else:
                return False
        app.window.events.closing += on_closing
    else:
        def on_closing():
            if platform.system() == 'Windows':
                result = ctypes.windll.user32.MessageBoxW(0, "确定要关闭PPMS项目管理系统吗？", "确认关闭", 1)
                if result == 1:
                    app._should_quit = True
                    return True
                else:
                    return False
            else:
                app._should_quit = True
                return True
        app.window.events.closing += on_closing

    try:
        webview.start(debug=False, gui='edgechromium')
    except Exception as e:
        print(f"启动窗口时出错: {e}")
        sys.exit(1)

    # 主循环退出后再彻底退出进程
    if app._should_quit:
        sys.exit(0)

if __name__ == '__main__':
    main() 