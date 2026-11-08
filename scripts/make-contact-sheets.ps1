Add-Type -AssemblyName System.Drawing

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$productsPath = Join-Path $repoRoot "assets\data\products.json"
$outputDirectory = Join-Path $repoRoot "artifacts\contact-sheets"
$products = Get-Content -Raw -LiteralPath $productsPath | ConvertFrom-Json
New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null

$background = [System.Drawing.ColorTranslator]::FromHtml("#101010")
$green = [System.Drawing.ColorTranslator]::FromHtml("#63E68A")
$white = [System.Drawing.Color]::White
$titleFont = New-Object System.Drawing.Font("Segoe UI", 14, [System.Drawing.FontStyle]::Bold)
$labelFont = New-Object System.Drawing.Font("Segoe UI", 9, [System.Drawing.FontStyle]::Regular)
$idFont = New-Object System.Drawing.Font("Consolas", 8, [System.Drawing.FontStyle]::Bold)
$titleBrush = New-Object System.Drawing.SolidBrush($green)
$whiteBrush = New-Object System.Drawing.SolidBrush($white)
$greenBrush = New-Object System.Drawing.SolidBrush($green)
$whiteBackground = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)

try {
  foreach ($category in ($products.category | Sort-Object -Unique)) {
    $items = @($products | Where-Object { $_.category -eq $category })
    $bitmap = New-Object System.Drawing.Bitmap(1500, 1260)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    try {
      $graphics.Clear($background)
      $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
      $graphics.DrawString("$category - $($items.Count) products", $titleFont, $titleBrush, 20, 16)

      for ($index = 0; $index -lt $items.Count; $index++) {
        $product = $items[$index]
        $column = $index % 5
        $row = [Math]::Floor($index / 5)
        $x = 20 + ($column * 296)
        $y = 52 + ($row * 200)
        $graphics.FillRectangle($whiteBackground, $x, $y, 276, 144)

        $imagePath = Join-Path $repoRoot ($product.image -replace "/", "\")
        try {
          $source = [System.Drawing.Image]::FromFile($imagePath)
          try {
            $scale = [Math]::Min(270 / $source.Width, 138 / $source.Height)
            $width = [Math]::Max(1, [int]($source.Width * $scale))
            $height = [Math]::Max(1, [int]($source.Height * $scale))
            $drawX = $x + [int]((276 - $width) / 2)
            $drawY = $y + [int]((144 - $height) / 2)
            $graphics.DrawImage($source, $drawX, $drawY, $width, $height)
          } finally {
            $source.Dispose()
          }
        } catch {
          $graphics.DrawString("IMAGE ERROR", $titleFont, $greenBrush, $x + 70, $y + 58)
        }

        $graphics.DrawString($product.id, $idFont, $greenBrush, $x, $y + 149)
        $nameRectangle = [System.Drawing.RectangleF]::new([single]($x + 62), [single]($y + 147), 214, 42)
        $graphics.DrawString($product.name, $labelFont, $whiteBrush, $nameRectangle)
      }

      $safeName = $category.ToLowerInvariant().Replace(" ", "-")
      $outputPath = Join-Path $outputDirectory "$safeName.jpg"
      $bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Jpeg)
    } finally {
      $graphics.Dispose()
      $bitmap.Dispose()
    }
  }
} finally {
  $titleFont.Dispose()
  $labelFont.Dispose()
  $idFont.Dispose()
  $titleBrush.Dispose()
  $whiteBrush.Dispose()
  $greenBrush.Dispose()
  $whiteBackground.Dispose()
}

Write-Output "Created $((Get-ChildItem -LiteralPath $outputDirectory -Filter '*.jpg').Count) contact sheets in $outputDirectory"
