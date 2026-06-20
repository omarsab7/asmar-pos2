export { default } from "next-auth/middleware";
export const config = {
  matcher: ["/dashboard/:path*", "/pos/:path*", "/inventory/:path*", "/products/:path*", "/ai-assistant/:path*"],
};
