    // backend/add_amount_paid_column.js (or modify existing script)
    const sqlite3 = require('sqlite3').verbose();
    const path = require('path');

    const dbPath = path.join(__dirname, 'inventory.db');

    console.log(`[Info] Attempting to connect to database at: ${dbPath}`);

    const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
        if (err) {
            console.error(`[Error] Could not open database ${dbPath}: ${err.message}`);
            console.error("[Detail] Please ensure the database file exists and the application has permissions.");
            return;
        }
        console.log(`[Success] Successfully connected to the SQLite database: ${dbPath}`);

        const columnName = 'amountPaid'; // Column to add/check
        const columnDefinition = 'REAL DEFAULT 0.0'; // Definition for the new column
        const alterTableSql = `ALTER TABLE sales ADD COLUMN ${columnName} ${columnDefinition}`;

        db.all("PRAGMA table_info(sales)", (pragmaErr, columns) => {
            if (pragmaErr) {
                console.error("[Error] Error fetching table info for 'sales':", pragmaErr.message);
                db.close(() => console.log("[Info] Database connection closed after PRAGMA error."));
                return;
            }

            if (!columns || columns.length === 0) {
                console.error(`[Error] Table 'sales' does not exist in the database ${dbPath}. Cannot add column.`);
                db.close(() => console.log("[Info] Database connection closed because 'sales' table is missing."));
                return;
            }

            const columnExists = columns.some(col => col.name === columnName);

            if (columnExists) {
                console.log(`[Info] Column '${columnName}' already exists in 'sales' table. No action taken.`);
                db.close((closeErr) => {
                    if (closeErr) console.error('[Error] Error closing database:', closeErr.message);
                    else console.log(`[Info] Database connection closed (column '${columnName}' already existed).`);
                });
            } else {
                console.log(`[Info] Column '${columnName}' not found. Attempting to add it to 'sales' table...`);
                db.run(alterTableSql, function(alterErr) {
                    if (alterErr) {
                        console.error(`[Error] Error adding '${columnName}' column to 'sales' table:`, alterErr.message);
                    } else {
                        console.log(`[Success] Column '${columnName}' added successfully to 'sales' table.`);
                        console.log("[Info] If no error messages appeared above, the column should now exist.");
                    }
                    db.close((closeErr) => {
                        if (closeErr) console.error('[Error] Error closing database:', closeErr.message);
                        else console.log(`[Info] Database connection closed (after attempting to add '${columnName}').`);
                    });
                });
            }
        });
    });
    