import os
import sys
import shutil
import subprocess
import platform

# 定义版本号
VERSION = "1.0.0"

def clean_build_dirs():
    """清理构建目录"""
    print("清理构建目录...")
    dirs_to_clean = ['build', 'dist']
    for dir_name in dirs_to_clean:
        if os.path.exists(dir_name):
            shutil.rmtree(dir_name)
    
    # 清理spec文件
    if os.path.exists('PPMS.spec'):
        os.remove('PPMS.spec')

def run_pyinstaller():
    """运行PyInstaller打包程序"""
    print("开始构建可执行文件...")
    
    # 基本命令 - 使用更简单的命令行参数
    cmd = [
        'pyinstaller',
        '--name=PPMS',
        '--icon=web/favicon.ico',
        '--add-data=web;web',
        '--add-data=ppms.db;.',
        '--add-data=ppms.manifest;.',  # 添加清单文件
        '--hidden-import=pandas',
        '--hidden-import=openpyxl',
        '--hidden-import=pystray',
        '--hidden-import=PIL',
        '--hidden-import=webview',
        '--hidden-import=sqlite3',
        '--additional-hooks-dir=.',
        '--noconsole',
        '--clean',
        '--windowed',
        'main.py'
    ]
    
    # Windows特定选项
    if platform.system() == 'Windows':
        cmd.extend([
            '--hidden-import=win32api',
            '--hidden-import=win32gui',
            '--hidden-import=win32con',
            # 移除UAC管理员权限要求
            # '--uac-admin',
            # 添加清单文件
            f'--manifest=ppms.manifest',
        ])
    
    # 执行PyInstaller命令
    print("执行命令:", " ".join(cmd))
    result = subprocess.run(cmd, capture_output=True, text=True)
    
    # 输出结果
    print("=== PyInstaller 输出 ===")
    print(result.stdout)
    
    if result.stderr:
        print("=== PyInstaller 错误 ===")
        print(result.stderr)
    
    if result.returncode != 0:
        print(f"PyInstaller 失败，返回码: {result.returncode}")
    else:
        print("PyInstaller 成功完成打包")

def create_installer():
    """创建安装程序（仅Windows）"""
    if platform.system() != 'Windows':
        print("安装程序创建功能仅支持Windows系统")
        return
    
    print("正在创建Windows安装程序...")
    
    # 使用Inno Setup编译脚本
    try:
        subprocess.run(['iscc', 'installer_script.iss'], check=True)
        print("安装程序创建成功")
    except subprocess.CalledProcessError as e:
        print(f"创建安装程序失败: {e}")
    except FileNotFoundError:
        print("错误: 未找到Inno Setup编译器(iscc.exe)，请确保已安装Inno Setup并添加到PATH")

def copy_additional_files():
    """复制额外的必要文件到dist目录"""
    print("复制额外文件...")
    
    # 创建README文件
    with open(os.path.join('dist', 'PPMS', 'README.txt'), 'w', encoding='utf-8') as f:
        f.write(f"""PPMS项目管理系统 v{VERSION}
=========================

感谢您使用PPMS项目管理系统！

启动方法：
双击PPMS.exe运行程序

注意事项：
1. 数据存储在程序目录下的ppms.db文件中
2. 请定期备份数据库文件
3. 如遇问题，请重启应用或联系开发者

祝您使用愉快！
""")
    
    # 确保数据库文件存在
    dist_db_path = os.path.join('dist', 'PPMS', 'ppms.db')
    if not os.path.exists(dist_db_path) and os.path.exists('ppms.db'):
        print("复制数据库文件...")
        shutil.copy2('ppms.db', dist_db_path)
    
    # 创建空白数据库目录（如果需要）
    os.makedirs(os.path.join('dist', 'PPMS', 'data'), exist_ok=True)
    
    # 确保清单文件存在
    manifest_path = os.path.join('dist', 'PPMS', 'ppms.manifest')
    if not os.path.exists(manifest_path) and os.path.exists('ppms.manifest'):
        print("复制清单文件...")
        shutil.copy2('ppms.manifest', manifest_path)

def main():
    """主函数"""
    print(f"开始打包PPMS项目管理系统 v{VERSION}...")
    
    # 检查是否已安装PyInstaller
    try:
        import PyInstaller
        print(f"PyInstaller版本: {PyInstaller.__version__}")
    except ImportError:
        print("错误: 未安装PyInstaller，请先运行 'pip install pyinstaller'")
        return
    
    # 清理旧的构建文件
    clean_build_dirs()
    
    # 运行PyInstaller
    run_pyinstaller()
    
    # 复制额外文件
    if os.path.exists(os.path.join('dist', 'PPMS')):
        copy_additional_files()
        print("额外文件已复制")
    else:
        print("错误: 构建目录不存在，打包可能失败")
        return
    
    # 创建安装程序（可选）
    # create_installer()
    
    print(f"PPMS项目管理系统 v{VERSION} 打包完成!")
    print(f"可执行文件位于: {os.path.abspath(os.path.join('dist', 'PPMS', 'PPMS.exe'))}")

if __name__ == "__main__":
    main() 