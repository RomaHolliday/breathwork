const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
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

// Upsert today's log — auto-assigns issue_number if new day
app.post('/api/logs', async (req, res) => {
  const { date, short_count, long_done } = req.body;
  if (!date) return res.status(400).json({ error: 'date required' });

  // Check if today already exists
  const { data: existing } = await supabase
    .from('breathwork_logs')
    .select('issue_number')
    .eq('date', date)
    .maybeSingle();

  let issue_number = existing?.issue_number;

  if (!issue_number) {
    // Get the highest issue number so far
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Breathwork running on port ${PORT}`));
