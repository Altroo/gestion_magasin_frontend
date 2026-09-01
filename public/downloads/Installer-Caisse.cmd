@echo off
setlocal
title Installation Caisse

set "CAISSE_SETUP_FILE=%~f0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$marker = [char]35 + ' POWERSHELL-BEGIN'; $content = [System.IO.File]::ReadAllText($env:CAISSE_SETUP_FILE); $index = $content.IndexOf($marker); if ($index -lt 0) { exit 90 }; & ([scriptblock]::Create($content.Substring($index + $marker.Length)))"
set "CAISSE_EXIT=%ERRORLEVEL%"
endlocal & exit /b %CAISSE_EXIT%

# POWERSHELL-BEGIN
$ErrorActionPreference = 'Stop'

$caisseRoot = Join-Path $env:LOCALAPPDATA 'GestionMagasinPOS'
$printerNamePath = Join-Path $caisseRoot 'printer-name.txt'
$launcherPath = Join-Path $caisseRoot 'launch-caisse.ps1'
$launcherUri = 'https://gestion-magasin.elbouazzatiholding.ma/downloads/launch-caisse.ps1'
$launcherSha256 = 'cd126108f3506333be8801e6bdb023a3e7db93710e4a530fcba067950638bc47'
$printerPattern = 'WDLink|WD8260|POSPrinter|POS[- ]?80'
$temporaryPaths = [System.Collections.Generic.List[string]]::new()

function Show-CaisseMessage {
    param([Parameter(Mandatory = $true)][string] $Message, [string] $Title = 'Installation Caisse', [bool] $IsError = $false)
    try {
        Add-Type -AssemblyName PresentationFramework -ErrorAction Stop
        $icon = if ($IsError) { [System.Windows.MessageBoxImage]::Error } else { [System.Windows.MessageBoxImage]::Information }
        [System.Windows.MessageBox]::Show($Message, $Title, [System.Windows.MessageBoxButton]::OK, $icon) | Out-Null
    } catch {
        Write-Host "$Title : $Message"
    }
}

function Install-FileAtomically {
    param([Parameter(Mandatory = $true)][string] $Source, [Parameter(Mandatory = $true)][string] $Destination)
    if ([System.IO.File]::Exists($Destination)) {
        [System.IO.File]::Replace($Source, $Destination, $null)
    } else {
        [System.IO.File]::Move($Source, $Destination)
    }
}

function Set-AndConfirmDefaultPrinter {
    param([Parameter(Mandatory = $true)] $Printer)
    $result = Invoke-CimMethod -InputObject $Printer -MethodName SetDefaultPrinter
    if ([int]$result.ReturnValue -ne 0) {
        throw "Windows a refuse de definir l'imprimante par defaut (code $($result.ReturnValue))."
    }
    for ($attempt = 0; $attempt -lt 20; $attempt += 1) {
        $confirmed = Get-CimInstance -ClassName Win32_Printer | Where-Object { $_.Name -eq $Printer.Name -and $_.Default } | Select-Object -First 1
        if ($confirmed) { return }
        Start-Sleep -Milliseconds 100
    }
    throw "Windows n'a pas confirme '$($Printer.Name)' comme imprimante par defaut."
}

