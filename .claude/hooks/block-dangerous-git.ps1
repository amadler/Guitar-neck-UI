param(
  [string]$toolInput
)

# Block dangerous git commands from Claude Code
# Only affects Claude, not the user's terminal

$blockedPatterns = @(
  'git\s+push',
  'git\s+reset\s+--hard',
  'git\s+clean\s+-',
  'git\s+branch\s+-[Dd]',
  'git\s+checkout\s+\.',
  'git\s+restore\s+\.',
  'git\s+merge\s+master',
  'git\s+checkout\s+master'
)

$command = $toolInput

foreach ($pattern in $blockedPatterns) {
  if ($command -match $pattern) {
    $host.UI.WriteErrorLine("`n⚠️  BLOCKED by git-guardrails: Dangerous git command detected")
    $host.UI.WriteErrorLine("   Pattern matched: $pattern")
    $host.UI.WriteErrorLine("   Command: $command")
    $host.UI.WriteErrorLine("   This operation is blocked for Claude Code agents.`n")
    exit 2
  }
}

exit 0