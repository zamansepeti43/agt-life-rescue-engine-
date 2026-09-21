package com.agtstudio.liferescue;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import org.json.JSONObject;

public final class NotificationScheduler {
    private static final String PREFS = "life_rescue_notifications";
    private NotificationScheduler() {}

    static void schedule(Context context, String id, String title, String body, long at, String url) {
        schedule(context, id, title, body, at, url, "");
    }

    static void schedule(Context context, String id, String title, String body, long at, String url, String recurrence) {
        if (at <= System.currentTimeMillis()) return;
        try {
            JSONObject record = new JSONObject();
            record.put("id", id);
            record.put("title", title);
            record.put("body", body);
            record.put("at", at);
            record.put("url", url);
            record.put("recurrence", recurrence == null ? "" : recurrence);
            context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString(id, record.toString()).apply();
        } catch (Exception ignored) {}

        Intent intent = new Intent(context, NotificationReceiver.class);
        intent.putExtra("id", id);
        intent.putExtra("title", title);
        intent.putExtra("body", body);
        intent.putExtra("url", url);
        intent.putExtra("recurrence", recurrence == null ? "" : recurrence);

        PendingIntent pending = PendingIntent.getBroadcast(
            context, stableId(id), intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        AlarmManager alarms = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarms == null) return;

        if (Build.VERSION.SDK_INT >= 23) {
            alarms.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pending);
        } else {
            alarms.set(AlarmManager.RTC_WAKEUP, at, pending);
        }
    }

    static void cancel(Context context, String id) {
        Intent intent = new Intent(context, NotificationReceiver.class);
        PendingIntent pending = PendingIntent.getBroadcast(
            context, stableId(id), intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        AlarmManager alarms = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarms != null) alarms.cancel(pending);
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().remove(id).apply();
    }

    static void restoreAll(Context context) {
        for (String key : context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getAll().keySet()) {
            try {
                JSONObject record = new JSONObject(context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(key, "{}"));
                schedule(
                    context,
                    record.getString("id"),
                    record.getString("title"),
                    record.getString("body"),
                    record.getLong("at"),
                    record.optString("url", "/izci"),
                    record.optString("recurrence", "")
                );
            } catch (Exception ignored) {}
        }
    }

    private static int stableId(String value) { return value.hashCode() & 0x7fffffff; }
}
