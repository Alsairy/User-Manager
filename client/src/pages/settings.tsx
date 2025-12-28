import { Settings as SettingsIcon, Bell, Lock, Globe, Database } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

export default function Settings() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold" data-testid="text-page-title">System Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure system-wide settings and preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <SettingsIcon className="h-5 w-5" />
            General Settings
          </CardTitle>
          <CardDescription>
            Basic system configuration options
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Session Timeout</Label>
              <p className="text-xs text-muted-foreground">
                Automatically log users out after inactivity
              </p>
            </div>
            <Select defaultValue="30">
              <SelectTrigger className="w-[140px]" data-testid="select-session-timeout">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="60">60 minutes</SelectItem>
                <SelectItem value="120">2 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Invitation Expiry</Label>
              <p className="text-xs text-muted-foreground">
                How long invitation links remain valid
              </p>
            </div>
            <Select defaultValue="7">
              <SelectTrigger className="w-[140px]" data-testid="select-invitation-expiry">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 day</SelectItem>
                <SelectItem value="3">3 days</SelectItem>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="14">14 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lock className="h-5 w-5" />
            Security Settings
          </CardTitle>
          <CardDescription>
            Configure security and access controls
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Account Lockout</Label>
              <p className="text-xs text-muted-foreground">
                Lock accounts after failed login attempts
              </p>
            </div>
            <Switch defaultChecked data-testid="switch-account-lockout" />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Max Failed Attempts</Label>
              <p className="text-xs text-muted-foreground">
                Number of attempts before lockout
              </p>
            </div>
            <Select defaultValue="5">
              <SelectTrigger className="w-[100px]" data-testid="select-max-attempts">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3</SelectItem>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Two-Factor Authentication</Label>
              <p className="text-xs text-muted-foreground">
                Require MFA for all users
              </p>
            </div>
            <Switch data-testid="switch-mfa" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>
            Email notification preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">New User Notifications</Label>
              <p className="text-xs text-muted-foreground">
                Email admin when new users are created
              </p>
            </div>
            <Switch defaultChecked data-testid="switch-new-user-notify" />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Login Alerts</Label>
              <p className="text-xs text-muted-foreground">
                Notify on suspicious login activity
              </p>
            </div>
            <Switch defaultChecked data-testid="switch-login-alerts" />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Role Changes</Label>
              <p className="text-xs text-muted-foreground">
                Notify when user roles are modified
              </p>
            </div>
            <Switch data-testid="switch-role-changes" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Globe className="h-5 w-5" />
            Localization
          </CardTitle>
          <CardDescription>
            Regional and language settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Language</Label>
              <p className="text-xs text-muted-foreground">
                Default system language
              </p>
            </div>
            <Select defaultValue="en">
              <SelectTrigger className="w-[140px]" data-testid="select-language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="ar">Arabic</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Date Format</Label>
              <p className="text-xs text-muted-foreground">
                How dates are displayed
              </p>
            </div>
            <Select defaultValue="mdy">
              <SelectTrigger className="w-[160px]" data-testid="select-date-format">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mdy">MM/DD/YYYY</SelectItem>
                <SelectItem value="dmy">DD/MM/YYYY</SelectItem>
                <SelectItem value="ymd">YYYY-MM-DD</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Database className="h-5 w-5" />
            Data Retention
          </CardTitle>
          <CardDescription>
            Configure how long data is stored
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Audit Log Retention</Label>
              <p className="text-xs text-muted-foreground">
                How long to keep audit logs
              </p>
            </div>
            <Select defaultValue="365">
              <SelectTrigger className="w-[140px]" data-testid="select-audit-retention">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="90">90 days</SelectItem>
                <SelectItem value="180">180 days</SelectItem>
                <SelectItem value="365">1 year</SelectItem>
                <SelectItem value="730">2 years</SelectItem>
                <SelectItem value="0">Forever</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Soft Delete Period</Label>
              <p className="text-xs text-muted-foreground">
                Days before permanently deleting archived users
              </p>
            </div>
            <Select defaultValue="30">
              <SelectTrigger className="w-[140px]" data-testid="select-delete-period">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
                <SelectItem value="0">Never</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
