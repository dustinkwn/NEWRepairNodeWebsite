$ErrorActionPreference = 'Stop'
$root = Split-Path (Split-Path $PSScriptRoot)
$oldJson = git -C $root show 026eac4a65f5c7bae3862010cfb3a780bc30d1ad:data/pricing-catalog.json
if ($LASTEXITCODE -ne 0) { throw 'Cannot load catalog baseline from Git history' }
$old = ($oldJson -join "`n") | ConvertFrom-Json
$new = Get-Content "$root/data/pricing-catalog.json" -Raw | ConvertFrom-Json
$checks = 0
function Assert($condition, $message) {
 if (!$condition) { throw $message }
 $script:checks++
}
Assert (($old.deviceTypes.name -join ',') -eq ($new.deviceTypes.name -join ',')) 'Device types changed'
foreach ($type in $old.deviceTypes) {
 $updated = $new.deviceTypes | Where-Object name -eq $type.name
 if ($type.name -ne 'Phone') {
  Assert (($type | ConvertTo-Json -Depth 30 -Compress) -ceq ($updated | ConvertTo-Json -Depth 30 -Compress)) "$($type.name) pricing changed"
 } else {
  foreach ($make in $type.makes) {
   $after = $updated.makes | Where-Object name -eq $make.name
   if ($make.name -ne 'Apple') {
    Assert (($make | ConvertTo-Json -Depth 30 -Compress) -ceq ($after | ConvertTo-Json -Depth 30 -Compress)) "$($make.name) pricing changed"
   }
  }
 }
}
$before = ($old.deviceTypes[0].makes | Where-Object name -eq Apple).models[0].subModels
$phones = ($new.deviceTypes[0].makes | Where-Object name -eq Apple).models[0].subModels
Assert (($before.name -join ',') -ceq ($phones.name -join ',')) 'iPhone model identifiers changed'
$expectedScreens = @{
 '6'=69;'6 Plus'=69;'6s'=69;'6s Plus'=69;'7'=69;'7 Plus'=79;'8'=79;'8 Plus'=79;
 'X'=129;'Xs'=129;'Xs Max'=139;'XR'=89;'SE 2020/2022'=79;'11'=89;'11 Pro'=129;'11 Pro Max'=139;
 '12 Mini'=129;'12'=129;'12 Pro'=139;'12 Pro Max'=149;'13 Mini'=149;'13'=149;'13 Pro'=149;'13 Pro Max'=159;
 '14'=139;'14 Plus'=149;'14 Pro'=159;'14 Pro Max'=159;'15'=159;'15 Plus'=169;'15 Pro'=179;'15 Pro Max'=189;
 '16e'=149;'16'=179;'16 Plus'=189;'16 Pro'=199;'16 Pro Max'=279;'17'=229;'17e'=160;'17 Pro'=249;'17 Pro Max'=299;'Air'=379
}
$lcd = @('6','6 Plus','6s','6s Plus','7','7 Plus','8','8 Plus','XR','SE 2020/2022','11')
foreach($phone in $phones) {
 $name = $phone.name
 $screen = $phone.services | Where-Object name -eq 'Screen Repair'
 $expectedDisplay = if($lcd -contains $name){'LCD'}else{'OLED'}
 Assert ($screen.displayType -ceq $expectedDisplay) "$name display policy"
 Assert (@($phone.services | Where-Object { $_.name -match 'Screen|LCD|OLED' }).Count -eq 1) "$name has competing screen tiers"
 Assert ($screen.price -eq $expectedScreens[$name]) "$name screen price"
 Assert (!$screen.verificationRequired -and !$screen.priceLabel) "$name supplied screen price must be visible"
 $battery = $phone.services | Where-Object name -eq 'Battery Replacement'
 $port = $phone.services | Where-Object name -eq 'Charging Port Replacement'
 if($name -match '^17|^Air$') {
  Assert ($null -eq $battery.price -and $battery.verificationRequired) "$name battery must not have an invented price"
  Assert ($null -eq $port.price -and $port.verificationRequired) "$name port must not have an invented price"
 } else {
  $prices = switch -Regex ($name) {
   '^[678]|^SE' { @(69,79); break }
   '^X' { @(79,89); break }
   '^11' { @(79,99); break }
   '^12' { @(89,99); break }
   '^13' { @(89,109); break }
   '^14' { @(89,119); break }
   '^15' { @(99,119); break }
   '^16 Pro' { @(109,149); break }
   '^16' { @(99,129); break }
  }
  Assert ($battery.price -eq $prices[0]) "$name battery price"
  Assert ($port.price -eq $prices[1]) "$name port price"
 }
 $previous = $before | Where-Object name -eq $name
 foreach($service in $previous.services | Where-Object name -notin @('Screen Repair','Battery Replacement','Charging Port Replacement')) {
  $after = $phone.services | Where-Object name -eq $service.name
  Assert (($service | ConvertTo-Json -Compress) -ceq ($after | ConvertTo-Json -Compress)) "$name $($service.name) changed"
 }
}
Write-Output "PASS: $checks catalog assertions (every iPhone price/policy and all unrelated catalog data)."
