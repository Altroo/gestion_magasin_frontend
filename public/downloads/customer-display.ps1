$ErrorActionPreference = 'Stop'

$allowedOrigin = 'https://gestion-magasin.elbouazzatiholding.ma'
$listenPort = 37821
$displayPortName = 'COM2'
$displayWidth = 20
$script:serialPort = $null

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
            if ($path -ne '/display') {
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
            if ($bodyLength -ne $contentLength -or $body -notmatch '^\d{1,14}\.\d{2}$') {
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
        } catch {
            try { Write-HttpResponse -Stream $client.GetStream() -StatusCode 400 -Reason 'Bad Request' } catch {}
        } finally {
            if ($reader) { $reader.Dispose() }
            $client.Dispose()
        }
    }
} finally {
    if ($listener) { $listener.Stop() }
    Close-DisplayPort
    try { $mutex.ReleaseMutex() } catch {}
    $mutex.Dispose()
}
