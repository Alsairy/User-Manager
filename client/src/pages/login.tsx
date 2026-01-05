import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, X, ShieldCheck, Clock, Banknote } from "lucide-react";
import madaresLogo from "@assets/madares_business_1766959895640.png";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      if (email === "admin@madares.sa" && password === "admin123") {
        localStorage.setItem("isLoggedIn", "true");
        toast({
          title: "Login successful",
          description: "Welcome to Madares Business Platform",
        });
        setLocation("/");
        window.location.reload();
      } else {
        toast({
          title: "Login failed",
          description: "Invalid email or password",
          variant: "destructive",
        });
      }
      setIsLoading(false);
    }, 500);
  };

  const handleOneTimePassword = () => {
    toast({
      title: "One-time password",
      description: "This feature is coming soon",
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-background">
      <header className="flex items-center justify-between px-6 py-4 border-b border-border/40">
        <div className="flex items-center gap-3">
          <img
            src={madaresLogo}
            alt="Madares Business"
            className="h-10 w-auto"
            data-testid="img-login-logo"
          />
        </div>
        <Button
          variant="ghost"
          className="text-muted-foreground gap-2"
          onClick={() => window.close()}
          data-testid="button-cancel"
        >
          <X className="h-4 w-4" />
          Cancel and close
        </Button>
      </header>

      <div className="flex-1 flex">
        <div className="flex-1 flex items-center justify-center p-8 lg:p-12">
          <div className="w-full max-w-md space-y-8">
            <h1 className="text-3xl lg:text-4xl font-semibold text-foreground" data-testid="text-login-title">
              Log in to your account
            </h1>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  E-mail <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter e-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 bg-white dark:bg-background border-border"
                  data-testid="input-email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 pr-12 bg-white dark:bg-background border-border"
                    data-testid="input-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    data-testid="button-toggle-password"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <a
                  href="#"
                  className="text-sm font-medium text-teal-600 hover:text-teal-700 dark:text-teal-400"
                  data-testid="link-forgot-password"
                >
                  Forgot your password?
                </a>
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base font-medium"
                style={{ backgroundColor: "#C9A227", color: "#1a1a1a" }}
                disabled={isLoading}
                data-testid="button-login"
              >
                {isLoading ? "Signing in..." : "Continue"}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white dark:bg-background px-4 text-muted-foreground">OR</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full h-12 text-base font-medium border-border"
                onClick={handleOneTimePassword}
                data-testid="button-otp"
              >
                Continue with one-time password
              </Button>
            </form>

            <div className="p-4 rounded-md bg-muted/50">
              <p className="text-sm text-muted-foreground text-center">
                Demo credentials: admin@madares.sa / admin123
              </p>
            </div>
          </div>
        </div>

        <div className="hidden lg:flex flex-1 items-center justify-center p-12" style={{ backgroundColor: "#F5F0E8" }}>
          <div className="max-w-lg space-y-8">
            <div className="text-teal-700 dark:text-teal-600">
              <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M30 5C30 5 25 15 25 25C25 35 30 45 30 45" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M35 10L40 5M40 10L45 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>

            <h2 className="text-2xl lg:text-3xl font-semibold text-gray-900">
              Madares Business is transforming land acquisition in Saudi Arabia
            </h2>

            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center">
                  <ShieldCheck className="h-6 w-6 text-teal-700" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Government-Aligned Process</h3>
                  <p className="text-sm text-gray-600">
                    Madares Business enables investors to acquire designated education parcels ensuring full compliance with national regulations and policies.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-teal-700" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Transparent, Timely Approvals</h3>
                  <p className="text-sm text-gray-600">
                    We help stakeholders progress from application to allocation with certainty.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center">
                  <Banknote className="h-6 w-6 text-teal-700" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Financial Clarity</h3>
                  <p className="text-sm text-gray-600">
                    Upfront visibility on allotment criteria, fees, and obligations.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-end gap-3 pt-4">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200">
                <div className="w-full h-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
                  <svg className="w-12 h-12 text-amber-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9H15V22H13V16H11V22H9V9H3V7H21V9Z"/>
                  </svg>
                </div>
              </div>
              <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-300">
                <div className="w-full h-full bg-gradient-to-br from-stone-200 to-stone-300" />
              </div>
              <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-300">
                <div className="w-full h-full bg-gradient-to-br from-amber-100 to-amber-200" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
