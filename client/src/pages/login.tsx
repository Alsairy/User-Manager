import { useState } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, X, ShieldCheck, ScrollText, Banknote } from "lucide-react";
import { LanguageToggle } from "@/components/language-toggle";
import madaresLogo from "@assets/madares_business_1766959895640.png";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation(["pages", "common"]);
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
          title: t("common:loginSuccessful"),
          description: t("common:welcomeMessage"),
        });
        setLocation("/");
        window.location.reload();
      } else {
        toast({
          title: t("common:loginFailed"),
          description: t("common:invalidCredentials"),
          variant: "destructive",
        });
      }
      setIsLoading(false);
    }, 500);
  };

  const handleOneTimePassword = () => {
    toast({
      title: t("common:oneTimePassword"),
      description: t("common:comingSoon"),
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-background">
      <header className="flex items-center justify-between h-20 px-8 border-b border-gray-100 dark:border-border bg-white dark:bg-background">
        <div className="h-10">
          <img
            src={madaresLogo}
            alt="Madares Business"
            className="h-full w-auto"
            data-testid="img-login-logo"
          />
        </div>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <button
            onClick={() => window.location.href = "https://business.madares.sa/"}
            className="flex items-center gap-1.5 h-10 px-4 bg-white dark:bg-background border border-gray-300 dark:border-border rounded-full shadow-sm text-sm font-semibold text-gray-900 dark:text-foreground"
            data-testid="button-cancel"
          >
            <X className="h-4 w-4" />
            {t("common:cancelAndClose")}
          </button>
        </div>
      </header>

      <div className="flex-1 flex">
        <div className="flex-1 flex flex-col items-center px-8 lg:px-40 pt-12 pb-14 bg-white dark:bg-background">
          <div className="w-full max-w-[440px] space-y-8">
            <h1 
              className="text-[40px] font-medium leading-[44px] tracking-[-1px] text-gray-800 dark:text-foreground"
              data-testid="text-login-title"
            >
              {t("pages:login.title")}
            </h1>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-0.5">
                  <span className="text-sm font-medium text-gray-800 dark:text-foreground">{t("pages:login.emailLabel")}</span>
                  <span className="text-sm font-medium text-red-600">*</span>
                </div>
                <Input
                  id="email"
                  type="email"
                  placeholder={t("common:enterEmail")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 px-4 bg-white dark:bg-background border-gray-300 dark:border-border rounded-xl shadow-sm text-base"
                  data-testid="input-email"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-0.5">
                  <span className="text-sm font-medium text-gray-800 dark:text-foreground">{t("pages:login.passwordLabel")}</span>
                  <span className="text-sm font-medium text-red-600">*</span>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={t("common:enterPassword")}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 px-4 ltr:pr-12 rtl:pl-12 bg-white dark:bg-background border-gray-300 dark:border-border rounded-xl shadow-sm text-base"
                    data-testid="input-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute ltr:right-4 rtl:left-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-muted-foreground"
                    data-testid="button-toggle-password"
                  >
                    {showPassword ? <Eye className="h-6 w-6" /> : <EyeOff className="h-6 w-6" />}
                  </button>
                </div>
                <a
                  href="#"
                  className="inline-block text-sm font-medium text-teal-700 dark:text-teal-500 underline underline-offset-2"
                  data-testid="link-forgot-password"
                >
                  {t("common:forgotPassword")}
                </a>
              </div>

              <div className="space-y-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 flex items-center justify-center rounded-full bg-teal-700 hover:bg-teal-800 text-white text-base font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="button-login"
                >
                  {isLoading ? t("pages:login.signingIn") : t("common:continue")}
                </button>

                <div className="flex items-center gap-2">
                  <div className="flex-1 h-px bg-gray-300 dark:bg-border rounded" />
                  <span className="text-sm text-gray-500 dark:text-muted-foreground">{t("common:or")}</span>
                  <div className="flex-1 h-px bg-gray-300 dark:bg-border rounded" />
                </div>

                <button
                  type="button"
                  onClick={handleOneTimePassword}
                  className="w-full h-12 flex items-center justify-center rounded-full bg-white dark:bg-background border border-gray-300 dark:border-border text-gray-900 dark:text-foreground text-base font-semibold shadow-sm hover:bg-gray-50 dark:hover:bg-muted"
                  data-testid="button-otp"
                >
                  {t("common:oneTimePassword")}
                </button>
              </div>
            </form>

            <div className="p-4 rounded-xl bg-gray-50 dark:bg-muted">
              <p className="text-sm text-gray-500 dark:text-muted-foreground text-center">
                {t("common:demoCredentials")}: admin@madares.sa / admin123
              </p>
            </div>
          </div>
        </div>

        <div 
          className="hidden lg:block flex-1 relative overflow-hidden"
          style={{ background: "linear-gradient(to bottom, #fff6e5, rgba(255,252,247,0))" }}
        >
          <div className="absolute ltr:left-0 rtl:right-0 top-0 w-32 h-32 opacity-60">
            <svg viewBox="0 0 120 120" fill="none" className="w-full h-full text-teal-800">
              <path d="M60 10 Q50 40 55 70 Q58 90 60 100" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
              <path d="M55 25 Q45 35 40 30" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
              <path d="M58 40 Q48 45 45 42" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
              <circle cx="75" cy="15" r="2" fill="currentColor"/>
              <path d="M80 10 L85 5 M85 15 L90 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>

          <div className="absolute ltr:right-5 rtl:left-5 top-[122px] w-20 h-20">
            <div className="w-full h-full rounded-full bg-gradient-to-br from-amber-100 to-amber-200 overflow-hidden flex items-center justify-center">
              <svg className="w-12 h-12 text-amber-700" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9H15V22H13V16H11V22H9V9H3V7H21V9Z"/>
              </svg>
            </div>
            <div className="absolute ltr:-right-2 rtl:-left-2 bottom-0 w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 5H17V3H7V5H5C3.9 5 3 5.9 3 7V8C3 10.55 4.92 12.63 7.39 12.94C8.02 14.44 9.37 15.57 11 15.9V19H7V21H17V19H13V15.9C14.63 15.57 15.98 14.44 16.61 12.94C19.08 12.63 21 10.55 21 8V7C21 5.9 20.1 5 19 5ZM5 8V7H7V10.82C5.84 10.4 5 9.3 5 8ZM19 8C19 9.3 18.16 10.4 17 10.82V7H19V8Z"/>
              </svg>
            </div>
          </div>

          <div className="px-16 pt-20">
            <h2 className="text-[32px] font-medium leading-10 tracking-[-1px] text-gray-800 max-w-md">
              {t("pages:loginPanel.headline")}
            </h2>

            <div className="mt-8 space-y-6 max-w-md">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "#f3e6d3" }}>
                  <ShieldCheck className="h-6 w-6" style={{ color: "#5b4638" }} />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-medium text-gray-800 leading-7 tracking-[-0.4px]">
                    {t("pages:loginPanel.feature1Title")}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 leading-5">
                    {t("pages:loginPanel.feature1Description")}
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "#f3e6d3" }}>
                  <ScrollText className="h-6 w-6" style={{ color: "#5b4638" }} />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-medium text-gray-800 leading-7 tracking-[-0.4px]">
                    {t("pages:loginPanel.feature2Title")}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 leading-5">
                    {t("pages:loginPanel.feature2Description")}
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "#f3e6d3" }}>
                  <Banknote className="h-6 w-6" style={{ color: "#5b4638" }} />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-medium text-gray-800 leading-7 tracking-[-0.4px]">
                    {t("pages:loginPanel.feature3Title")}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 leading-5">
                    {t("pages:loginPanel.feature3Description")}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-12 flex items-end gap-3">
              <div className="w-[72px] h-[72px] rounded-full overflow-hidden bg-amber-100">
                <div className="w-full h-full bg-gradient-to-br from-amber-200 to-amber-300 flex items-center justify-center">
                  <svg className="w-10 h-10 text-amber-700" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 7V3H2V21H22V7H12ZM6 19H4V17H6V19ZM6 15H4V13H6V15ZM6 11H4V9H6V11ZM6 7H4V5H6V7ZM10 19H8V17H10V19ZM10 15H8V13H10V15ZM10 11H8V9H10V11ZM10 7H8V5H10V7ZM20 19H12V17H14V15H12V13H14V11H12V9H20V19ZM18 11H16V13H18V11ZM18 15H16V17H18V15Z"/>
                  </svg>
                </div>
              </div>
              <div className="relative">
                <div className="w-[72px] h-[79px] rounded-lg overflow-hidden bg-stone-200">
                  <div className="w-full h-full bg-gradient-to-br from-stone-300 to-stone-400 flex items-center justify-center">
                    <svg className="w-8 h-8 text-stone-600" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 3L2 12H5V20H11V14H13V20H19V12H22L12 3Z"/>
                    </svg>
                  </div>
                </div>
                <div className="absolute -top-2 ltr:-right-2 rtl:-left-2 w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#ae976d" }}>
                  <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 7V3H2V21H22V7H12ZM10 19H4V17H10V19ZM10 15H4V13H10V15ZM10 11H4V9H10V11ZM10 7H4V5H10V7ZM20 19H12V9H20V19ZM18 11H14V13H18V11ZM18 15H14V17H18V15Z"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute bottom-20 ltr:right-10 rtl:left-10 w-96 h-48 opacity-30">
            <svg viewBox="0 0 400 200" fill="none" className="w-full h-full">
              <path d="M0 150 Q100 100 200 120 Q300 140 400 80" stroke="#d1d5db" strokeWidth="1" fill="none"/>
              <path d="M50 180 Q150 130 250 150 Q350 170 400 110" stroke="#d1d5db" strokeWidth="1" fill="none"/>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
