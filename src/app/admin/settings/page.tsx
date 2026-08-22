import { getSettings } from "@/lib/auction";
import { AdminNav } from "@/components/admin-nav";
import { updateSettingsAction } from "@/app/actions/admin";
import { centsToDollars } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <h1 className="text-4xl font-semibold tracking-tight">Settings</h1>
      <div className="mt-8">
        <AdminNav />
      </div>
      <form action={updateSettingsAction} className="mt-10 grid gap-5">
        <label className="grid gap-2 text-sm">
          Site name
          <input name="siteName" defaultValue={settings.siteName} className="rounded-2xl border border-line px-4 py-3" />
        </label>
        <label className="grid gap-2 text-sm">
          Support email
          <input name="supportEmail" type="email" defaultValue={settings.supportEmail} className="rounded-2xl border border-line px-4 py-3" />
        </label>
        <label className="grid gap-2 text-sm">
          Starting bid (USD)
          <input
            name="startingBidDollars"
            type="number"
            min={1}
            defaultValue={centsToDollars(settings.startingBidCents)}
            className="rounded-2xl border border-line px-4 py-3"
          />
        </label>
        <label className="grid gap-2 text-sm">
          Minimum increment (USD)
          <input
            name="minIncrementDollars"
            type="number"
            min={1}
            defaultValue={centsToDollars(settings.minIncrementCents)}
            className="rounded-2xl border border-line px-4 py-3"
          />
        </label>
        <label className="grid gap-2 text-sm">
          History list length
          <input name="leaderboardLimit" type="number" defaultValue={settings.leaderboardLimit} className="rounded-2xl border border-line px-4 py-3" />
        </label>
        <label className="flex items-center gap-3 text-sm">
          <input type="checkbox" name="requireApproval" defaultChecked={settings.requireApproval} />
          Require approval before a paid listing can occupy #1
        </label>
        <label className="grid gap-2 text-sm">
          Advertising rules
          <textarea name="advertisingRules" rows={8} defaultValue={settings.advertisingRules} className="rounded-2xl border border-line px-4 py-3" />
        </label>
        <button className="rounded-lg bg-gold py-3 text-sm text-white">Save settings</button>
      </form>
    </div>
  );
}
