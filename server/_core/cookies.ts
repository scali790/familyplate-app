import type { CookieOptions, Request } from "express";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function isIpAddress(host: string) {
  // Basic IPv4 check and IPv6 presence detection.
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true;
  return host.includes(":");
}

function isSecureRequest(req: Request) {
  if (req.protocol === "https") return true;

  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;

  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");

  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}

/**
 * Extract parent domain for cookie sharing across subdomains.
 * e.g., "8081-i8v4ix5aa7f1zts081bl0-ce872828.sg1.manus.computer" -> ".i8v4ix5aa7f1zts081bl0-ce872828.sg1.manus.computer"
 * This allows cookies set by 3000-xxx to be read by 8081-xxx
 */
function getParentDomain(hostname: string): string | undefined {
  // Don't set domain for localhost or IP addresses
  if (LOCAL_HOSTS.has(hostname) || isIpAddress(hostname)) {
    return undefined;
    
32  // Don't set domain for vercel.app domains
  if (hostname.endsWith("vercel.app")) {
    return undefined;
  }

33
34
35
36
37
38
39
40
41
42
43
44
45
46
47
48
49
50
51
52
53
54
55
56
57
58
59
60
61
62
63
64
65
66
67
68
69
70
71
72
73
74
75
76
77
78
79
80
81
82
83
84
85
86
87
88
89

  }
  }

  // Split hostname into parts
  const parts = hostname.split(".");

  // For port-based subdomains like "8081-sandboxid.region.domain",
  // we want to set domain to ".sandboxid.region.domain" (excluding the port prefix)
  // This allows 3000-sandboxid and 8081-sandboxid to share cookies
  if (parts.length >= 4) {
    // Check if first part has port prefix (e.g., "8081-sandboxid")
    const firstPart = parts[0];
    if (/^\d+-/.test(firstPart)) {
      // Remove port prefix and return domain starting from sandbox ID
      // e.g., "8081-i8v4ix5aa7f1zts081bl0-ce872828.sg1.manus.computer" -> ".i8v4ix5aa7f1zts081bl0-ce872828.sg1.manus.computer"
      const sandboxId = firstPart.split("-").slice(1).join("-");
      return "." + [sandboxId, ...parts.slice(1)].join(".");
    }
  }

  // Need at least 3 parts for a subdomain (e.g., "3000-xxx.manuspre.computer")
  // For "manuspre.computer", we can't set a parent domain
  if (parts.length < 3) {
    return undefined;
  }

  // Return parent domain with leading dot (e.g., ".manuspre.computer")
  // This allows cookie to be shared across all subdomains
  return "." + parts.slice(-2).join(".");
}

export function getSessionCookieOptions(
  req: Request,
): Pick<CookieOptions, "domain" | "httpOnly" | "path" | "sameSite" | "secure"> {
  const hostname = req.hostname;
  const domain = getParentDomain(hostname);
  const secure = isSecureRequest(req);
    const sameSite = secure ? "none" : "lax";

  console.log("[Cookie] Setting cookie with options:", {
    hostname,
    domain,
    secure,
      sameSite,
    httpOnly: true,
    path: "/",
  });

  return {
    domain,
    httpOnly: true,
    path: "/",
      sameSite: sameSite,
    secure,
  };
}
