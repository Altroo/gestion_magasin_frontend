$ErrorActionPreference = 'Stop'

$allowedOrigin = 'https://gestion-magasin.elbouazzatiholding.ma'
$listenPort = 37821
$displayPortName = 'COM2'
$displayWidth = 20
$caisseRoot = $PSScriptRoot
$printerNamePath = Join-Path $caisseRoot 'printer-name.txt'
$profileDirectory = Join-Path $caisseRoot 'ChromeProfile'
$profileArgument = "--user-data-dir=`"$profileDirectory`""
$script:serialPort = $null
$script:lastDrawerSaleId = 0L
$script:lastDrawerOpenedAt = [datetime]::MinValue

function Close-DisplayPort {
    if ($script:serialPort) {
        try {
            if ($script:serialPort.IsOpen) { $script:serialPort.Close() }
            $script:serialPort.Dispose()
        } catch {}
        $script:serialPort = $null
    }
}

function Get-DisplayPort {
    if ($script:serialPort -and $script:serialPort.IsOpen) { return $script:serialPort }

    Close-DisplayPort
    $port = [System.IO.Ports.SerialPort]::new(
        $displayPortName,
        9600,
        [System.IO.Ports.Parity]::None,
        8,
        [System.IO.Ports.StopBits]::One
    )
    $port.Handshake = [System.IO.Ports.Handshake]::None
    $port.Encoding = [System.Text.Encoding]::ASCII
    $port.WriteTimeout = 1000
    $port.Open()
    $script:serialPort = $port
    return $port
}

function Write-CustomerTotal {
    param([Parameter(Mandatory = $true)][decimal] $Total)

    $line1 = 'TOTAL A PAYER'.PadRight($displayWidth)
    $amount = $Total.ToString('0.00', [System.Globalization.CultureInfo]::InvariantCulture) + ' DH'
    if ($amount.Length -gt $displayWidth) {
        $amount = $amount.Substring($amount.Length - $displayWidth, $displayWidth)
    }
    $line2 = $amount.PadLeft($displayWidth)
    $prefix = [byte[]](27, 64, 12)
    $payload = [System.Text.Encoding]::ASCII.GetBytes($line1 + $line2)

    for ($attempt = 0; $attempt -lt 2; $attempt += 1) {
        try {
            $port = Get-DisplayPort
            $port.Write($prefix, 0, $prefix.Length)
            $port.Write($payload, 0, $payload.Length)
            return
        } catch {
            Close-DisplayPort
            if ($attempt -eq 1) { throw }
            Start-Sleep -Milliseconds 100
        }
    }
}

function Initialize-RawPrinter {
    if ('GestionMagasin.RawPrinter' -as [type]) { return }

    Add-Type -TypeDefinition @'
using System;
using System.ComponentModel;
using System.Runtime.InteropServices;

namespace GestionMagasin
{
    public static class RawPrinter
    {
        [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
        private struct DOC_INFO_1
        {
            [MarshalAs(UnmanagedType.LPWStr)] public string pDocName;
            [MarshalAs(UnmanagedType.LPWStr)] public string pOutputFile;
            [MarshalAs(UnmanagedType.LPWStr)] public string pDatatype;
        }

        [DllImport("winspool.drv", EntryPoint = "OpenPrinterW", SetLastError = true, CharSet = CharSet.Unicode)]
        private static extern bool OpenPrinter(string printerName, out IntPtr printerHandle, IntPtr defaults);

        [DllImport("winspool.drv", SetLastError = true)]
        private static extern bool ClosePrinter(IntPtr printerHandle);

        [DllImport("winspool.drv", EntryPoint = "StartDocPrinterW", SetLastError = true, CharSet = CharSet.Unicode)]
        private static extern int StartDocPrinter(IntPtr printerHandle, int level, ref DOC_INFO_1 docInfo);

        [DllImport("winspool.drv", SetLastError = true)]
        private static extern bool EndDocPrinter(IntPtr printerHandle);

        [DllImport("winspool.drv", SetLastError = true)]
        private static extern bool StartPagePrinter(IntPtr printerHandle);

        [DllImport("winspool.drv", SetLastError = true)]
        private static extern bool EndPagePrinter(IntPtr printerHandle);

        [DllImport("winspool.drv", SetLastError = true)]
        private static extern bool WritePrinter(IntPtr printerHandle, byte[] bytes, int count, out int written);

        public static void Send(string printerName, byte[] bytes)
        {
            IntPtr printerHandle;
            if (!OpenPrinter(printerName, out printerHandle, IntPtr.Zero))
                throw new Win32Exception(Marshal.GetLastWin32Error(), "Impossible d'ouvrir l'imprimante configuree.");

            bool documentStarted = false;
            bool pageStarted = false;
            try
            {
                DOC_INFO_1 docInfo = new DOC_INFO_1 {
                    pDocName = "Ouverture tiroir-caisse",
                    pOutputFile = null,
                    pDatatype = "RAW"
                };
                if (StartDocPrinter(printerHandle, 1, ref docInfo) == 0)
                    throw new Win32Exception(Marshal.GetLastWin32Error(), "Impossible de demarrer la commande du tiroir-caisse.");
                documentStarted = true;

                if (!StartPagePrinter(printerHandle))
                    throw new Win32Exception(Marshal.GetLastWin32Error(), "Impossible de demarrer la page de commande du tiroir-caisse.");
                pageStarted = true;

                int written;
                if (!WritePrinter(printerHandle, bytes, bytes.Length, out written) || written != bytes.Length)
                    throw new Win32Exception(Marshal.GetLastWin32Error(), "La commande du tiroir-caisse n'a pas ete envoyee entierement.");
            }
            finally
            {
                if (pageStarted) EndPagePrinter(printerHandle);
                if (documentStarted) EndDocPrinter(printerHandle);
                ClosePrinter(printerHandle);
            }
        }
    }
}
'@ -Language CSharp
}

function Open-CashDrawer {
    param([Parameter(Mandatory = $true)][long] $SaleId)

    if ($SaleId -eq $script:lastDrawerSaleId) { return }
    if (-not [System.IO.File]::Exists($printerNamePath)) { throw "La configuration de l'imprimante est absente." }

    $printerName = [System.IO.File]::ReadAllText($printerNamePath, [System.Text.Encoding]::UTF8).Trim()
    if ([string]::IsNullOrWhiteSpace($printerName)) { throw "Le nom de l'imprimante configuree est vide." }

    $elapsed = [datetime]::UtcNow - $script:lastDrawerOpenedAt
    if ($elapsed.TotalMilliseconds -lt 1000) {
        Start-Sleep -Milliseconds ([int][math]::Ceiling(1000 - $elapsed.TotalMilliseconds))
    }

    Initialize-RawPrinter
    [GestionMagasin.RawPrinter]::Send($printerName, [byte[]](27, 112, 0, 50, 250))
    $script:lastDrawerSaleId = $SaleId
    $script:lastDrawerOpenedAt = [datetime]::UtcNow
}

function Get-CaisseChromeProcesses {
    @(
        Get-CimInstance -ClassName Win32_Process -Filter "Name = 'chrome.exe'" |
            Where-Object {
                $_.CommandLine -and
                $_.CommandLine.IndexOf($profileArgument, [System.StringComparison]::OrdinalIgnoreCase) -ge 0 -and
                $_.CommandLine -notmatch '(?i)(?:^|\s)--type='
            }
    )
}

function Assert-CaisseWindowAvailable {
    if ((Get-CaisseChromeProcesses).Count -eq 0) { throw 'La fenetre Caisse est introuvable.' }
}

function Minimize-CaisseWindow {
    if (-not ('GestionMagasin.WindowControl' -as [type])) {
        Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;

namespace GestionMagasin
{
    public static class WindowControl
    {
        [DllImport("user32.dll", SetLastError = true)]
        [return: MarshalAs(UnmanagedType.Bool)]
        public static extern bool ShowWindowAsync(IntPtr windowHandle, int command);
    }
}
'@ -Language CSharp
    }

    $windows = @(Get-CaisseChromeProcesses)
    if ($windows.Count -eq 0) { throw 'La fenetre Caisse est introuvable.' }
    foreach ($window in $windows) {
        $process = Get-Process -Id $window.ProcessId -ErrorAction Stop
        if ($process.MainWindowHandle -eq [IntPtr]::Zero -or -not [GestionMagasin.WindowControl]::ShowWindowAsync($process.MainWindowHandle, 6)) {
            throw "Windows n'a pas pu reduire la fenetre Caisse."
        }
    }
}

function Close-CaisseWindow {
    $windows = @(Get-CaisseChromeProcesses)
    if ($windows.Count -eq 0) { throw 'La fenetre Caisse est introuvable.' }
    foreach ($window in $windows) {
        Stop-Process -Id $window.ProcessId -Force -ErrorAction Stop
    }
}

function Write-HttpResponse {
    param(
        [Parameter(Mandatory = $true)][System.IO.Stream] $Stream,
        [Parameter(Mandatory = $true)][int] $StatusCode,
        [Parameter(Mandatory = $true)][string] $Reason,
        [string] $Origin = '',
        [string] $Body = ''
    )

    $bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($Body)
    $corsHeaders = ''
    if ($Origin -eq $allowedOrigin) {
        $corsHeaders = "Access-Control-Allow-Origin: $allowedOrigin`r`nVary: Origin`r`nAccess-Control-Allow-Methods: POST, OPTIONS`r`nAccess-Control-Allow-Headers: Content-Type`r`n"
    }
    $headers = "HTTP/1.1 $StatusCode $Reason`r`n${corsHeaders}Cache-Control: no-store`r`nConnection: close`r`nContent-Type: text/plain; charset=utf-8`r`nContent-Length: $($bodyBytes.Length)`r`n`r`n"
    $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($headers)
    $Stream.Write($headerBytes, 0, $headerBytes.Length)
    if ($bodyBytes.Length -gt 0) { $Stream.Write($bodyBytes, 0, $bodyBytes.Length) }
    $Stream.Flush()
}

$createdNew = $false
$mutex = [System.Threading.Mutex]::new($true, 'Local\GestionMagasinCustomerDisplay', [ref]$createdNew)
if (-not $createdNew) {
    $mutex.Dispose()
    exit 0
}

$listener = $null
try {
    $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $listenPort)
    $listener.Start(8)
    try { Write-CustomerTotal -Total 0 } catch {}

    while ($true) {
        $client = $listener.AcceptTcpClient()
        $reader = $null
        $windowAction = $null
        try {
            $client.NoDelay = $true
            $client.ReceiveTimeout = 2000
            $client.SendTimeout = 2000
            $stream = $client.GetStream()
            $reader = [System.IO.StreamReader]::new($stream, [System.Text.Encoding]::ASCII, $false, 1024, $true)
            $requestLine = $reader.ReadLine()
            if ([string]::IsNullOrWhiteSpace($requestLine)) {
                Write-HttpResponse -Stream $stream -StatusCode 400 -Reason 'Bad Request'
                continue
            }

            $requestParts = $requestLine.Split(' ')
            if ($requestParts.Length -lt 2) {
                Write-HttpResponse -Stream $stream -StatusCode 400 -Reason 'Bad Request'
                continue
            }

            $headers = @{}
            while ($true) {
                $line = $reader.ReadLine()
                if ($null -eq $line -or $line.Length -eq 0) { break }
                $separator = $line.IndexOf(':')
                if ($separator -gt 0) {
                    $headers[$line.Substring(0, $separator).Trim()] = $line.Substring($separator + 1).Trim()
                }
            }

            $method = $requestParts[0].ToUpperInvariant()
            $path = $requestParts[1]
            $origin = [string]$headers['Origin']
            if ($origin -ne $allowedOrigin) {
                Write-HttpResponse -Stream $stream -StatusCode 403 -Reason 'Forbidden'
                continue
            }
            if ($path -notin @('/display', '/drawer', '/window/minimize', '/window/close')) {
                Write-HttpResponse -Stream $stream -StatusCode 404 -Reason 'Not Found' -Origin $origin
                continue
            }
            if ($method -eq 'OPTIONS') {
                Write-HttpResponse -Stream $stream -StatusCode 204 -Reason 'No Content' -Origin $origin
                continue
            }
            if ($method -ne 'POST') {
                Write-HttpResponse -Stream $stream -StatusCode 405 -Reason 'Method Not Allowed' -Origin $origin
                continue
            }

            $contentLength = 0
            if (-not [int]::TryParse([string]$headers['Content-Length'], [ref]$contentLength) -or $contentLength -lt 1 -or $contentLength -gt 32) {
                Write-HttpResponse -Stream $stream -StatusCode 400 -Reason 'Bad Request' -Origin $origin
                continue
            }

            $bodyBuffer = New-Object char[] $contentLength
            $bodyLength = 0
            while ($bodyLength -lt $contentLength) {
                $read = $reader.Read($bodyBuffer, $bodyLength, $contentLength - $bodyLength)
                if ($read -le 0) { break }
                $bodyLength += $read
            }
            $body = if ($bodyLength -gt 0) { -join $bodyBuffer[0..($bodyLength - 1)] } else { '' }
            if ($bodyLength -ne $contentLength) {
                Write-HttpResponse -Stream $stream -StatusCode 400 -Reason 'Bad Request' -Origin $origin
                continue
            }

            switch ($path) {
                '/display' {
                    if ($body -notmatch '^\d{1,14}\.\d{2}$') {
                        Write-HttpResponse -Stream $stream -StatusCode 400 -Reason 'Bad Request' -Origin $origin
                        continue
                    }
                    $total = [decimal]::Zero
                    $parsed = [decimal]::TryParse(
                        $body,
                        [System.Globalization.NumberStyles]::AllowDecimalPoint,
                        [System.Globalization.CultureInfo]::InvariantCulture,
                        [ref]$total
                    )
                    if (-not $parsed -or $total -lt 0 -or $total -gt [decimal]99999999999999.99) {
                        Write-HttpResponse -Stream $stream -StatusCode 422 -Reason 'Unprocessable Content' -Origin $origin
                        continue
                    }
                    try {
                        Write-CustomerTotal -Total $total
                        Write-HttpResponse -Stream $stream -StatusCode 204 -Reason 'No Content' -Origin $origin
                    } catch {
                        Write-HttpResponse -Stream $stream -StatusCode 503 -Reason 'Display Unavailable' -Origin $origin
                    }
                }
                '/drawer' {
                    if ($body -notmatch '^\d{1,18}$') {
                        Write-HttpResponse -Stream $stream -StatusCode 400 -Reason 'Bad Request' -Origin $origin
                        continue
                    }
                    $saleId = 0L
                    if (-not [long]::TryParse($body, [ref]$saleId) -or $saleId -le 0) {
                        Write-HttpResponse -Stream $stream -StatusCode 422 -Reason 'Unprocessable Content' -Origin $origin
                        continue
                    }
                    try {
                        Open-CashDrawer -SaleId $saleId
                        Write-HttpResponse -Stream $stream -StatusCode 204 -Reason 'No Content' -Origin $origin
                    } catch {
                        Write-HttpResponse -Stream $stream -StatusCode 503 -Reason 'Drawer Unavailable' -Origin $origin
                    }
                }
                '/window/minimize' {
                    if ($body -ne 'minimize') {
                        Write-HttpResponse -Stream $stream -StatusCode 400 -Reason 'Bad Request' -Origin $origin
                        continue
                    }
                    try {
                        Assert-CaisseWindowAvailable
                        Write-HttpResponse -Stream $stream -StatusCode 204 -Reason 'No Content' -Origin $origin
                        $windowAction = 'minimize'
                    } catch {
                        Write-HttpResponse -Stream $stream -StatusCode 503 -Reason 'Window Unavailable' -Origin $origin
                    }
                }
                '/window/close' {
                    if ($body -ne 'close') {
                        Write-HttpResponse -Stream $stream -StatusCode 400 -Reason 'Bad Request' -Origin $origin
                        continue
                    }
                    try {
                        Assert-CaisseWindowAvailable
                        Write-HttpResponse -Stream $stream -StatusCode 204 -Reason 'No Content' -Origin $origin
                        $windowAction = 'close'
                    } catch {
                        Write-HttpResponse -Stream $stream -StatusCode 503 -Reason 'Window Unavailable' -Origin $origin
                    }
                }
            }
        } catch {
            try { Write-HttpResponse -Stream $client.GetStream() -StatusCode 400 -Reason 'Bad Request' } catch {}
        } finally {
            if ($reader) { $reader.Dispose() }
            $client.Dispose()
        }
        if ($windowAction) {
            Start-Sleep -Milliseconds 100
            try {
                if ($windowAction -eq 'minimize') { Minimize-CaisseWindow }
                if ($windowAction -eq 'close') { Close-CaisseWindow }
            } catch {}
        }
    }
} finally {
    if ($listener) { $listener.Stop() }
    Close-DisplayPort
    try { $mutex.ReleaseMutex() } catch {}
    $mutex.Dispose()
}
