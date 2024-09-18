import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";

import { reverseProxy } from "./vercel_reverseproxy";

export const config = {
  matcher: "/(.*)",
};

// DO NOT SHARE THIS URL
const TARGET_HOST = "[REPLACE_WITH_TARGET_SHARED_BY_MINTLIFY]";
const PUBLIC_DOMAIN = "[REPLACE_WITH_PUBLIC_CUSTOM_DOMAIN]";
const TOTP_PASSWORD = "[REPLACE_WITH_TOTP_PASSWORD]";

const PUBLIC_REDIRECT_URL = `https://${PUBLIC_DOMAIN}/auth`;

const NEXT_PAGES = ["/auth"];

function nextRedirect(url: string) {
  return NextResponse.redirect(new URL(url), 307);
}

export async function middleware(req: NextRequest, context: NextFetchEvent) {
  var res: NextResponse | undefined;
  const url = new URL(req.url);
  //local pages are served locally, all others go through auth and reverse proxy
  if (
    NEXT_PAGES.includes(url.pathname) ||
    url.pathname.includes("/proxy_assets") ||
    url.pathname.includes("_next/data/proxy-app-")
  ) {
    return NextResponse.next();
  }
  //to differiate between _next files at the target host and locally, we prefixed them with proxy_files (see assetPrefix in next.config.js)
  if (req.nextUrl.href.includes("/proxy_files/_next/")) {
    return NextResponse.rewrite(
      req.nextUrl.href.replace("/proxy_files/_next/", "/_next/"),
    );
  }

  // AUTH
  const cookies = req.cookies;
  const totp_cookie = cookies.get("docs-totp-auth")?.value;

  switch (url.hostname) {
    case PUBLIC_DOMAIN:
      if (totp_cookie != TOTP_PASSWORD) {
        return nextRedirect(PUBLIC_REDIRECT_URL);
      }
      break;
    default:
      return new NextResponse("Oops, there was an error.", { status: 404 });
  }

  // REVERSE PROXY
  let prom = reverseProxy(req, TARGET_HOST)
    .then((r) => {
      if (r.status == 308) console.log("308");
      res = r;
    })
    .catch((error) => {
      res = new NextResponse("Oops, there was an error.", { status: 404 });
      console.error("ERR: (" + url + "):", error);
    });

  await prom;
  return res;
}
