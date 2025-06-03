#define MyAppName "PPMS"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "Simonius"
#define MyAppURL "https://github.com/ISimon3/PPMS"
#define MyAppExeName "PPMS.exe"

[Setup]
; 注意: AppId的值为唯一标识此应用程序。
; 不要在其他安装程序中使用相同的AppId值。
; (要生成新的GUID，可在菜单中点击 工具|生成GUID)
AppId={{8F6D2F7E-0A3C-4D1F-9C3E-4B5A8D6F7C9A}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={autopf}\{#MyAppName}
DisableProgramGroupPage=yes
; 以下行取消注释，则创建开始菜单目录
CreateAppDir=yes
LicenseFile=LICENSE
; 取消以下行的注释以允许用户选择安装目录
;AllowDirSelect=yes
OutputDir=installer
OutputBaseFilename=PPMS_Setup_{#MyAppVersion}
; 使用ICO格式的图标文件作为安装程序图标
SetupIconFile={#SourcePath}\web\favicon.ico
Compression=lzma
SolidCompression=yes
WizardStyle=modern
; 不再默认要求管理员权限，让UAC自动提升
PrivilegesRequired=lowest
PrivilegesRequiredOverridesAllowed=dialog
; 设置安装向导图片
WizardImageFile={#SourcePath}\wizard.bmp
WizardSmallImageFile={#SourcePath}\wizard-small.bmp

[Languages]
Name: "chinese"; MessagesFile: "compiler:Languages\ChineseSimplified.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked
Name: "quicklaunchicon"; Description: "{cm:CreateQuickLaunchIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked; OnlyBelowVersion: 6.1; Check: not IsAdminInstallMode

[Files]
Source: "dist\PPMS\{#MyAppExeName}"; DestDir: "{app}"; Flags: ignoreversion
Source: "dist\PPMS\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs
; 添加UAC清单文件
Source: "ppms.manifest"; DestDir: "{app}"; Flags: ignoreversion
; 注意: 不要在共享系统文件上使用"Flags: ignoreversion"

[Icons]
Name: "{autoprograms}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon
Name: "{userappdata}\Microsoft\Internet Explorer\Quick Launch\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: quicklaunchicon

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent

[UninstallDelete]
Type: files; Name: "{app}\*.log"
Type: filesandordirs; Name: "{app}\__pycache__" 