import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@react-pdf/renderer"],

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Prevent the page from being loaded in an iframe (clickjacking)
          { key: "X-Frame-Options", value: "DENY" },
          // Stop browsers from guessing MIME types
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Control how much referrer info is sent
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Restrict which browser features this app may use
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(), geolocation=(), payment=()",
          },
          // Force HTTPS in production only
          ...(isDev
            ? []
            : [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=63072000; includeSubDomains; preload",
                },
              ]),
        ],
      },
    ];
  },
};

export default nextConfig;

