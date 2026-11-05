$ErrorActionPreference = "Continue"
$edge = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$root = "C:\Users\freda\Documents\deepseek-harness\default-workspace\seen-app"
$out = Join-Path $root ".screenshots"
New-Item -ItemType Directory -Force -Path $out | Out-Null
$profile = Join-Path $out "profile"
$base = "http://localhost:3100"

$pages = @(
  @{ name = "01-home";        url = "$base/";                                          h = 2600 },
  @{ name = "02-discover";    url = "$base/discover?corridor=osu&category=food";        h = 2000 },
  @{ name = "03-business";    url = "$base/business/kente-and-koffee-osu";              h = 2400 },
  @{ name = "04-pricing";     url = "$base/pricing";                                    h = 2400 },
  @{ name = "05-signin";      url = "$base/signin";                                     h = 1400 },
  @{ name = "06-merchant";    url = "$base/api/auth/demo?as=merchant&next=/merchant";   h = 2200 },
  @{ name = "07-billing";     url = "$base/api/auth/demo?as=merchant&next=/merchant/billing"; h = 1800 },
  @{ name = "08-admin";       url = "$base/api/auth/demo?as=admin&next=/admin";         h = 2200 },
  @{ name = "09-mini";        url = "$base/mini";                                       h = 1800 },
  @{ name = "10-quickbook";   url = "$base/api/auth/demo?as=consumer&next=/mini/quickbook"; h = 1800 },
  @{ name = "11-onboarding";  url = "$base/onboarding";                                 h = 1600 }
)

foreach ($page in $pages) {
  $file = Join-Path $out ($page.name + ".png")
  $args = @(
    "--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-first-run",
    "--user-data-dir=$profile",
    "--window-size=1440,$($page.h)",
    "--virtual-time-budget=9000",
    "--screenshot=$file",
    $page.url
  )
  & $edge @args 2>$null | Out-Null
  if (Test-Path $file) {
    $size = [math]::Round((Get-Item $file).Length / 1KB)
    "OK   $($page.name)  ${size}KB"
  } else {
    "MISS $($page.name)"
  }
}
