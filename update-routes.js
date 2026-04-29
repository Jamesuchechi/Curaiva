const fs = require('fs');
const path = require('path');

const routes = [
  'web/src/app/api/triage/route.ts',
  'web/src/app/api/summary/route.ts',
  'web/src/app/api/brief/route.ts',
  'web/src/app/api/adherence/route.ts',
  'web/src/app/api/mental-health/route.ts',
  'web/src/app/api/queue/route.ts'
];

const authCode = `
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value; },
          set(name: string, value: string, options: CookieOptions) { cookieStore.set({ name, value, ...options }); },
          remove(name: string, options: CookieOptions) { cookieStore.set({ name, value: "", ...options }); },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
`;

routes.forEach(routePath => {
  const fullPath = path.join('/home/jamesuchechi/Projects/Curaiva', routePath);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Check if we need to add imports
    if (!content.includes('createServerClient')) {
      // Find the import block and add it
      content = content.replace(
        /import { NextResponse } from "next\/server";/,
        `import { NextResponse } from "next/server";\nimport { createServerClient, type CookieOptions } from "@supabase/ssr";\nimport { cookies } from "next/headers";`
      );
    }
    
    // Inject auth code after try {
    if (!content.includes('supabase.auth.getUser()')) {
      content = content.replace(/try\s*{/, `try {${authCode}`);
    }
    
    fs.writeFileSync(fullPath, content);
    console.log(`Updated ${routePath}`);
  } else {
    console.log(`Not found: ${routePath}`);
  }
});
