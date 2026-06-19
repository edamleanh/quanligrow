const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pvlyaubewwhgzhirmwgi.supabase.co';
const supabaseKey = 'sb_publishable_aBQHszEUh4jdxO7ebD9DCg_tH-Qi3kw';
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        if (req.method === 'GET') {
            const { data, error } = await supabase
                .from('ds_tong')
                .select('Ghi chú')
                .eq('STT', 99999)
                .single();
                
            if (error && error.code !== 'PGRST116') {
                throw error;
            }
            
            let statusData = {};
            if (data && data['Ghi chú']) {
                try {
                    statusData = JSON.parse(data['Ghi chú']);
                } catch(e) {}
            }
            res.json(statusData);
        } else if (req.method === 'POST') {
            // Buffer to JSON
            let bodyStr = '';
            req.on('data', chunk => { bodyStr += chunk.toString(); });
            await new Promise((resolve) => req.on('end', resolve));
            
            let configStr = bodyStr;
            try {
                // To ensure it's valid JSON
                JSON.parse(bodyStr); 
            } catch(e) {
                return res.status(400).json({ error: "Invalid JSON" });
            }
            
            // Check if exists
            const { data: existing } = await supabase
                .from('ds_tong')
                .select('STT')
                .eq('STT', 99999)
                .single();
                
            if (existing) {
                await supabase
                    .from('ds_tong')
                    .update({ 'Ghi chú': configStr })
                    .eq('STT', 99999);
            } else {
                await supabase
                    .from('ds_tong')
                    .insert({ 
                        STT: 99999, 
                        'HỌ': 'SYSTEM', 
                        'TÊN': 'CONFIG', 
                        'Ghi chú': configStr 
                    });
            }
            res.json({ success: true });
        }
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};
