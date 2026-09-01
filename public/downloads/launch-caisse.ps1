$ErrorActionPreference = 'Stop'

$caisseUrl = 'https://gestion-magasin.elbouazzatiholding.ma/dashboard/caise'
$caisseRoot = Join-Path $env:LOCALAPPDATA 'GestionMagasinPOS'
$printerNamePath = Join-Path $caisseRoot 'printer-name.txt'
$profileDirectory = Join-Path $caisseRoot 'ChromeProfile'

function Show-CaisseError {
    param([Parameter(Mandatory = $true)][string] $Message)
    try {
        Add-Type -AssemblyName PresentationFramework -ErrorAction Stop
        [System.Windows.MessageBox]::Show($Message, 'Caisse - Configuration requise', [System.Windows.MessageBoxButton]::OK, [System.Windows.MessageBoxImage]::Error) | Out-Null
    } catch {
        Write-Host "Caisse - Configuration requise : $Message"
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
    if (-not [System.IO.File]::Exists($printerNamePath)) {
        throw "La configuration de l'imprimante est absente. Relancez Installer-Caisse.cmd sans utiliser 'Executer en tant qu'administrateur'."
    }
    $printerName = [System.IO.File]::ReadAllText($printerNamePath, [System.Text.Encoding]::UTF8)
    if ([string]::IsNullOrWhiteSpace($printerName)) { throw "Le nom de l'imprimante configuree est vide. Relancez Installer-Caisse.cmd." }

    $matchingPrinters = @(Get-CimInstance -ClassName Win32_Printer | Where-Object { $_.Name -eq $printerName })
    if ($matchingPrinters.Count -eq 0) { throw "L'imprimante configuree '$printerName' n'est plus installee dans Windows. Reconnectez-la ou relancez Installer-Caisse.cmd." }
    if ($matchingPrinters.Count -gt 1) { throw "Windows retourne plusieurs files nommees '$printerName'. Supprimez les doublons, puis relancez Installer-Caisse.cmd." }
    Set-AndConfirmDefaultPrinter -Printer $matchingPrinters[0]

    $chromeCandidates = @(
        Join-Path $env:ProgramFiles 'Google\Chrome\Application\chrome.exe'
        if (${env:ProgramFiles(x86)}) {
            Join-Path ${env:ProgramFiles(x86)} 'Google\Chrome\Application\chrome.exe'
        }
        Join-Path $env:LOCALAPPDATA 'Google\Chrome\Application\chrome.exe'
    ) | Where-Object { $_ -and [System.IO.File]::Exists($_) }
    $chromePath = $chromeCandidates | Select-Object -First 1
    if (-not $chromePath) { throw 'Google Chrome est introuvable. Installez Chrome, puis relancez le raccourci Caisse.' }

    [System.IO.Directory]::CreateDirectory($profileDirectory) | Out-Null
    $chromeArguments = @(
        "--user-data-dir=`"$profileDirectory`"",
        '--kiosk',
        '--kiosk-printing',
        '--no-first-run',
        "`"$caisseUrl`""
    )
    Start-Process -FilePath $chromePath -ArgumentList $chromeArguments
    exit 0
} catch {
    Show-CaisseError -Message "Impossible d'ouvrir la caisse.`n`n$($_.Exception.Message)"
    exit 1
}
