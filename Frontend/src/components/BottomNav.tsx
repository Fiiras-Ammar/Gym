import { NavLink } from "react-router-dom";
import { Plus } from "lucide-react";

export const BottomNav = () => {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 pb-safe">
      <div className="mx-auto flex max-w-xl items-center justify-center px-4 py-4">
        <NavLink to="/add" className="pointer-events-auto" aria-label="Add product">
          <span className="flex h-16 w-16 items-center justify-center rounded-full gradient-hero shadow-glow">
            <Plus className="h-7 w-7 text-primary-foreground" />
          </span>
        </NavLink>
      </div>
    </div>
  );
};
