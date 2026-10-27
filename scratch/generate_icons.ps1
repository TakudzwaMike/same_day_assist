Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\takud\.gemini\antigravity-ide\brain\697c757f-2d7b-40c7-a1b0-5dbb26c88d7b\.user_uploaded\media_1793117927558.png"
if (-not (Test-Path $srcPath)) {
    Write-Error "Source image not found at $srcPath"
    exit 1
}

$srcImg = [System.Drawing.Image]::FromFile($srcPath)
Write-Host "Source image loaded: $($srcImg.Width)x$($srcImg.Height)"

function Create-ResizedImage {
    param (
        [System.Drawing.Image]$source,
        [int]$targetWidth,
        [int]$targetHeight,
        [string]$outputPath,
        [double]$scaleFactor = 1.0,
        [bool]$makeCircular = $false,
        [string]$bgColorName = "Transparent"
    )

    $destBmp = New-Object System.Drawing.Bitmap($targetWidth, $targetHeight, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($destBmp)
    
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

    if ($bgColorName -eq "White") {
        $g.Clear([System.Drawing.Color]::White)
    } else {
        $g.Clear([System.Drawing.Color]::FromArgb(0, 0, 0, 0))
    }

    if ($makeCircular) {
        $path = New-Object System.Drawing.Drawing2D.GraphicsPath
        $path.AddEllipse(0, 0, $targetWidth, $targetHeight)
        $g.SetClip($path)
    }

    # Calculate centered destination rect
    $w = [int]($targetWidth * $scaleFactor)
    $h = [int]($targetHeight * $scaleFactor)
    $x = [int](($targetWidth - $w) / 2)
    $y = [int](($targetHeight - $h) / 2)

    $destRect = New-Object System.Drawing.Rectangle($x, $y, $w, $h)
    $srcRect = New-Object System.Drawing.Rectangle(0, 0, $source.Width, $source.Height)

    $g.DrawImage($source, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)

    $g.Dispose()
    
    $dir = Split-Path $outputPath -Parent
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }

    $destBmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $destBmp.Dispose()
    Write-Host "Created: $outputPath ($($targetWidth)x$($targetHeight))"
}

$workspace = "c:\Users\takud\OneDrive\Desktop\same-day-assist"

# 1. Web Logo & Favicon
Create-ResizedImage $srcImg 512 512 "$workspace\public\logo.png" 0.95 $false "Transparent"
Create-ResizedImage $srcImg 192 192 "$workspace\public\favicon.png" 0.95 $false "Transparent"

# 2. iOS AppIcon
Create-ResizedImage $srcImg 1024 1024 "$workspace\ios\App\App\Assets.xcassets\AppIcon.appiconset\AppIcon-512@2x.png" 0.90 $false "White"

# 3. Android mipmap densities
$densities = @(
    @{ Name = "mipmap-mdpi"; LegacySize = 48; ForegroundSize = 108 },
    @{ Name = "mipmap-hdpi"; LegacySize = 72; ForegroundSize = 162 },
    @{ Name = "mipmap-xhdpi"; LegacySize = 96; ForegroundSize = 216 },
    @{ Name = "mipmap-xxhdpi"; LegacySize = 144; ForegroundSize = 324 },
    @{ Name = "mipmap-xxxhdpi"; LegacySize = 192; ForegroundSize = 432 }
)

foreach ($d in $densities) {
    $dir = "$workspace\android\app\src\main\res\$($d.Name)"
    
    # Adaptive Foreground (centered in safe zone, transparent background, ~72% scale for perfect padding inside circle)
    Create-ResizedImage $srcImg $d.ForegroundSize $d.ForegroundSize "$dir\ic_launcher_foreground.png" 0.72 $false "Transparent"
    
    # Legacy Square Icon (with white background, filled nicely)
    Create-ResizedImage $srcImg $d.LegacySize $d.LegacySize "$dir\ic_launcher.png" 0.88 $false "White"
    
    # Legacy Round Icon (circular clip, white background)
    Create-ResizedImage $srcImg $d.LegacySize $d.LegacySize "$dir\ic_launcher_round.png" 0.88 $true "White"
}

$srcImg.Dispose()
Write-Host "All icons generated successfully!"
