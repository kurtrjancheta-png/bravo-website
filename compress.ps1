Add-Type -AssemblyName System.Drawing
$files = Get-ChildItem -Path "C:\Users\kurtr\Downloads\BRAVO WEBSITE\public\cadets" -Recurse -File -Include *.jpg,*.png
foreach ($file in $files) {
    try {
        $img = [System.Drawing.Image]::FromFile($file.FullName)
        
        # Calculate new size (max width/height 400)
        $ratio = [math]::Min(400 / $img.Width, 400 / $img.Height)
        if ($ratio -ge 1) {
            $img.Dispose()
            continue # Already small enough
        }
        
        $newWidth = [int]($img.Width * $ratio)
        $newHeight = [int]($img.Height * $ratio)
        
        $newImg = New-Object System.Drawing.Bitmap($newWidth, $newHeight)
        $graph = [System.Drawing.Graphics]::FromImage($newImg)
        $graph.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graph.DrawImage($img, 0, 0, $newWidth, $newHeight)
        
        $graph.Dispose()
        $img.Dispose()
        
        # Save over original
        $newImg.Save($file.FullName, [System.Drawing.Imaging.ImageFormat]::Jpeg)
        $newImg.Dispose()
        
        Write-Host "Compressed: $($file.Name)"
    } catch {
        Write-Host "Failed to compress: $($file.Name)"
    }
}
