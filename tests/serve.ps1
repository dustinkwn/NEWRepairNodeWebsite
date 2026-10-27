param([int]$Port = 8765)
$ErrorActionPreference = 'Stop'
$root = [IO.Path]::GetFullPath((Split-Path $PSScriptRoot))
$listener = [Net.HttpListener]::new()
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Output "Serving http://localhost:$Port/index.html"
try {
 while($listener.IsListening) {
  $context = $listener.GetContext()
  $relative = [Uri]::UnescapeDataString($context.Request.Url.AbsolutePath).TrimStart('/')
  if (!$relative) { $relative = 'index.html' }
  $path = [IO.Path]::GetFullPath((Join-Path $root $relative))
  if (Test-Path -LiteralPath $path -PathType Container) { $path = Join-Path $path 'index.html' }
  if (!$path.StartsWith($root + [IO.Path]::DirectorySeparatorChar) -or !(Test-Path -LiteralPath $path -PathType Leaf)) {
   $context.Response.StatusCode = 404
   $bytes = [Text.Encoding]::UTF8.GetBytes('Not found')
  } else {
   $context.Response.ContentType = switch([IO.Path]::GetExtension($path)) { '.js' {'text/javascript; charset=utf-8'} '.json' {'application/json'} '.css' {'text/css'} '.png' {'image/png'} default {'text/html; charset=utf-8'} }
   $bytes = [IO.File]::ReadAllBytes($path)
  }
  $context.Response.ContentLength64 = $bytes.Length
  $context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
  $context.Response.Close()
 }
} finally { $listener.Stop(); $listener.Close() }
