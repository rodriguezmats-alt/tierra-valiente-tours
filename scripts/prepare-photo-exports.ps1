param(
  [switch]$WhatIf
)

$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName PresentationCore

$projectRoot = Split-Path -Parent $PSScriptRoot
$sourceRoot = Join-Path $projectRoot 'assets\propias'
$galleryRoot = Join-Path $projectRoot 'assets\optimized\gallery'
$ownExportsRoot = Join-Path $projectRoot 'assets\optimized\propias'
$websiteUrl = 'https://fantastic-buttercream-902394.netlify.app/'
$copyrightNotice = "Copyright Tierra Valiente Tours | $websiteUrl"

function Get-PhotoSlug([string]$Name) {
  $normalized = $Name.Normalize([System.Text.NormalizationForm]::FormD)
  $withoutMarks = [regex]::Replace($normalized, '\p{Mn}', '')
  return ([regex]::Replace($withoutMarks.ToLowerInvariant(), '[^a-z0-9]+', '-')).Trim('-')
}

function Get-PhotoSources {
  return @(Get-ChildItem $sourceRoot -File | Where-Object { $_.Extension -match '^\.(jpe?g|png|webp)$' })
}

function Resolve-OriginalPhoto([System.IO.FileInfo[]]$Sources, [string]$ExportName, [hashtable]$Overrides) {
  if ($Overrides.ContainsKey($ExportName)) {
    $sourcePath = Join-Path $sourceRoot $Overrides[$ExportName]
    if (-not (Test-Path -LiteralPath $sourcePath -PathType Leaf)) {
      throw "No se encontró la fotografía original para '$ExportName': $sourcePath"
    }
    return Get-Item -LiteralPath $sourcePath
  }

  $exportSlug = Get-PhotoSlug ([System.IO.Path]::GetFileNameWithoutExtension($ExportName) -replace '^\d{3}-', '')
  $matches = @($Sources | Where-Object {
    (Get-PhotoSlug ([System.IO.Path]::GetFileNameWithoutExtension($_.Name))) -eq $exportSlug
  })

  if ($matches.Count -ne 1) {
    throw "Se esperaba una fuente original inequívoca para '$ExportName'; se encontraron $($matches.Count)."
  }

  return $matches[0]
}

function Get-JpegSourceBitmap([System.IO.FileInfo]$Source) {
  if ($Source.Extension -ine '.webp') {
    return [System.Drawing.Bitmap]::new($Source.FullName)
  }

  $fileStream = [System.IO.File]::OpenRead($Source.FullName)
  try {
    $decoder = [System.Windows.Media.Imaging.BitmapDecoder]::Create(
      $fileStream,
      [System.Windows.Media.Imaging.BitmapCreateOptions]::PreservePixelFormat,
      [System.Windows.Media.Imaging.BitmapCacheOption]::OnLoad
    )
    $pngEncoder = [System.Windows.Media.Imaging.PngBitmapEncoder]::new()
    $pngEncoder.Frames.Add($decoder.Frames[0])
    $pngStream = [System.IO.MemoryStream]::new()
    try {
      $pngEncoder.Save($pngStream)
      $pngStream.Position = 0
      $decodedImage = [System.Drawing.Bitmap]::new($pngStream)
      try {
        return [System.Drawing.Bitmap]::new($decodedImage)
      }
      finally {
        $decodedImage.Dispose()
      }
    }
    finally {
      $pngStream.Dispose()
    }
  }
  finally {
    $fileStream.Dispose()
  }
}

function Set-ExifAscii([System.Drawing.Bitmap]$Bitmap, [int]$Id, [string]$Value) {
  $property = [System.Runtime.Serialization.FormatterServices]::GetUninitializedObject(
    [System.Drawing.Imaging.PropertyItem]
  )
  $bytes = [System.Text.Encoding]::ASCII.GetBytes("$Value`0")
  $property.Id = $Id
  $property.Type = 2
  $property.Value = $bytes
  $property.Len = $bytes.Length
  $Bitmap.SetPropertyItem($property)
}

