'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { tenantConfig } from '@storefront/config';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { useWishlistStore } from '@/store/wishlist.store';

const { navigation, identity } = tenantConfig;

export function Navbar() {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const { user, logout }  = useAuthStore();
  const { mobileMenuOpen, toggleMobileMenu, closeMobileMenu } = useUIStore();
  const wishlistCount = useWishlistStore((s) => s.productIds.size);



  return (
    <nav className="sticky top-0 z-50 bg-surface border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 flex-shrink-0"
            onClick={closeMobileMenu}
          >
            <Image
              src={identity.logoPath}
              alt={identity.shopName}
              width={40}
              height={40}
              className="h-10 w-auto"
              onError={() => {
                /* fallback handled by alt text */
              }}
            />
            <span className="font-bold text-xl text-primary hidden sm:block">
              {identity.shopName}
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-1">
            {navigation.topLinks.map((link) => (
              <div
                key={link.href}
                className="relative"
                onMouseEnter={() => link.children && setOpenDropdown(link.href)}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                <Link
                  href={link.href}
                  className="px-3 py-2 rounded-md text-sm font-medium text-foreground hover:text-primary hover:bg-gray-50 transition-colors"
                >
                  {link.label}
                  {link.children && <span className="ml-1 text-xs">▾</span>}
                </Link>

                {/* Dropdown */}
                {link.children && openDropdown === link.href && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-surface rounded-md shadow-lg border border-gray-100 py-1 z-50">
                    {link.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className="block px-4 py-2 text-sm text-foreground hover:text-primary hover:bg-gray-50"
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Wishlist */}
            <Link
              href="/wishlist"
              className="relative p-2 text-foreground hover:text-primary transition-colors"
              aria-label="Wishlist"
            >
              <svg
                className="w-6 h-6"
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
                <span className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                  {wishlistCount > 9 ? "9+" : wishlistCount}
                </span>
              )}
            </Link>

            {/* Account */}
            {user ? (
              <div className="relative group">
                <button
                  className="flex items-center gap-2 p-2 text-sm text-foreground hover:text-primary transition-colors"
                  aria-label="Account menu"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  <span className="hidden sm:block">{user.firstName}</span>
                </button>
                <div className="absolute right-0 top-full mt-1 w-48 bg-surface rounded-md shadow-lg border border-gray-100 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  <Link
                    href="/profile"
                    className="block px-4 py-2 text-sm text-foreground hover:bg-gray-50"
                  >
                    My Profile
                  </Link>
                  {(user.role === "admin" || user.role === "super_admin") && (
                    <Link
                      href="/admin"
                      className="block px-4 py-2 text-sm text-foreground hover:bg-gray-50"
                    >
                      Admin Dashboard
                    </Link>
                  )}
                  <hr className="my-1" />
                  <button
                    onClick={() => logout()}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-md transition-colors"
              >
                Sign In
              </Link>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={toggleMobileMenu}
              className="lg:hidden p-2 text-foreground hover:text-primary transition-colors"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <svg
                  className="w-6 h-6"
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
                  className="w-6 h-6"
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
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 py-3">
            {navigation.topLinks.map((link) => (
              <div key={link.href}>
                <Link
                  href={link.href}
                  onClick={closeMobileMenu}
                  className="block px-4 py-2 text-sm font-medium text-foreground hover:text-primary hover:bg-gray-50"
                >
                  {link.label}
                </Link>
                {link.children?.map((child) => (
                  <Link
                    key={child.href}
                    href={child.href}
                    onClick={closeMobileMenu}
                    className="block px-8 py-2 text-sm text-muted hover:text-primary hover:bg-gray-50"
                  >
                    {child.label}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}