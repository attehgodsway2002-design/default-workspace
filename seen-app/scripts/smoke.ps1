$ErrorActionPreference = "Continue"
$base = "http://localhost:3100"

function Check($path, $marker, $session) {
  try {
    if ($session) {
      $r = Invoke-WebRequest -Uri "$base$path" -UseBasicParsing -WebSession $session -TimeoutSec 120
    } else {
      $r = Invoke-WebRequest -Uri "$base$path" -UseBasicParsing -TimeoutSec 120
    }
    $ok = $r.Content -match $marker
    $len = $r.Content.Length
    if ($ok) { "PASS  $path  ($len bytes)" } else { "FAIL  $path  marker '$marker' not found ($len bytes)" }
  } catch {
    "ERROR $path  $($_.Exception.Message)"
  }
}

"=== public ==="
Check "/discover" "verified"
Check "/discover?corridor=east-legon&category=food" "East Legon"
Check "/business/kente-and-koffee-osu" "Kente"
Check "/pricing" "GH₵249"
Check "/pricing" "Billboard"
Check "/mini" "QuickBook"
Check "/signin" "Sign in"
Check "/onboarding" "Get verified"

"=== consumer session ==="
$consumer = New-Object Microsoft.PowerShell.Commands.WebRequestSession
Invoke-WebRequest -Uri "$base/api/auth/demo?as=consumer&next=/discover" -UseBasicParsing -WebSession $consumer -MaximumRedirection 5 -TimeoutSec 120 | Out-Null
Check "/mini/quickbook" "QuickBook" $consumer
Check "/mini/accra-live" "Accra Live" $consumer

"=== merchant session ==="
$merchant = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$login = Invoke-WebRequest -Uri "$base/api/auth/demo?as=merchant&next=/merchant" -UseBasicParsing -WebSession $merchant -MaximumRedirection 5 -TimeoutSec 120
"MERCHANT LANDED: $($login.StatusCode) $($login.BaseResponse.RequestMessage.RequestUri)"
Check "/merchant" "Performance" $merchant
Check "/merchant?range=7" "Impressions" $merchant
Check "/merchant/billing" "Billing" $merchant
Check "/merchant/storefront" "Storefront" $merchant

"=== admin session ==="
$admin = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$adminLogin = Invoke-WebRequest -Uri "$base/api/auth/demo?as=admin&next=/admin" -UseBasicParsing -WebSession $admin -MaximumRedirection 5 -TimeoutSec 120
"ADMIN LANDED: $($adminLogin.StatusCode) $($adminLogin.BaseResponse.RequestMessage.RequestUri)"
Check "/admin" "MRR" $admin
Check "/admin/merchants" "Merchant" $admin
Check "/admin/slots" "Billboard" $admin
Check "/admin/partners" "QuickBook" $admin

"=== api ==="
try {
  $body = @{ merchantId = "m-kente-and-koffee-osu"; type = "view"; source = "direct" } | ConvertTo-Json
  $t = Invoke-WebRequest -Uri "$base/api/track" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing -TimeoutSec 60
  "PASS  /api/track  $($t.StatusCode)  $($t.Content)"
} catch { "ERROR /api/track  $($_.Exception.Message)" }
