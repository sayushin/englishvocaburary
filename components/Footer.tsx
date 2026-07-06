"use client"

import Link from "next/link"

import { usePathname } from "next/navigation"

const navItems = [
  { href: "/", label: "Home" },
  { href: "/add", label: "Add" },
  { href: "/review", label: "Review" },
  { href: "/quiz", label: "Quiz" }
] 

const Footer = () => {

  const pathname = usePathname()

  return (

    <footer className="fixed bottom-0 left-0 w-full border-t bg-white">

      <nav className="flex justify-around py-3">

        {navItems.map(({ href, label }) => {

          const active =
            pathname === href ||
            (href !== "/" && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={`text-sm font-medium transition-colors ${
                active
                  ? "text-blue-600"
                  : "text-gray-500"
              }`}
            >
              {label}
            </Link>

          )

        })}

      </nav>

    </footer>

  )

}

export default Footer