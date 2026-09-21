package com.agtstudio.liferescue;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import java.util.Calendar;

public class NotificationReceiver extends BroadcastReceiver {
    private static final String CHANNEL_ID = "life_rescue_reminders";

    @Override public void onReceive(Context context, Intent intent) {
        String id = intent.getStringExtra("id");
        String title = intent.getStringExtra("title");
        String body = intent.getStringExtra("body");
        String url = intent.getStringExtra("url");
        String recurrence = intent.getStringExtra("recurrence");

        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager == null) return;

        if (Build.VERSION.SDK_INT >= 26) {
            manager.createNotificationChannel(new NotificationChannel(
                CHANNEL_ID, "İZCİ Hatırlatıcıları", NotificationManager.IMPORTANCE_HIGH
            ));
        }

        Intent open = new Intent(context, MainActivity.class);
        open.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent pending = PendingIntent.getActivity(
            context,
            stableId(id),
            open,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        android.app.Notification.Builder builder = Build.VERSION.SDK_INT >= 26
            ? new android.app.Notification.Builder(context, CHANNEL_ID)
            : new android.app.Notification.Builder(context);

        builder.setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle(title == null ? "İZCİ" : title)
            .setContentText(body == null ? "Bir hatırlatıcın var." : body)
            .setAutoCancel(true)
            .setContentIntent(pending)
            .setPriority(android.app.Notification.PRIORITY_HIGH);

        manager.notify(stableId(id), builder.build());

        if (recurrence != null && !recurrence.isEmpty() && id != null) {
            Calendar next = Calendar.getInstance();
            if ("daily".equals(recurrence)) next.add(Calendar.DAY_OF_YEAR, 1);
            else if ("weekly".equals(recurrence)) next.add(Calendar.WEEK_OF_YEAR, 1);
            else if ("monthly".equals(recurrence)) next.add(Calendar.MONTH, 1);
            else recurrence = "";

            if (!recurrence.isEmpty()) {
                NotificationScheduler.schedule(
                    context, id, title, body, next.getTimeInMillis(), url == null ? "/izci" : url, recurrence
                );
            }
        } else if (id != null) {
            context.getSharedPreferences("life_rescue_notifications", Context.MODE_PRIVATE)
                .edit().remove(id).apply();
        }
    }

    private static int stableId(String value) {
        return value == null ? 0 : (value.hashCode() & 0x7fffffff);
    }
}
