// Run: node apply-auth.js
// From inside your pathfinder repo root.
// Installs jose, writes all auth files, commits, and pushes.

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

function writeFile(filePath, content) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, content.trimStart());
  console.log(`Created: ${filePath}`);
}

// --- Install jose ---
console.log("Installing jose...");
execSync("npm install jose", { stdio: "inherit" });

// --- src/lib/session.ts ---
writeFile("src/lib/session.ts", `
// src/lib/session.ts

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "pathfinder-dev-secret-change-in-production"
);

const COOKIE_NAME = "pathfinder_session";

export async function createSession(counselorId: string) {
  const token = await new SignJWT({ sub: counselorId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
}

export async function getSession(): Promise<{ counselorId: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, SECRET);
    if (!payload.sub) return null;
    return { counselorId: payload.sub };
  } catch {
    return null;
  }
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
`);

// --- src/lib/auth.ts (rewrite) ---
writeFile("src/lib/auth.ts", `
// src/lib/auth.ts

import { prisma } from "./prisma";
import { getSession } from "./session";
import { redirect } from "next/navigation";

export async function getCurrentCounselor() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const counselor = await prisma.counselor.findUnique({
    where: { id: session.counselorId },
  });

  if (!counselor) {
    redirect("/login");
  }

  return counselor;
}
`);

// --- src/app/api/auth/signup/route.ts ---
writeFile("src/app/api/auth/signup/route.ts", `
// src/app/api/auth/signup/route.ts

import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const existing = await prisma.counselor.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const password_hash = await bcrypt.hash(password, 10);

    const counselor = await prisma.counselor.create({
      data: { name, email, password_hash },
    });

    await createSession(counselor.id);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Signup error:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
`);

// --- src/app/api/auth/login/route.ts ---
writeFile("src/app/api/auth/login/route.ts", `
// src/app/api/auth/login/route.ts

import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const counselor = await prisma.counselor.findUnique({ where: { email } });

    if (!counselor) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const valid = await bcrypt.compare(password, counselor.password_hash);

    if (!valid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    await createSession(counselor.id);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Login error:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
`);

// --- src/app/api/auth/logout/route.ts ---
writeFile("src/app/api/auth/logout/route.ts", `
// src/app/api/auth/logout/route.ts

import { deleteSession } from "@/lib/session";
import { NextResponse } from "next/server";

export async function POST() {
  await deleteSession();
  return NextResponse.json({ success: true });
}
`);

// --- src/middleware.ts ---
writeFile("src/middleware.ts", `
// src/middleware.ts

import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "pathfinder-dev-secret-change-in-production"
);

const PUBLIC_PATHS = ["/login", "/signup", "/api/auth/login", "/api/auth/signup"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Allow static files and Next.js internals
  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon") || pathname.includes(".")) {
    return NextResponse.next();
  }

  const token = req.cookies.get("pathfinder_session")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    await jwtVerify(token, SECRET);
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
`);

// --- src/app/login/page.tsx ---
writeFile("src/app/login/page.tsx", `
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm px-6">
        <div className="mb-8 text-center">
          <h1 className="text-lg font-semibold tracking-tight">PathFinder</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sign in to your account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1.5">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              placeholder="\\u2022\\u2022\\u2022\\u2022\\u2022\\u2022\\u2022\\u2022"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <a href="/signup" className="text-foreground underline underline-offset-2">
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}
`);

// --- src/app/signup/page.tsx ---
writeFile("src/app/signup/page.tsx", `
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Signup failed");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm px-6">
        <div className="mb-8 text-center">
          <h1 className="text-lg font-semibold tracking-tight">PathFinder</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create your account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1.5">
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              placeholder="Jane Smith"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1.5">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              placeholder="At least 8 characters"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <a href="/login" className="text-foreground underline underline-offset-2">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
`);

// --- src/components/LogoutButton.tsx ---
writeFile("src/components/LogoutButton.tsx", `
"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      Sign out
    </button>
  );
}
`);

// --- Patch dashboard to add logout button ---
const dashboardPath = path.join("src", "app", "dashboard", "page.tsx");
let dashboard = fs.readFileSync(dashboardPath, "utf-8");

if (!dashboard.includes("LogoutButton")) {
  // Add import
  dashboard = dashboard.replace(
    'import AddStudentButton from "@/components/AddStudentButton";',
    'import AddStudentButton from "@/components/AddStudentButton";\nimport LogoutButton from "@/components/LogoutButton";'
  );

  // Add button next to Calendar link
  dashboard = dashboard.replace(
    '<AddStudentButton />',
    '<AddStudentButton />\n            <LogoutButton />'
  );

  fs.writeFileSync(dashboardPath, dashboard);
  console.log("Patched: src/app/dashboard/page.tsx (added LogoutButton)");
}

// --- Update src/app/page.tsx ---
writeFile("src/app/page.tsx", `
// src/app/page.tsx

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export default async function Home() {
  const session = await getSession();
  if (session) {
    redirect("/dashboard");
  } else {
    redirect("/login");
  }
}
`);

// --- Commit and push ---
console.log("\nCommitting...");
execSync("git add -A", { stdio: "inherit" });
execSync(
  `git commit -m "feat: add email/password authentication\n\n- JWT sessions via jose (HTTP-only cookie)\n- Login and signup pages\n- Middleware to protect all routes\n- Logout button on dashboard\n- getCurrentCounselor() now reads from session\n\nAdd JWT_SECRET to .env.local for production."`,
  { stdio: "inherit" }
);
execSync("git push origin main", { stdio: "inherit" });

console.log("\nAuth is live! Notes:");
console.log("- Add JWT_SECRET to .env.local for production");
console.log("- Existing seeded counselors need a valid password_hash to log in");
console.log("- Create a new account via /signup, or re-seed with a hashed password");