function Set-PhotoCopyright([System.Drawing.Bitmap]$Bitmap) {
  Set-ExifAscii $Bitmap 0x8298 $copyrightNotice
  Set-ExifAscii $Bitmap 0x013B 'Tierra Valiente Tours'
  Set-ExifAscii $Bitmap 0x010E "Photo by Tierra Valiente Tours. Website: $websiteUrl"
}

function Add-SubtleWatermark([System.Drawing.Bitmap]$Bitmap) {
  $graphics = [System.Drawing.Graphics]::FromImage($Bitmap)
  $fontSize = [Math]::Max(10, [Math]::Min(22, [Math]::Min($Bitmap.Width, $Bitmap.Height) * 0.014))
  $font = [System.Drawing.Font]::new(
    'Arial',
    [single]$fontSize,
    [System.Drawing.FontStyle]::Bold,
    [System.Drawing.GraphicsUnit]::Pixel
  )
  $background = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(145, 4, 18, 15))
  $foreground = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(225, 255, 255, 255))
  $accent = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(155, 142, 228, 213), [single]1)
  $dot = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(225, 142, 228, 213))

  try {
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
    $text = 'TIERRA VALIENTE'
    $textSize = $graphics.MeasureString($text, $font)
    $padding = [single][Math]::Max(5, $fontSize * 0.48)
    $dotSize = [single][Math]::Max(3, $fontSize * 0.3)
    $boxWidth = [single]($textSize.Width + ($padding * 3) + $dotSize)
    $boxHeight = [single]($textSize.Height + ($padding * 2))
    $margin = [single][Math]::Max(10, [Math]::Min($Bitmap.Width, $Bitmap.Height) * 0.014)
    $x = [single]($Bitmap.Width - $boxWidth - $margin)
    $y = [single]($Bitmap.Height - $boxHeight - $margin)
    $box = [System.Drawing.RectangleF]::new($x, $y, $boxWidth, $boxHeight)

    $graphics.FillRectangle($background, $box)
    $graphics.DrawRectangle($accent, $x, $y, $boxWidth, $boxHeight)
    $graphics.FillEllipse(
      $dot,
      $x + $padding,
      $y + (($boxHeight - $dotSize) / 2),
      $dotSize,
      $dotSize
    )
    $graphics.DrawString(
      $text,
      $font,
      $foreground,
      $x + ($padding * 2) + $dotSize,
      $y + $padding
    )
  }
  finally {
    $dot.Dispose()
    $accent.Dispose()
    $foreground.Dispose()
    $background.Dispose()
    $font.Dispose()
    $graphics.Dispose()
  }
}

