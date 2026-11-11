$ErrorActionPreference = "Stop"

$desktopDirectory = Split-Path -Parent $MyInvocation.MyCommand.Path
$repositoryRoot = Split-Path -Parent $desktopDirectory
$virtualEnvironment = Join-Path $desktopDirectory ".venv"
$pythonExecutable = Join-Path $virtualEnvironment "Scripts\python.exe"
$releaseDirectory = Join-Path $desktopDirectory "release"
$buildDirectory = Join-Path $desktopDirectory "build"
$iconPath = Join-Path $repositoryRoot "assets\images\app-icon-512.png"
$entryPoint = Join-Path $desktopDirectory "nexora_desktop.py"
$requirements = Join-Path $desktopDirectory "requirements.txt"
$tempDirectory = Join-Path $desktopDirectory ".build-temp"
$pipCache = Join-Path $tempDirectory "pip-cache"

New-Item -ItemType Directory -Force -Path $tempDirectory, $pipCache | Out-Null
$env:TEMP = $tempDirectory
$env:TMP = $tempDirectory
$env:PIP_CACHE_DIR = $pipCache

if (-not (Test-Path -LiteralPath $pythonExecutable)) {
  python -m venv $virtualEnvironment
  if ($LASTEXITCODE -ne 0) { throw "Could not create the desktop build environment." }
}

& $pythonExecutable -m pip install --no-cache-dir -r $requirements
if ($LASTEXITCODE -ne 0) { throw "Could not install the desktop build dependencies." }
& $pythonExecutable -m PyInstaller --noconfirm --clean --windowed --onefile --name Nexora --icon $iconPath --distpath $releaseDirectory --workpath $buildDirectory --specpath $buildDirectory $entryPoint
if ($LASTEXITCODE -ne 0) { throw "PyInstaller could not build Nexora.exe." }

$executable = Join-Path $releaseDirectory "Nexora.exe"
$archive = Join-Path $releaseDirectory "Nexora-Windows.zip"
if (-not (Test-Path -LiteralPath $executable)) {
  throw "Nexora.exe was not created."
}

Compress-Archive -Path $executable, (Join-Path $desktopDirectory "README.md") -DestinationPath $archive -Force
Write-Output "Built $executable"
Write-Output "Packaged $archive"