try {
    if (-not $env:LOCALAPPDATA) { throw 'Le dossier LOCALAPPDATA de cet utilisateur est introuvable.' }
    $identity = [System.Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = [System.Security.Principal.WindowsPrincipal]::new($identity)
    if ($principal.IsInRole([System.Security.Principal.WindowsBuiltInRole]::Administrator)) {
        Show-CaisseMessage -IsError $true -Message "Ne lancez pas ce fichier avec 'Executer en tant qu'administrateur'.`n`nFermez cette fenetre, puis double-cliquez normalement sur Installer-Caisse.cmd afin d'installer la caisse pour l'utilisateur actuel."
        exit 4
    }

    $matchingPrinters = @(Get-CimInstance -ClassName Win32_Printer | Where-Object { $_.Name -match $printerPattern -or $_.DriverName -match $printerPattern })
    if ($matchingPrinters.Count -eq 0) {
        Show-CaisseMessage -IsError $true -Message "Aucune imprimante POS-80 compatible n'a ete trouvee.`n`nInstallez d'abord le pilote POSPrinter WDLink WD8260, verifiez que l'imprimante apparait dans 'Imprimantes et scanners', puis relancez cette installation."
        exit 2
    }
    if ($matchingPrinters.Count -gt 1) {
        $printerList = ($matchingPrinters | ForEach-Object { "- $($_.Name) (pilote : $($_.DriverName))" }) -join [Environment]::NewLine
        Show-CaisseMessage -IsError $true -Message "Plusieurs imprimantes POS compatibles ont ete trouvees :`n`n$printerList`n`nConservez une seule file POS-80 dans Windows, puis relancez cette installation. Aucun choix automatique n'a ete effectue."
        exit 3
    }

    $printer = $matchingPrinters[0]
    Set-AndConfirmDefaultPrinter -Printer $printer

    $chromePolicyPath = 'HKCU:\Software\Policies\Google\Chrome'
    New-Item -Path $chromePolicyPath -Force | Out-Null
    New-ItemProperty -Path $chromePolicyPath -Name 'PrintPreviewUseSystemDefaultPrinter' -PropertyType DWord -Value 1 -Force | Out-Null
    $policyValue = (Get-ItemProperty -Path $chromePolicyPath -Name 'PrintPreviewUseSystemDefaultPrinter').PrintPreviewUseSystemDefaultPrinter
    if ([int]$policyValue -ne 1) {
        throw "La strategie Chrome imposant l'imprimante Windows par defaut n'a pas pu etre activee."
    }

    [System.IO.Directory]::CreateDirectory($caisseRoot) | Out-Null
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

    $launcherDownloadPath = Join-Path $caisseRoot ("launch-caisse.$([guid]::NewGuid().ToString('N')).download")
    $temporaryPaths.Add($launcherDownloadPath)
    Invoke-WebRequest -UseBasicParsing -Uri $launcherUri -OutFile $launcherDownloadPath
    $actualHash = (Get-FileHash -LiteralPath $launcherDownloadPath -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($actualHash -ne $launcherSha256) { throw "Le lanceur telecharge n'est pas authentique (SHA-256 inattendu). Installation annulee." }
    Install-FileAtomically -Source $launcherDownloadPath -Destination $launcherPath
    $temporaryPaths.Remove($launcherDownloadPath) | Out-Null

    $utf8NoBom = [System.Text.UTF8Encoding]::new($false)
    $printerNameTemporaryPath = Join-Path $caisseRoot ("printer-name.$([guid]::NewGuid().ToString('N')).tmp")
    $temporaryPaths.Add($printerNameTemporaryPath)
    [System.IO.File]::WriteAllText($printerNameTemporaryPath, [string]$printer.Name, $utf8NoBom)
    Install-FileAtomically -Source $printerNameTemporaryPath -Destination $printerNamePath
    $temporaryPaths.Remove($printerNameTemporaryPath) | Out-Null

    $powerShellPath = Join-Path $env:SystemRoot 'System32\WindowsPowerShell\v1.0\powershell.exe'
    if (-not [System.IO.File]::Exists($powerShellPath)) { throw 'Windows PowerShell est introuvable sur cet ordinateur.' }
    $desktopPath = [Environment]::GetFolderPath([Environment+SpecialFolder]::DesktopDirectory)
    if (-not $desktopPath) { throw 'Le dossier Bureau de cet utilisateur est introuvable.' }

    $shortcutPath = Join-Path $desktopPath 'Caisse.lnk'
    $shortcutTemporaryPath = Join-Path $desktopPath ("Caisse.$([guid]::NewGuid().ToString('N')).lnk")
    $temporaryPaths.Add($shortcutTemporaryPath)
    $shell = New-Object -ComObject WScript.Shell
    $shortcut = $shell.CreateShortcut($shortcutTemporaryPath)
    $shortcut.TargetPath = $powerShellPath
    $shortcut.Arguments = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$launcherPath`""
    $shortcut.WorkingDirectory = $caisseRoot
    $shortcut.IconLocation = "$powerShellPath,0"
    $shortcut.Description = 'Gestion Magasin - Caisse'
    $shortcut.Save()
    Install-FileAtomically -Source $shortcutTemporaryPath -Destination $shortcutPath
    $temporaryPaths.Remove($shortcutTemporaryPath) | Out-Null

    Show-CaisseMessage -Message "Installation terminee.`n`nImprimante : $($printer.Name)`nLe raccourci 'Caisse' a ete ajoute au Bureau.`n`nDouble-cliquez sur ce raccourci pour ouvrir la caisse."
    exit 0
} catch {
    Show-CaisseMessage -IsError $true -Message "L'installation de la caisse a echoue.`n`n$($_.Exception.Message)"
    exit 1
} finally {
    foreach ($temporaryPath in $temporaryPaths) {
        if ([System.IO.File]::Exists($temporaryPath)) { Remove-Item -LiteralPath $temporaryPath -Force -ErrorAction SilentlyContinue }
    }
}
