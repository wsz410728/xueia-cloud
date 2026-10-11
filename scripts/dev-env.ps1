$env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')
Write-Output ("node=" + (node --version))
Write-Output ("npm=" + (npm --version))
