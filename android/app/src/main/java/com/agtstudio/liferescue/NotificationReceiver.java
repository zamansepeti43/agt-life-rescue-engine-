package com.agtstudio.liferescue;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

public class NotificationReceiver extends BroadcastReceiver {
    private static final String CHANNEL_ID = "life_rescue_reminders";

    @Override public void onReceive(Context context, Intent intent) {
        String id = intent.getStringExtra("id");
        String title = intent.getStringExtra("title");
        String body = intent.getStringExtra("body");
        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager == null) return;
        if (Build.VERSION.SDK_INT >= 26) manager.createNotificationChannel(new NotificationChannel(CHANNEL_ID, "İZCİ Hatırlatıcıları", NotificationManager.IMPORTANCE_HIGH));

        Intent open = new Intent(context, MainActivity.class);
        open.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent pending = PendingIntent.getActivity(context, Math.abs((id == null ? "notification" : id).hashCode()), open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        android.app.Notification.Builder builder = Build.VERSION.SDK_INT >= 26
            ? new android.app.Notification.Builder(context, CHANNEL_ID)
            : new android.app.Notification.Builder(context);
        builder.setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle(title == null ? "İZCİ" : title)
            .setContentText(body == null ? "Bir hatırlatıcın var." : body)
            .setAutoCancel(true).setContentIntent(pending)
            .setPriority(android.app.Notification.PRIORITY_HIGH);
        manager.notify(Math.abs((id == null ? "notification" : id).hashCode()), builder.build());
        if (id != null) context.getSharedPreferences("life_rescue_notifications", Context.MODE_PRIVATE).edit().remove(id).apply();
    }
}
