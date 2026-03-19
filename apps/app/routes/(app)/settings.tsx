import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Separator,
  Switch,
} from "@repo/ui";
import { createFileRoute } from "@tanstack/react-router";
import {
  Bell,
  Calculator,
  CreditCard,
  Palette,
  Shield,
  User,
  Upload,
} from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { trpcClient } from "../../lib/trpc";

export const Route = createFileRoute("/(app)/settings")({
  component: Settings,
});

function Settings() {
  const { t } = useTranslation();
  const [promptPayId, setPromptPayId] = useState("");
  const [shopLogo, setShopLogo] = useState<string | null>(null);
  const [vatRate, setVatRate] = useState(7.0);
  const [vatSaving, setVatSaving] = useState(false);
  const [vatMessage, setVatMessage] = useState<string | null>(null);

  useEffect(() => {
    trpcClient.organization.getSettings
      .query()
      .then((settings) => setVatRate(settings.vatRate))
      .catch(() => {});
  }, []);

  const handleSaveVat = async () => {
    setVatSaving(true);
    setVatMessage(null);
    try {
      const result = await trpcClient.organization.updateSettings.mutate({
        vatRate,
      });
      setVatRate(result.vatRate);
      setVatMessage("VAT rate saved successfully");
    } catch {
      setVatMessage("Failed to save VAT rate");
    } finally {
      setVatSaving(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setShopLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold">{t("settings.title")}</h2>
        <p className="text-muted-foreground">{t("settings.subtitle")}</p>
      </div>

      <div className="grid gap-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" />
              <CardTitle>{t("settings.profile")}</CardTitle>
            </div>
            <CardDescription>{t("settings.profileDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">{t("settings.name")}</Label>
              <Input id="name" placeholder={t("settings.name")} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">{t("settings.email")}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t("settings.email")}
              />
            </div>
            <Button>{t("settings.saveChanges")}</Button>
          </CardContent>
        </Card>

        {/* Payment Configuration (FR-WEB-03) */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              <CardTitle>{t("settings.payment")}</CardTitle>
            </div>
            <CardDescription>{t("settings.paymentDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="promptpay">{t("settings.promptPayId")}</Label>
              <Input
                id="promptpay"
                placeholder={t("settings.promptPayIdPlaceholder")}
                value={promptPayId}
                onChange={(e) => setPromptPayId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {t("settings.promptPayIdPlaceholder")}
              </p>
            </div>
            <Separator />
            <div className="grid gap-2">
              <Label>{t("settings.shopLogo")}</Label>
              <div className="flex items-center gap-4">
                {shopLogo ? (
                  <img
                    src={shopLogo}
                    alt="Shop Logo"
                    className="h-16 w-16 object-contain rounded border"
                  />
                ) : (
                  <div className="h-16 w-16 rounded border border-dashed flex items-center justify-center">
                    <Upload className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <input
                    id="logo"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById("logo")?.click()}
                  >
                    {t("settings.uploadLogo")}
                  </Button>
                </div>
              </div>
            </div>
            <Button>{t("settings.saveChanges")}</Button>
          </CardContent>
        </Card>

        {/* Tax Configuration (F-007) */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              <CardTitle>Tax Configuration</CardTitle>
            </div>
            <CardDescription>
              Configure VAT rate for your organization. Changes apply to new
              orders only.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="vat-rate">VAT Rate (%)</Label>
              <Input
                id="vat-rate"
                type="number"
                min={0}
                max={100}
                step={0.01}
                value={vatRate}
                onChange={(e) => setVatRate(parseFloat(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">
                Thailand standard VAT is 7%. Set to 0% for VAT-exempt
                businesses.
              </p>
            </div>
            {vatMessage && (
              <p
                className={`text-sm ${vatMessage.includes("Failed") ? "text-destructive" : "text-green-600"}`}
              >
                {vatMessage}
              </p>
            )}
            <Button onClick={handleSaveVat} disabled={vatSaving}>
              {vatSaving ? "Saving..." : "Save VAT Rate"}
            </Button>
          </CardContent>
        </Card>

        {/* Language Settings (5.1) */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              <CardTitle>{t("settings.language")}</CardTitle>
            </div>
            <CardDescription>{t("settings.languageDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <LanguageSwitcher />
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <CardTitle>{t("settings.notifications")}</CardTitle>
            </div>
            <CardDescription>{t("settings.notificationsDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-notifications">
                  {t("settings.emailNotifications")}
                </Label>
              </div>
              <Switch id="email-notifications" />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="push-notifications">
                  {t("settings.pushNotifications")}
                </Label>
              </div>
              <Switch id="push-notifications" />
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <CardTitle>{t("settings.security")}</CardTitle>
            </div>
            <CardDescription>{t("settings.securityDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline">{t("settings.changePassword")}</Button>
            <Button variant="outline">{t("settings.enable2FA")}</Button>
          </CardContent>
        </Card>

        {/* Appearance Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              <CardTitle>{t("settings.appearance")}</CardTitle>
            </div>
            <CardDescription>{t("settings.appearanceDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="dark-mode">{t("settings.darkMode")}</Label>
              </div>
              <Switch id="dark-mode" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
