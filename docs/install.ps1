# The FreeGateway Windows installer lives at https://freegateway.co/install.ps1
# This shim keeps old `iwr ... github.io ... | iex` one-liners working.
$ErrorActionPreference = 'Stop'
Invoke-Expression (Invoke-RestMethod -UseBasicParsing https://freegateway.co/install.ps1)
