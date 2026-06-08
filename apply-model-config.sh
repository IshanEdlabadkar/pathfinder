#!/bin/bash
# Run this from anywhere — it clones, patches, commits, and pushes.
set -e

REPO_DIR=$(mktemp -d)/pathfinder
git clone https://github.com/IshanEdlabadkar/pathfinder.git "$REPO_DIR"
cd "$REPO_DIR"

# 1. Create the centralized model config
cat > src/lib/models.ts << 'EOF'
// src/lib/models.ts
// Central model configuration — change the model here to update it everywhere.

export const DEFAULT_MODEL = "nvidia/nemotron-3-super-120b-a12b:free";
EOF

# 2. Update src/agents/noteParser/parse.ts
sed -i 's/^const MODEL = "nvidia\/nemotron-3-super-120b-a12b:free";$/import { DEFAULT_MODEL } from "@\/lib\/models";/' src/agents/noteParser/parse.ts
sed -i 's/model: MODEL,/model: DEFAULT_MODEL,/' src/agents/noteParser/parse.ts

# 3. Update src/agents/briefing/generate.ts
sed -i 's/^const MODEL = "nvidia\/nemotron-3-super-120b-a12b:free";$/import { DEFAULT_MODEL } from "@\/lib\/models";/' src/agents/briefing/generate.ts
sed -i 's/model: MODEL,/model: DEFAULT_MODEL,/' src/agents/briefing/generate.ts

# 4. Update src/lib/schoolEnricher.ts
sed -i '3a import { DEFAULT_MODEL } from "@/lib/models";' src/lib/schoolEnricher.ts
sed -i 's/model: "nvidia\/nemotron-3-super-120b-a12b:free",/model: DEFAULT_MODEL,/' src/lib/schoolEnricher.ts

# 5. Update src/app/api/chat/route.ts
sed -i 's/^const MODEL = "nvidia\/nemotron-3-super-120b-a12b:free";$/import { DEFAULT_MODEL } from "@\/lib\/models";/' src/app/api/chat/route.ts
sed -i 's/model: MODEL,/model: DEFAULT_MODEL,/' src/app/api/chat/route.ts

# 6. Update src/app/api/nudge/route.ts
sed -i '4a import { DEFAULT_MODEL } from "@/lib/models";' src/app/api/nudge/route.ts
sed -i 's/model: "nvidia\/nemotron-3-super-120b-a12b:free",/model: DEFAULT_MODEL,/' src/app/api/nudge/route.ts

# 7. Commit and push
git add -A
git commit -m "refactor: centralize model config into src/lib/models.ts

Extract all hardcoded model references ('nvidia/nemotron-3-super-120b-a12b:free')
into a single DEFAULT_MODEL export in src/lib/models.ts.

Updated files:
- src/agents/noteParser/parse.ts
- src/agents/briefing/generate.ts
- src/lib/schoolEnricher.ts
- src/app/api/chat/route.ts
- src/app/api/nudge/route.ts"

git push origin main

echo ""
echo "Done! Model config centralized in src/lib/models.ts"
echo "To change the model everywhere, edit DEFAULT_MODEL in that file."
