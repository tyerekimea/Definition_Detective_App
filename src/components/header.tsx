
"use client";

import Image from "next/image";
import Link from "next/link";
import { LogIn, LogOut, User, Volume2, VolumeX } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import type { ImagePlaceholder } from "@/lib/placeholder-images";
import { useEffect, useState } from "react";
import placeholderData from '@/lib/placeholder-images.json';
import { useSound } from "@/hooks/use-sound";
import { usePathname } from "next/navigation";

const PRIMARY_LOGO_SRC = "/logo-definition-detective.png";
const FALLBACK_LOGO_SRC = "/og.png";

export default function Header() {
  const { user, loading, logout } = useAuth();
  const [avatarImage, setAvatarImage] = useState<ImagePlaceholder | undefined>();
  const [logoSrc, setLogoSrc] = useState(PRIMARY_LOGO_SRC);
  const [logoLoadFailed, setLogoLoadFailed] = useState(false);
  const { isMuted, toggleMute } = useSound();
  const pathname = usePathname();
  const showPrimaryNav = pathname !== "/";

  useEffect(() => {
    setAvatarImage(placeholderData.placeholderImages.find(p => p.id === "1"));
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="flex flex-1 items-center">
          {showPrimaryNav && (
            <nav className="hidden md:flex items-center gap-6 text-sm">
              <Link
                href="/leaderboard"
                className="transition-colors hover:text-foreground/80 text-foreground/60"
              >
                Leaderboard
              </Link>
              <Link
                href="/pricing"
                className="transition-colors hover:text-foreground/80 text-foreground/60"
              >
                Pricing
              </Link>
            </nav>
          )}
        </div>
        <Link href="/" className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
          {logoLoadFailed ? (
            <span className="font-bold sm:inline-block">Definition Detective</span>
          ) : (
            <Image
              src={logoSrc}
              alt="Definition Detective"
              width={44}
              height={44}
              className="h-11 w-11 rounded-md object-cover"
              priority
              onError={() => {
                if (logoSrc !== FALLBACK_LOGO_SRC) {
                  setLogoSrc(FALLBACK_LOGO_SRC);
                  return;
                }
                setLogoLoadFailed(true);
              }}
            />
          )}
        </Link>
        <div className="flex flex-1 items-center justify-end space-x-2">
           <Button variant="ghost" size="icon" onClick={toggleMute}>
            {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            <span className="sr-only">Toggle sound</span>
          </Button>
          {loading ? (
            <Skeleton className="h-8 w-8 rounded-full" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full"
                >
                  <Avatar className="h-8 w-8">
                    {avatarImage && <AvatarImage src={avatarImage.imageUrl} alt={user.displayName || 'User'} data-ai-hint={avatarImage.imageHint} />}
                    <AvatarFallback>{user.displayName?.charAt(0) || user.email?.charAt(0)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.displayName || 'User'}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm">
              <Link href="/login">
                <LogIn className="mr-2 h-4 w-4" />
                Login
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
