import { NavLink } from 'react-router-dom';
import { Pencil, Book, LogOut } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface SidebarProps {
  user: any;
  onLogout: () => void;
}

const SidebarIcon = ({ to, icon: Icon, label, end = false }: any) => (
  <NavLink
    to={to}
    end={end}
    className={({ isActive }) =>
      cn(
        'group relative flex h-10 w-10 items-center justify-center rounded-lg transition-colors',
        isActive
          ? 'bg-card text-foreground'
          : 'text-muted-foreground hover:text-foreground'
      )
    }
  >
    <Icon className="h-5 w-5" />
    <span className="absolute left-full ml-4 origin-left scale-0 rounded bg-card-foreground px-2 py-1 text-xs text-background transition-transform group-hover:scale-100">
      {label}
    </span>
  </NavLink>
);

export const Sidebar = ({ user, onLogout }: SidebarProps) => {
  return (
    <aside className="flex w-16 flex-col items-center justify-between bg-secondary py-6">
      <div className="flex flex-col items-center gap-6">
        <SidebarIcon to="/" icon={Pencil} label="New Entry" end={true} />
        <SidebarIcon to="/history" icon={Book} label="History" />
      </div>

      {/* --- FIX: RE-IMPLEMENTED AVATAR DROPDOWN --- */}
      <div className="mt-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex h-9 w-9 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-secondary">
              <Avatar className="h-8 w-8 cursor-pointer">
                <AvatarImage
                  src={user?.user_metadata?.avatar_url}
                  alt={user?.email}
                />
                <AvatarFallback>
                  {user?.email?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="sr-only">Open user menu</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user?.user_metadata?.full_name || 'User'}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onLogout}
              className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
};
