from PyInstaller.utils.hooks import collect_data_files, collect_submodules, collect_all
import os
import sys
import webview

# 收集所有webview子模块
hiddenimports = collect_submodules('webview')

# 特别添加可能缺失的平台模块
additional_imports = [
    'webview.platforms.cef',
    'webview.platforms.winforms',
    'webview.platforms.gtk',
    'webview.platforms.cocoa',
    'webview._js.api',
    'webview._js.bridge',
    'webview._js.event',
    'webview._js.polyfill',
]

for module in additional_imports:
    try:
        __import__(module)
        if module not in hiddenimports:
            hiddenimports.append(module)
    except ImportError:
        pass

# 收集所有webview数据文件
datas = collect_data_files('webview')

# 强制收集webview._js目录下所有文件（包括js、html等）
js_dir = os.path.join(os.path.dirname(webview.__file__), '_js')
if os.path.exists(js_dir):
    for f in os.listdir(js_dir):
        full_path = os.path.join(js_dir, f)
        if os.path.isfile(full_path):
            datas.append((full_path, 'webview/_js'))

# 强制收集webview/platforms目录下所有文件
platforms_dir = os.path.join(os.path.dirname(webview.__file__), 'platforms')
if os.path.exists(platforms_dir):
    for f in os.listdir(platforms_dir):
        full_path = os.path.join(platforms_dir, f)
        if os.path.isfile(full_path):
            datas.append((full_path, 'webview/platforms'))

# 收集CEF文件（如果使用）
try:
    import webview.platforms.cef
    cef_dir = os.path.dirname(webview.platforms.cef.__file__)
    if os.path.exists(cef_dir):
        for root, dirs, files in os.walk(cef_dir):
            for file in files:
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(os.path.dirname(full_path), os.path.dirname(cef_dir))
                datas.append((full_path, os.path.join('webview/platforms/cef', rel_path)))
except (ImportError, AttributeError):
    pass

# 移除可能导致问题的隐式导入
problematic_imports = [
    'webview.__pyinstaller',
    'webview.__pyinstaller.hook-webview',
    'webview._version'
]

for module in problematic_imports:
    if module in hiddenimports:
        hiddenimports.remove(module)

# 排除不需要的模块
excludedimports = ['tkinter']

# 调试信息
print("="*50)
print("PyWebView Hook 信息:")
print(f"隐式导入模块数量: {len(hiddenimports)}")
print(f"数据文件数量: {len(datas)}")
print("="*50)