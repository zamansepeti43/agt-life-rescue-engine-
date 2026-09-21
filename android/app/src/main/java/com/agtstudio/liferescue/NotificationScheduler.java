package com.agtstudio.liferescue;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import org.json.JSONObject;
import java.util.Calendar;

public final class NotificationScheduler {
    private static final String PREFS = "life_rescue_notifications";
    private NotificationScheduler() {}

    static void schedule(Context context, String id, String title, String body, long at, String url) {
        schedule(context, id, title, body, at, url, "");
    }

    static void schedule(Context context, String id, String title, String body, long at, String url, String recurrence) {
        if (id == null || id.isEmpty()) return;
        String safeRecurrence = recurrence == null ? "" : recurrence;
        long target = nextFutureTime(at, safeRecurrence);
        if (target <= 0) {
            context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().remove(id).apply();
            return;
        }

        try {
            JSONObject record = new JSONObject();
            record.put("id", id);
            record.put("title", title == null ? "İZCİ" : title);
            record.put("body", body == null ? "" : body);
            record.put("at", target);
            record.put("url", url == null ? "/izci" : url);
            record.put("recurrence", safeRecurrence);
            context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString(id, record.toString()).apply();
        } catch (Exception ignored) {}

        Intent intent = new Intent(context, NotificationReceiver.class);
        intent.putExtra("id", id);
        intent.putExtra("title", title);
        intent.putExtra("body", body);
        intent.putExtra("url", url);
        intent.putExtra("recurrence", safeRecurrence);

        PendingIntent pending = PendingIntent.getBroadcast(
            context, stableId(id), intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        AlarmManager alarms = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarms == null) return;

        if (Build.VERSION.SDK_INT >= 31 && alarms.canScheduleExactAlarms()) {
            alarms.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, target, pending);
        } else if (Build.VERSION.SDK_INT >= 23) {
            alarms.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, target, pending);
        } else {
            alarms.set(AlarmManager.RTC_WAKEUP, target, pending);
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
        android.content.SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        for (String key : prefs.getAll().keySet()) {
            try {
                JSONObject record = new JSONObject(prefs.getString(key, "{}"));
                schedule(
                    context,
                    record.getString("id"),
                    record.optString("title", "İZCİ"),
                    record.optString("body", ""),
                    record.getLong("at"),
                    record.optString("url", "/izci"),
                    record.optString("recurrence", "")
                );
            } catch (Exception ignored) {}
        }
    }

    private static long nextFutureTime(long at, String recurrence) {
        if (at > System.currentTimeMillis()) return at;
        if (recurrence == null || recurrence.isEmpty()) return -1;

        Calendar next = Calendar.getInstance();
        next.setTimeInMillis(at);
        Calendar now = Calendar.getInstance();

        while (next.getTimeInMillis() <= now.getTimeInMillis()) {
            if ("daily".equals(recurrence)) next.add(Calendar.DAY_OF_YEAR, 1);
            else if ("weekly".equals(recurrence)) next.add(Calendar.WEEK_OF_YEAR, 1);
            else if ("monthly".equals(recurrence)) next.add(Calendar.MONTH, 1);
            else return -1;
        }
        return next.getTimeInMillis();
    }

    private static int stableId(String value) { return value == null ? 0 : value.hashCode() & 0x7fffffff; }
}