function Export-BrandedPhoto([System.IO.FileInfo]$Source, [System.IO.FileInfo]$Target) {
  $image = Get-JpegSourceBitmap $Source
  $temporaryPath = "$($Target.FullName).$PID.tmp.jpg"
  $output = $null
  $graphics = $null
  $encoderParameters = $null

  try {
    $orientation = 0
    if ($image.PropertyIdList -contains 0x0112) {
      $orientation = $image.GetPropertyItem(0x0112).Value[0]
    }
    switch ($orientation) {
      2 { $image.RotateFlip([System.Drawing.RotateFlipType]::RotateNoneFlipX) }
      3 { $image.RotateFlip([System.Drawing.RotateFlipType]::Rotate180FlipNone) }
      4 { $image.RotateFlip([System.Drawing.RotateFlipType]::Rotate180FlipX) }
      5 { $image.RotateFlip([System.Drawing.RotateFlipType]::Rotate90FlipX) }
      6 { $image.RotateFlip([System.Drawing.RotateFlipType]::Rotate90FlipNone) }
      7 { $image.RotateFlip([System.Drawing.RotateFlipType]::Rotate270FlipX) }
      8 { $image.RotateFlip([System.Drawing.RotateFlipType]::Rotate270FlipNone) }
    }

    $scale = [Math]::Min([double]1, [double]1600 / [double][Math]::Max($image.Width, $image.Height))
    $width = [int][Math]::Max(1, [Math]::Round($image.Width * $scale))
    $height = [int][Math]::Max(1, [Math]::Round($image.Height * $scale))
    $output = [System.Drawing.Bitmap]::new(
      $width,
      $height,
      [System.Drawing.Imaging.PixelFormat]::Format24bppRgb
    )
    $graphics = [System.Drawing.Graphics]::FromImage($output)
    $graphics.Clear([System.Drawing.Color]::White)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.DrawImage($image, 0, 0, $width, $height)
    $graphics.Dispose()
    $graphics = $null

    Add-SubtleWatermark $output
    Set-PhotoCopyright $output

    $jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
      Where-Object { $_.MimeType -eq 'image/jpeg' } |
      Select-Object -First 1
    $encoderParameters = [System.Drawing.Imaging.EncoderParameters]::new(1)
    $encoderParameters.Param[0] = [System.Drawing.Imaging.EncoderParameter]::new(
      [System.Drawing.Imaging.Encoder]::Quality,
      [long]88
    )
    $output.Save($temporaryPath, $jpegCodec, $encoderParameters)

    $verification = [System.Drawing.Bitmap]::new($temporaryPath)
    try {
      if ($verification.Width -ne $width -or $verification.Height -ne $height) {
        throw "Las dimensiones exportadas de '$($Target.Name)' no coinciden con las calculadas."
      }
      $savedCopyright = [System.Text.Encoding]::ASCII.GetString(
        $verification.GetPropertyItem(0x8298).Value
      ).TrimEnd([char]0)
      if ($savedCopyright -ne $copyrightNotice) {
        throw "No se pudo verificar la autoría incrustada en '$($Target.Name)'."
      }
    }
    finally {
      $verification.Dispose()
    }

    Move-Item -LiteralPath $temporaryPath -Destination $Target.FullName -Force
  }
  finally {
    if ($null -ne $encoderParameters) {
      $encoderParameters.Dispose()
    }
    if ($null -ne $graphics) {
      $graphics.Dispose()
    }
    if ($null -ne $output) {
      $output.Dispose()
    }
    $image.Dispose()
    if (Test-Path -LiteralPath $temporaryPath) {
      Remove-Item -LiteralPath $temporaryPath
    }
  }
}

$sources = Get-PhotoSources
$overrides = @{
  '009-alimentaci-n-de-la-cultura-maya.jpg' = ('ALIMENTACI' + [char]0x00D3 + 'N-DE-LA-CULTURA-MAYA.jpg')
  '029-cacao.jpg' = 'cacao.JPG'
  '031-cacao.jpg' = 'CACAO.webp'
  '081-mirador-sanjuan.jpg' = 'mirador_sanjuan.jpeg'
  '082-mirador-sanjuan.jpg' = 'mirador_sanjuan.JPG'
  '083-monta-as-rostro.jpg' = ('monta' + [char]0x00F1 + 'as_rostro.jpeg')
  '098-postal.jpg' = 'postal.jpeg'
  '099-postal.jpg' = 'postal.JPG'
}
$externalGalleryImages = @(
  '001-lago-atitlan.jpg',
  '002-antigua-guatemala.jpg',
  '003-rio-dulce.jpg',
  '004-semuc-champey.jpg',
  '005-tikal-ancestral.jpg',
  '006-volcan-acatenango.jpg',
  '155-tikal-templo.jpg'
)

$targets = @()
foreach ($target in Get-ChildItem $galleryRoot -File -Filter '*.jpg') {
  if ($externalGalleryImages -contains $target.Name) {
    continue
  }
  $targets += [pscustomobject]@{
    Target = $target
    Source = Resolve-OriginalPhoto $sources $target.Name $overrides
  }
}

foreach ($target in Get-ChildItem $ownExportsRoot -File -Filter '*.jpg') {
  if ($target.BaseName -eq 'tierra_valiente.png') {
    continue
  }
  $targets += [pscustomobject]@{
    Target = $target
    Source = Resolve-OriginalPhoto $sources $target.Name @{}
  }
}

if ($WhatIf) {
  $targets | ForEach-Object { '{0} <= {1}' -f $_.Target.FullName, $_.Source.FullName }
  Write-Output "Se prepararían $($targets.Count) fotografías propias; los originales y las fotos externas no se modificarán."
  return
}

foreach ($target in $targets) {
  Export-BrandedPhoto $target.Source $target.Target
  Write-Output "Fotografía preparada: $($target.Target.Name)"
}

Write-Output "Se prepararon $($targets.Count) fotografías propias con una marca discreta y metadatos de autoría."
