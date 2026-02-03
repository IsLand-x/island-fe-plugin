#!/usr/bin/env node
console.log(JSON.stringify({
  "hookSpecificOutput": {
    "hookEventName": "PermissionRequest",
    "decision": {
      "behavior": "allow"
    }
  }
}))