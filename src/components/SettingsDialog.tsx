import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  User, 
  Palette, 
  Settings2, 
  Users, 
  LogOut, 
  Moon, 
  Sun,
  Bell,
  MessageSquare,
  Volume2
} from "lucide-react";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  language: string;
  onLanguageChange: (lang: string) => void;
  onClearHistory: () => void;
  user?: {
    email?: string;
    user_metadata?: {
      full_name?: string;
    };
  } | null;
  onSignOut?: () => void;
}

const languages = [
  { value: "en", label: "🇬🇧 English" },
  { value: "hi", label: "🇮🇳 हिंदी (Hindi)" },
  { value: "kn", label: "🇮🇳 ಕನ್ನಡ (Kannada)" },
  { value: "te", label: "🇮🇳 తెలుగు (Telugu)" },
  { value: "ta", label: "🇮🇳 தமிழ் (Tamil)" },
  { value: "bn", label: "🇮🇳 বাংলা (Bengali)" },
  { value: "mr", label: "🇮🇳 मराठी (Marathi)" },
  { value: "gu", label: "🇮🇳 ગુજરાતી (Gujarati)" },
  { value: "pa", label: "🇮🇳 ਪੰਜਾਬੀ (Punjabi)" },
  { value: "ml", label: "🇮🇳 മലയാളം (Malayalam)" },
  { value: "or", label: "🇮🇳 ଓଡ଼ିଆ (Odia)" },
  { value: "as", label: "🇮🇳 অসমীয়া (Assamese)" },
  { value: "ur", label: "🇮🇳 اردو (Urdu)" },
];

export function SettingsDialog({
  open,
  onOpenChange,
  language,
  onLanguageChange,
  onClearHistory,
  user,
  onSignOut,
}: SettingsDialogProps) {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const [notifications, setNotifications] = useState(true);
  const [soundEffects, setSoundEffects] = useState(true);
  const [autoSpeak, setAutoSpeak] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | "system" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    }
  }, []);

  const applyTheme = (newTheme: "light" | "dark" | "system") => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    if (newTheme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
    } else {
      root.classList.add(newTheme);
    }
  };

  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    applyTheme(newTheme);
  };

  const getUserInitials = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Manage your account and preferences
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="account" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="account" className="flex items-center gap-1 text-xs">
              <User className="h-3 w-3" />
              <span className="hidden sm:inline">Account</span>
            </TabsTrigger>
            <TabsTrigger value="theme" className="flex items-center gap-1 text-xs">
              <Palette className="h-3 w-3" />
              <span className="hidden sm:inline">Theme</span>
            </TabsTrigger>
            <TabsTrigger value="personalization" className="flex items-center gap-1 text-xs">
              <Settings2 className="h-3 w-3" />
              <span className="hidden sm:inline">Preferences</span>
            </TabsTrigger>
            <TabsTrigger value="workspace" className="flex items-center gap-1 text-xs">
              <Users className="h-3 w-3" />
              <span className="hidden sm:inline">Workspace</span>
            </TabsTrigger>
          </TabsList>

          {/* Account Tab */}
          <TabsContent value="account" className="space-y-4 mt-4">
            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium">
                  {user?.user_metadata?.full_name || "User"}
                </p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <h4 className="font-medium text-sm">Account Actions</h4>
              <Button
                onClick={onSignOut}
                variant="destructive"
                className="w-full flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </TabsContent>

          {/* Theme Tab */}
          <TabsContent value="theme" className="space-y-4 mt-4">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Appearance</Label>
              <div className="grid grid-cols-3 gap-3">
                <Button
                  variant={theme === "light" ? "default" : "outline"}
                  className="flex flex-col items-center gap-2 h-auto py-4"
                  onClick={() => handleThemeChange("light")}
                >
                  <Sun className="h-6 w-6" />
                  <span className="text-xs">Light</span>
                </Button>
                <Button
                  variant={theme === "dark" ? "default" : "outline"}
                  className="flex flex-col items-center gap-2 h-auto py-4"
                  onClick={() => handleThemeChange("dark")}
                >
                  <Moon className="h-6 w-6" />
                  <span className="text-xs">Dark</span>
                </Button>
                <Button
                  variant={theme === "system" ? "default" : "outline"}
                  className="flex flex-col items-center gap-2 h-auto py-4"
                  onClick={() => handleThemeChange("system")}
                >
                  <Settings2 className="h-6 w-6" />
                  <span className="text-xs">System</span>
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Personalization Tab */}
          <TabsContent value="personalization" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select value={language} onValueChange={onLanguageChange}>
                <SelectTrigger id="language">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {languages.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="notifications" className="text-sm">
                    Notifications
                  </Label>
                </div>
                <Switch
                  id="notifications"
                  checked={notifications}
                  onCheckedChange={setNotifications}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="sound" className="text-sm">
                    Sound Effects
                  </Label>
                </div>
                <Switch
                  id="sound"
                  checked={soundEffects}
                  onCheckedChange={setSoundEffects}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="autoSpeak" className="text-sm">
                    Auto-speak Responses
                  </Label>
                </div>
                <Switch
                  id="autoSpeak"
                  checked={autoSpeak}
                  onCheckedChange={setAutoSpeak}
                />
              </div>
            </div>

            <Separator />

            <div className="pt-2">
              <Button
                onClick={onClearHistory}
                variant="outline"
                className="w-full text-destructive hover:text-destructive"
              >
                Clear All Chat History
              </Button>
            </div>
          </TabsContent>

          {/* Workspace Tab */}
          <TabsContent value="workspace" className="space-y-4 mt-4">
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <h4 className="font-medium mb-1">Workspace</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Manage your workspace settings and team members
              </p>
              <div className="space-y-2 text-left">
                <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                  <span className="text-sm">Workspace Name</span>
                  <span className="text-sm font-medium">Personal</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                  <span className="text-sm">Members</span>
                  <span className="text-sm font-medium">1</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                  <span className="text-sm">Plan</span>
                  <span className="text-sm font-medium text-primary">Free</span>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
