const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function cleanDatabase() {
    console.log('--- Database Cleanup Started ---');

    try {
        // 1. Get protected names from system_users
        console.log('Fetching protected users...');
        const { data: sysUsers, error: sysError } = await supabase.from('system_users').select('name');
        if (sysError) throw sysError;
        const protectedNames = new Set(sysUsers.map(u => u.name?.trim().toLowerCase()).filter(Boolean));
        console.log(`Found ${protectedNames.size} protected names.`);

        // 2. Fetch all clients
        console.log('Fetching all clients...');
        // We fetch EVERYTHING to be sure we find duplicates
        const { data: clients, error: cliError } = await supabase.from('clients').select('id, name');
        if (cliError) throw cliError;
        console.log(`Found ${clients.length} total clients.`);

        const toDelete = [];
        const seenNames = new Map(); // nameLower -> id to keep

        for (const client of clients) {
            const rawName = client.name || '';
            const name = rawName.trim();
            const nameLower = name.toLowerCase();

            // Rule 1: Remove names composed only of numbers (e.g. phone numbers in name field)
            if (/^\d+$/.test(name.replace(/\s/g, ''))) {
                console.log(`Marking for deletion (Numeric name): "${name}" (ID: ${client.id})`);
                toDelete.push(client.id);
                continue;
            }

            // Rule 2: Remove duplicates (keep 1, prefer the one that is a system user if applicable)
            if (seenNames.has(nameLower)) {
                const isCurrentProtected = protectedNames.has(nameLower);
                const existingId = seenNames.get(nameLower);

                if (isCurrentProtected) {
                    console.log(`Duplicate found for protected name "${name}". Keeping Protected ID ${client.id}, deleting previous ID ${existingId}`);
                    toDelete.push(existingId);
                    seenNames.set(nameLower, client.id);
                } else {
                    console.log(`Duplicate found for "${name}". Marking duplicate ID ${client.id} for deletion.`);
                    toDelete.push(client.id);
                }
            } else {
                seenNames.set(nameLower, client.id);
            }
        }

        if (toDelete.length > 0) {
            console.log(`Deleting ${toDelete.length} records...`);
            // Use unique IDs only
            const uniqueToDelete = [...new Set(toDelete)];
            for (let i = 0; i < uniqueToDelete.length; i += 50) {
                const chunk = uniqueToDelete.slice(i, i + 50);
                const { error: delError } = await supabase.from('clients').delete().in('id', chunk);
                if (delError) console.error('Delete error:', delError.message);
                else console.log(`Deleted chunk ${Math.floor(i / 50) + 1}`);
            }
        } else {
            console.log('No duplicates or numeric names found.');
        }

        // 3. Fix Products (Optional Fix)
        try {
            console.log('Checking products for missing status...');
            const { data: prods, error: pError } = await supabase.from('products').select('id, name');
            // We don't select 'status' because it might not exist yet
            if (!pError) {
                // Just checking if we can access the table
                console.log(`Successfully accessed products table (${prods.length} items).`);
            }
        } catch (e) {
            console.log('Note: Could not access products table during optional fix.');
        }

        console.log('--- Cleanup Finished ---');
    } catch (err) {
        console.error('Cleanup failed:', err.message);
    }
}

cleanDatabase();
