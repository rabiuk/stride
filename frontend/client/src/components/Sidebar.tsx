import { Link, NavLink } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { BookLogo } from '@/components/BookLogo';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { FilePenLine, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  session: any;
  onLogout: () => void;
}

export const Sidebar = ({ session, onLogout }: SidebarProps) => {
  const user = session?.user;
  const avatarUrl =
    user?.identities?.[0]?.identity_data?.avatar_url ||
    user?.user_metadata?.avatar_url;

  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-20 flex-col border-r bg-background sm:flex">
      {/* Top Navigation */}
      <nav className="flex flex-1 flex-col items-center gap-10 px-2 py-6">
        <Link
          to="/"
          className="flex h-10 w-full items-center justify-center rounded-lg"
        >
          <Logo />
          <span className="sr-only">Stride</span>
        </Link>

        <Tooltip>
          <TooltipTrigger asChild>
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                cn(
                  'm-4 flex w-auto items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-primary',
                  isActive && 'bg-muted text-primary'
                )
              }
            >
              <FilePenLine className="h-6 w-6" />
              <span className="sr-only">New Entry</span>
            </NavLink>
          </TooltipTrigger>
          <TooltipContent side="right">New Entry</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <NavLink
              to="/history"
              className={({ isActive }) =>
                cn(
                  'flex w-auto items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-primary',
                  isActive && 'bg-muted text-primary'
                )
              }
            >
              <BookLogo className="h-6 w-6" />
              <span className="sr-only">History</span>
            </NavLink>
          </TooltipTrigger>
          <TooltipContent side="right">History</TooltipContent>
        </Tooltip>
      </nav>

      {/* User Avatar Dropdown */}
      <div className="mt-auto flex flex-col items-center gap-4 p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Avatar className="h-9 w-9 cursor-pointer">
              <AvatarImage src={avatarUrl} alt={user?.email} />
              <AvatarFallback>{user?.email?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="end" className="w-40">
            <div className="px-2 py-1 text-center text-sm text-muted-foreground">
              {user?.user_metadata?.full_name || user?.email}
            </div>
            <DropdownMenuItem
              onClick={onLogout}
              className="flex justify-center text-red-600 focus:text-red-600"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
};
