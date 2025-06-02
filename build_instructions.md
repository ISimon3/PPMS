# PPMS项目管理系统 - 构建说明

本文档提供了如何从源代码构建PPMS项目管理系统的详细说明。

## 环境要求

- Python 3.8 或更高版本
- Windows 10 或更高版本 (推荐，其他平台可能需要调整)
- Git (可选，用于获取源代码)

## 步骤1：准备环境

1. 安装Python 3.8+，确保将Python添加到PATH环境变量中
2. 创建并激活虚拟环境（推荐）:

```bash
# 创建虚拟环境
python -m venv .venv

# 激活虚拟环境
# Windows
.venv\Scripts\activate
# Linux/macOS
# source .venv/bin/activate
```

## 步骤2：安装依赖

安装构建所需的所有依赖项:

```bash
pip install -r requirements_build.txt
```

这将安装以下依赖:
- pywebview - 用于创建基于Web的GUI
- pystray - 用于系统托盘功能
- Pillow - 图像处理库
- pandas - 数据分析库
- openpyxl - Excel文件处理
- pyinstaller - 用于打包Python应用程序
- pywin32 - Windows特定功能(仅Windows平台)

## 步骤3：构建可执行文件

运行打包脚本:

```bash
python pyinstaller_build.py
```

这将执行以下操作:
1. 清理旧的构建文件
2. 使用PyInstaller打包应用程序
3. 复制必要的额外文件
4. 在dist/PPMS目录下生成可执行文件

## 步骤4：创建安装程序（可选）

### 使用Inno Setup (Windows)

1. 下载并安装[Inno Setup](https://jrsoftware.org/isdl.php)
2. 打开installer_script.iss文件
3. 点击"运行"按钮编译安装程序
4. 安装程序将在installer目录下生成

或者，取消pyinstaller_build.py中create_installer()函数的注释，并修改为使用Inno Setup:

```python
def create_installer():
    """创建安装程序（仅Windows）"""
    if platform.system() != 'Windows':
        print("安装程序创建功能仅支持Windows系统")
        return
    
    print("正在创建Windows安装程序...")
    
    # 使用Inno Setup编译脚本
    subprocess.run(['iscc', 'installer_script.iss'])
```

然后重新运行:

```bash
python pyinstaller_build.py
```

## 步骤5：测试打包应用程序

1. 导航到dist/PPMS目录
2. 运行PPMS.exe
3. 验证所有功能是否正常工作

## 常见问题及解决方案

### 缺少DLL文件

如果运行时出现缺少DLL文件的错误，可能需要安装Visual C++ Redistributable:
- [Microsoft Visual C++ Redistributable](https://support.microsoft.com/en-us/help/2977003/the-latest-supported-visual-c-downloads)

### 托盘图标不显示

确保web/favicon.ico文件存在且有效。如果仍有问题，尝试使用不同格式的图标文件。

### 数据库连接错误

确保ppms.db文件正确包含在打包中。检查--add-data参数是否正确设置。

### PyInstaller打包失败

尝试使用--debug选项运行PyInstaller以获取更详细的错误信息:

```bash
pyinstaller --debug=all --name=PPMS main.py
```

## 自定义打包选项

### 修改图标

替换web/favicon.ico文件，或修改pyinstaller_build.py中的--icon参数。

### 修改版本信息

编辑pyinstaller_build.py文件顶部的VERSION变量。

### 添加额外文件

修改pyinstaller_build.py中的--add-data参数或copy_additional_files函数。

## 发布检查清单

在发布之前，请确保:

1. 所有功能正常工作
2. 数据库操作正常
3. 托盘功能正常
4. 自启动设置正常
5. 安装/卸载过程顺利
6. 版本号已更新 