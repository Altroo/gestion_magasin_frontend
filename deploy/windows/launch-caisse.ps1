$ErrorActionPreference = 'Stop'

$caisseUrl = 'https://gestion-magasin.elbouazzatiholding.ma/dashboard/caise'
$printerPattern = 'WDLink|WD8260|POSPrinter|POS[- ]?80'

function Show-SetupError([string] $message) {
    Add-Type -AssemblyName PresentationFramework
    [System.Windows.MessageBox]::Show(
        $message,
        'Caisse - Printer setup required',
        [System.Windows.MessageBoxButton]::OK,
        [System.Windows.MessageBoxImage]::Error
    ) | Out-Null
}

try {
    $printer = Get-CimInstance Win32_Printer |
        Where-Object { $_.Name -match $printerPattern -or $_.DriverName -match $printerPattern } |
        Select-Object -First 1

    if (-not $printer) {
        Show-SetupError 'Install the POSPrinter WDLink WD8260 driver, then add the POS-80 under Windows Printers & scanners.'
        exit 2
    }
    Invoke-CimMethod -InputObject $printer -MethodName SetDefaultPrinter | Out-Null

    $chromeCandidates = @(
        "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
        "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
        "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
    )
    $chromePath = $chromeCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
    if (-not $chromePath) {
        Show-SetupError 'Google Chrome is not installed.'
        exit 3
    }

    $profileDirectory = Join-Path $env:LOCALAPPDATA 'GestionMagasinPOS\ChromeProfile'
    Start-Process -FilePath $chromePath -ArgumentList @(
        "--user-data-dir=`"$profileDirectory`"",
        '--kiosk',
        '--kiosk-printing',
        '--no-first-run',
        $caisseUrl
    )
} catch {
    Show-SetupError "The caisse could not start: $($_.Exception.Message)"
    exit 1
}
