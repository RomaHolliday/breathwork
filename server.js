const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
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

  const { data, error } = await supabase
    .from('breathwork_logs')
    .upsert({ date, short_count, long_done }, { onConflict: 'date' })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Breathwork running on port ${PORT}`));
