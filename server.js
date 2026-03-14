const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const webpush = require('web-push');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

webpush.setVapidDetails(
  'mailto:admin@gauntlet.app',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Get all logs
app.get('/api/logs', async (req, res) => {
  const { data, error } = await supabase
    .from('breathwork_logs')
    .select('*')
    .order('date', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Upsert today's log
app.post('/api/logs', async (req, res) => {
  const { date, short_count, long_done } = req.body;
  if (!date) return res.status(400).json({ error: 'date required' });

  const { data: existing } = await supabase
    .from('breathwork_logs')
    .select('issue_number')
    .eq('date', date)
    .maybeSingle();

  let issue_number = existing?.issue_number;
  if (!issue_number) {
    const { data: latest } = await supabase
      .from('breathwork_logs')
      .select('issue_number')
      .order('issue_number', { ascending: false })
      .limit(1)
      .maybeSingle();
    issue_number = (latest?.issue_number ?? 0) + 1;
  }

  const { data, error } = await supabase
    .from('breathwork_logs')
    .upsert({ date, short_count, long_done, issue_number }, { onConflict: 'date' })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Save push subscription
app.post('/api/subscribe', async (req, res) => {
  const { subscription } = req.body;
  if (!subscription) return res.status(400).json({ error: 'subscription required' });

  const { error } = await supabase
    .from('push_subscriptions')
    .upsert({ endpoint: subscription.endpoint, subscription: JSON.stringify(subscription) },
             { onConflict: 'endpoint' });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// Send push notification
app.post('/api/notify', async (req, res) => {
  const { endpoint } = req.body;

  let query = supabase.from('push_subscriptions').select('subscription');
  if (endpoint) query = query.eq('endpoint', endpoint);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  const payload = JSON.stringify({
    title: 'The Gauntlet',
    body: 'Time for your next stone. ⚡',
  });

  const results = await Promise.allSettled(
    data.map(row => webpush.sendNotification(JSON.parse(row.subscription), payload))
  );

  // Clean up expired subscriptions
  const expired = results
    .map((r, i) => r.status === 'rejected' ? data[i] : null)
    .filter(Boolean);

  if (expired.length) {
    await supabase.from('push_subscriptions')
      .delete()
      .in('endpoint', expired.map(r => JSON.parse(r.subscription).endpoint));
  }

  res.json({ sent: results.filter(r => r.status === 'fulfilled').length });
});

// VAPID public key for client
app.get('/api/vapid-public-key', (req, res) => {
  res.json({ key: process.env.VAPID_PUBLIC_KEY });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Gauntlet running on port ${PORT}`));
