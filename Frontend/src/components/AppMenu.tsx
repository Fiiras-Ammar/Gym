import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Menu, Home, Package, Dumbbell, Scale, History as HistoryIcon, Settings as SettingsIcon, Plus, User, Users, LogOut } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const items = [
  { to: "/", label: "Today", Icon: Home },
  { to: "/kitchen", label: "Kitchen", Icon: Package },
  { to: "/add", label: "Add product", Icon: Plus },
  { to: "/workouts", label: "Workouts", Icon: Dumbbell },
  { to: "/weight", label: "Weight", Icon: Scale },
  { to: "/history", label: "History", Icon: HistoryIcon },
  { to: "/settings", label: "Goals", Icon: SettingsIcon },
];

export const AppMenu = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { isAdmin, signOut } = useAuth();

  const go = (to: string) => { navigate(to); setOpen(false); };
  const handleSignOut = async () => { await signOut(); setOpen(false); navigate("/auth", { replace: true }); };

  const renderItem = (to: string, label: string, Icon: any) => {
    const active = pathname === to;
    return (
      <button
        key={to}
        onClick={() => go(to)}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition",
          active ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted"
        )}
      >
        <Icon className="h-4 w-4" />
        {label}
      </button>
    );
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        <nav className="mt-6 flex flex-col gap-1">
          {items.map(({ to, label, Icon }) => renderItem(to, label, Icon))}
          <Separator className="my-2" />
          {renderItem("/profile", "Profile", User)}
          {isAdmin && renderItem("/admin", "User management", Users)}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-destructive transition hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </nav>
      </SheetContent>
    </Sheet>
  );
};
