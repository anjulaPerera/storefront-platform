"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { tenantConfig } from "@storefront/config";
import { useAuthStore } from "@/store/auth.store";
import { useWishlistStore } from "@/store/wishlist.store";
import { useUIStore } from "@/store/ui.store";

const { navigation, identity } = tenantConfig;

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // ← Added isHydrated and isLoading alongside user and logout
  const { user, logout, isHydrated, isLoading } = useAuthStore();

  const { mobileMenuOpen, toggleMobileMenu, closeMobileMenu } = useUIStore();
  const wishlistCount = useWishlistStore((s) => s.productIds.size);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    closeMobileMenu();
  }, [pathname]);

  // Derived flag: true while the session restoration is still in flight.
  // When this is true we don't yet know whether the visitor is logged in or
  // not, so we render a neutral placeholder instead of either state.
  const sessionPending = !isHydrated || isLoading;

  return (
    <>
      {/* ─── Desktop Navbar ─────────────────────────────────────────── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled ? "py-3" : "py-5"
        }`}
      >
        <div className="container-wide">
          <nav
            className={`flex items-center justify-between transition-all duration-500 border border-transparent ${
              scrolled
                ? "glass-2 rounded-full px-5 py-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
                : "px-0"
            }`}
          >
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2.5 flex-shrink-0 group"
              onClick={closeMobileMenu}
            >
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center transition-all duration-300 group-hover:shadow-glow-sm">
                <span className="font-display font-bold text-white text-sm">
                  RP
                </span>
              </div>
              <span className="font-display font-bold text-lg tracking-tight">
                {identity.shopName}
              </span>
            </Link>

            {/* Desktop links */}
            <div className="hidden lg:flex items-center gap-1">
              {navigation.topLinks.map((link) => {
                const active =
                  link.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(link.href);

                return (
                  <div key={link.href} className="relative group">
                    <Link
                      href={
                        link.children
                          ? (link.children.at(-1)?.href ?? link.href)
                          : link.href
                      }
                      className={`flex items-center gap-1 px-3.5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                        active
                          ? "text-white bg-white/10"
                          : "text-white/60 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      {link.label}
                      {link.children && (
                        <svg
                          className="w-3.5 h-3.5 transition-transform duration-200 group-hover:rotate-180"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.5}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      )}
                    </Link>

                    {link.children && (
                      <div
                        className="absolute top-full left-1/2 -translate-x-1/2 pt-2 w-52
                          opacity-0 invisible
                          group-hover:opacity-100 group-hover:visible
                          transition-all duration-150 z-50"
                      >
                        <div className="glass-2 rounded-2xl border border-border-mid overflow-hidden shadow-card">
                          <div className="py-2">
                            {link.children.map((child) => (
                              <Link
                                key={child.href}
                                href={child.href}
                                className="flex items-center px-4 py-2.5 text-sm text-muted hover:text-white hover:bg-white/5 transition-colors"
                              >
                                {child.label}
                              </Link>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-1.5">
              {/* Search */}
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2.5 rounded-full text-muted hover:text-white hover:bg-white/5 transition-colors"
                aria-label="Search"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </button>

              {/* Wishlist */}
              <Link
                href="/wishlist"
                className="relative p-2.5 rounded-full text-muted hover:text-white hover:bg-white/5 transition-colors"
                aria-label="Wishlist"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
                {wishlistCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {wishlistCount > 9 ? "9+" : wishlistCount}
                  </span>
                )}
              </Link>

              {/* Account — three possible states:
                  1. sessionPending: we don't know yet → show a shimmer placeholder
                  2. user exists: show avatar + dropdown
                  3. no user: show Sign In button                                   */}
              {sessionPending ? (
                // Matches the width/height of the Sign In button so the navbar
                // doesn't shift when the real element appears.
                <div className="w-20 h-9 rounded-full bg-white/5 animate-pulse" />
              ) : user ? (
                <div className="relative group">
                  <button className="flex items-center gap-2 px-3 py-2 rounded-full glass border border-border-mid hover:border-border-bright transition-all text-sm font-medium text-foreground">
                    <span className="w-5 h-5 bg-primary rounded-full flex items-center justify-center text-[11px] font-bold text-white">
                      {user.firstName[0]}
                    </span>
                    <span className="hidden sm:block text-white">
                      {user.firstName}
                    </span>
                  </button>
                  <div className="absolute right-0 top-full mt-2 w-48 glass-2 rounded-2xl border border-border-mid overflow-hidden shadow-card opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    <div className="py-2">
                      <Link
                        href="/profile"
                        className="flex items-center px-4 py-2.5 text-sm text-muted hover:text-white hover:bg-white/5 transition-colors"
                      >
                        My Profile
                      </Link>
                      {(user.role === "admin" ||
                        user.role === "super_admin") && (
                        <Link
                          href="/admin"
                          className="flex items-center px-4 py-2.5 text-sm text-muted hover:text-white hover:bg-white/5 transition-colors"
                        >
                          Admin Dashboard
                        </Link>
                      )}
                      <hr className="my-1 border-border" />
                      <button
                        onClick={() => logout()}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-white/5 transition-colors"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <Link href="/login" className="btn-primary text-sm px-5 py-2">
                  Sign In
                </Link>
              )}

              {/* Mobile hamburger */}
              <button
                onClick={toggleMobileMenu}
                className="lg:hidden p-2.5 rounded-full text-muted hover:text-white hover:bg-white/5 transition-colors"
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              >
                {mobileMenuOpen ? (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                )}
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* ─── Mobile Menu ─────────────────────────────────────────────── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 flex flex-col pt-24 lg:hidden">
          <div
            className="absolute inset-0 bg-space-1/95 backdrop-blur-2xl"
            onClick={closeMobileMenu}
          />
          <nav className="relative z-10 px-6 py-4 space-y-1">
            {navigation.topLinks.map((link) => (
              <div key={link.href}>
                <Link
                  href={
                    link.children
                      ? (link.children[link.children.length - 1]?.href ??
                        link.href)
                      : link.href
                  }
                  onClick={closeMobileMenu}
                  className="block px-4 py-3 rounded-xl text-base font-semibold text-foreground hover:bg-white/5 transition-colors font-display"
                >
                  {link.label}
                </Link>
                {link.children?.slice(0, -1).map((child) => (
                  <Link
                    key={child.href}
                    href={child.href}
                    onClick={closeMobileMenu}
                    className="block px-8 py-2 text-sm text-muted hover:text-white transition-colors"
                  >
                    {child.label}
                  </Link>
                ))}
              </div>
            ))}
          </nav>
        </div>
      )}

      {/* ─── Search Overlay ──────────────────────────────────────────── */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4"
          onClick={() => setSearchOpen(false)}
        >
          <div className="absolute inset-0 bg-space-1/80 backdrop-blur-xl" />
          <div
            className="relative w-full max-w-2xl glass-2 rounded-2xl border border-border-bright shadow-card overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 p-4">
              <svg
                className="w-5 h-5 text-muted flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <form action="/search" className="flex-1">
                <input
                  name="q"
                  autoFocus
                  placeholder="Search phones, brands, accessories…"
                  className="w-full bg-transparent text-white text-lg placeholder-muted outline-none font-body"
                />
              </form>
              <button
                onClick={() => setSearchOpen(false)}
                className="text-muted hover:text-white p-1"
                aria-label="open-search"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="px-4 pb-4">
              <p className="text-xs text-muted">
                Press Enter to search · ESC to close
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
